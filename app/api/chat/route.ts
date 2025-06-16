import { z, ZodError } from "zod/v4"
import { streamText, type ToolSet } from "ai"
import { ConvexError } from "convex/values"
import { auth } from "@clerk/nextjs/server"

import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { getModelById } from "@/lib/models"
import { getModelProvider } from "@/lib/model-providers"
import { webSearch } from "@/lib/search-tool"
import { type Id } from "@/convex/_generated/dataModel"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { prompt, ...input } = z
      .object({ threadId: z.string(), prompt: z.string().min(1) })
      .parse(body)

    const threadId = input.threadId as Id<"threads">

    const thread = await convex.query(api.threads.getById, {
      threadId,
      userId
    })

    const modelConfig = getModelById(thread.modelId)
    const modelProvider = getModelProvider(modelConfig)

    const messages = await convex.query(api.messages.getServerMessages, {
      threadId,
      userId
    })

    const lastMessage = messages.at(-1)

    if (
      !lastMessage ||
      lastMessage.role !== "assistant" ||
      lastMessage.content !== ""
    ) {
      return new Response("No assistant message found", { status: 404 })
    }

    const search = lastMessage.model?.search ?? false

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

    const tools: ToolSet = {}

    if (search) {
      tools.webSearch = webSearch
    }

    const result = streamText({
      model: modelProvider,
      system: "You are a helpful assistant.",
      messages: formattedMessages,
      maxTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      maxSteps: search ? 2 : 1,
      tools,
      onError: async ({ error }) => {
        console.log("[LLM_STREAM_ERROR]", error)
        const message =
          "An error occurred while processing your request. Please try again."
        await convex.mutation(api.messages.updateAssistantMessage, {
          _id: lastMessage._id,
          status: "error",
          content: message,
          error: message
        })
      },
      onFinish: async ({ text, reasoning }) => {
        // TODO: handle finish reasons, dynamic status, model, search, topK, topP & search
        await convex.mutation(api.messages.updateAssistantMessage, {
          _id: lastMessage._id,
          content: text,
          status: "completed",
          reasoning
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
