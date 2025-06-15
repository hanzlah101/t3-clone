import { z, ZodError } from "zod/v4"
import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { ConvexError } from "convex/values"
import { auth } from "@clerk/nextjs/server"

import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const input = z
      .object({ threadId: z.string(), prompt: z.string().min(1) })
      .parse(body)

    const prompt = input.prompt
    const threadId = input.threadId as Id<"threads">

    const messages = await convex.query(api.messages.getServerMessages, {
      threadId,
      userId
    })

    const lastMessage = messages.pop()

    if (!lastMessage || lastMessage.role !== "assistant") {
      return new Response("No assistant message found", { status: 404 })
    }

    const formattedMessages = messages
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg._creationTime),
        parts: [
          { type: "text", text: msg.content },
          ...(msg.reasoning
            ? [{ type: "reasoning", reasoning: msg.reasoning }]
            : [])
        ]
      }))
      .filter((msg) => !!msg.content)

    formattedMessages.push({
      role: "user",
      content: prompt,
      createdAt: new Date(),
      parts: [{ type: "text", text: prompt }]
    })

    const result = streamText({
      model: google("gemini-2.0-flash-lite"),
      system: "You are a helpful assistant.",
      messages: formattedMessages,
      onError: async ({ error }) => {
        console.log("[LLM_STREAM_ERROR]", error)
        await convex.mutation(api.messages.updateAssistantMessage, {
          _id: lastMessage._id,
          status: "error",
          error:
            "An error occurred while processing your request. Please try again."
        })
      },
      onFinish: async ({ text, reasoning }) => {
        // TODO: handle finish reasons, dynaic status, model, search, topK, topP & search
        await convex.mutation(api.messages.updateAssistantMessage, {
          _id: lastMessage._id,
          content: text,
          status: "completed",
          reasoning,
          model: {
            model: "gemini-2.0-flash-lite",
            search: false
          }
        })
      }
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.log("[API_ERROR]", error)

    if (error instanceof ZodError) {
      return new Response(z.prettifyError(error), { status: 422 })
    }

    if (error instanceof ConvexError) {
      return new Response(error.data, { status: 400 })
    }

    return new Response("Failed to send message", { status: 500 })
  }
}
