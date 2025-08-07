import { z, ZodError } from "zod/v4"
import { smoothStream, streamText, type ToolSet } from "ai"
import { ConvexError } from "convex/values"
import { auth } from "@clerk/nextjs/server"

import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { getModelById } from "@/lib/models"
import { getModelProvider } from "@/lib/model-providers"
import { webSearch } from "@/lib/search-tool"
import { DEFAULT_ERROR } from "@/lib/constants"
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

    const thread = await convex.query(api.threads.getByUserId, {
      threadId,
      userId,
      allowShared: true
    })

    const messages = await convex.query(api.messages.listInternal, {
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

    const abortController = new AbortController()

    const search = lastMessage.model?.search ?? false

    const modelConfig = getModelById(thread.modelId)
    const modelProvider = getModelProvider(modelConfig, search)

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

    let content = ""
    let reasoning = ""

    const result = streamText({
      model: modelProvider,
      abortSignal: abortController.signal,
      system: search
        ? `You are a helpful AI assistant with access to real-time web search capabilities.

IMPORTANT SEARCH GUIDELINES:
- For ANY question that could benefit from current, recent, or factual information, you MUST use the webSearch tool first
- Always search for the most recent and accurate information before providing answers
- Use web search for: current events, recent developments, factual data, statistics, product information, technical documentation, news, etc.
- Provide comprehensive answers based on the search results
- Cite sources when possible and mention when information is from web search
- If initial search results aren't sufficient, perform additional targeted searches with different queries

Your approach:
1. Analyze the user's question
2. If it could benefit from current/factual information, use webSearch immediately
3. Provide a well-researched, accurate response based on the findings`
        : "You are a helpful AI assistant. Provide accurate, helpful, and informative responses based on your knowledge.",
      messages: formattedMessages,
      maxTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      maxSteps: search ? 3 : 1,
      tools,
      ...(search && Object.keys(tools).length > 0
        ? { toolChoice: "required" }
        : {}),
      experimental_transform: smoothStream(),
      onChunk: ({ chunk }) => {
        if (chunk.type === "reasoning") {
          reasoning += chunk.textDelta
        }

        if (chunk.type === "text-delta") {
          content += chunk.textDelta
        }
      },
      onFinish: async ({ text, reasoning }) => {
        await convex.mutation(api.messages.update, {
          _id: lastMessage._id,
          content: text,
          status: "completed",
          reasoning
        })
      },
      onError: async ({ error }) => {
        console.log("[LLM_STREAM_ERROR]", error)

        await convex.mutation(api.messages.update, {
          _id: lastMessage._id,
          status: "error",
          reasoning: reasoning ?? undefined,
          content: content ?? "",
          error: DEFAULT_ERROR
        })
      }
    })

    req.signal?.addEventListener("abort", async () => {
      abortController.abort()
      if (!lastMessage || lastMessage.role !== "assistant") {
        return
      }

      await convex.mutation(api.messages.update, {
        _id: lastMessage._id,
        reasoning: reasoning ?? undefined,
        content: content ?? "User disconnected",
        status: "disconnected",
        error: "User disconnected"
      })
    })

    return result.toDataStreamResponse({ sendReasoning: true })
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
