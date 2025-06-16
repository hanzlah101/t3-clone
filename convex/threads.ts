import { ConvexError, v } from "convex/values"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

import { api } from "./_generated/api"
import { getModelById, isModelValid } from "@/lib/models"

import { action, mutation, query } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect()

    const threadsWithParents = await Promise.all(
      threads.map(async (thread) => {
        let parentThread = null

        if (thread.branchParentThreadId) {
          parentThread = await ctx.db.get(thread.branchParentThreadId)
        }

        return { ...thread, parentThread }
      })
    )

    return threadsWithParents.sort((a, b) => b.lastMessageAt - a.lastMessageAt)
  }
})

export const create = mutation({
  args: {
    prompt: v.string(),
    modelId: v.string(),
    search: v.boolean()
  },
  handler: async (ctx, { prompt, modelId, search }) => {
    if (!isModelValid(modelId)) throw new ConvexError("Invalid model")
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")
    const userId = identity.subject
    const threadId = await ctx.db.insert("threads", {
      userId,
      modelId,
      title: "New Thread",
      lastMessageAt: Date.now()
    })

    await ctx.runMutation(api.messages.createAssistantAndUserMessages, {
      threadId,
      prompt,
      search
    })

    await ctx.scheduler.runAfter(0, api.threads.generateTitle, {
      prompt,
      threadId
    })

    return threadId
  }
})

export const updateTitle = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      title: args.title,
      updatedAt: Date.now()
    })
  }
})

export const generateTitle = action({
  args: {
    threadId: v.id("threads"),
    prompt: v.string()
  },
  handler: async (ctx, { prompt, threadId }) => {
    try {
      const { text } =
        process.env.NODE_ENV === "production"
          ? await generateText({
              model: google("gemini-2.0-flash-lite"),
              prompt: `Generate a straight forward title for this conversation: ${prompt}`,
              system:
                "Create short, descriptive titles for chat conversations. Focus on the main topic or question. Maximum 15 words. No quotes, emojis, or extra formatting. Just the title.",
              maxTokens: 25,
              temperature: 0.2
            })
          : { text: prompt }

      await ctx.runMutation(api.threads.updateTitle, {
        threadId,
        title: text
      })
    } catch (error) {
      console.error("Error generating thread title", threadId, error)
    }
  }
})

export const getById = query({
  args: {
    threadId: v.id("threads"),
    userId: v.string()
  },
  handler: async (ctx, { threadId, userId }) => {
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("_id"), threadId))
      .unique()

    if (!thread) throw new ConvexError("No thread found")
    return thread
  }
})

export const branchOff = mutation({
  args: {
    messageId: v.id("messages")
  },
  handler: async (ctx, { messageId }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new ConvexError("Unauthorized")

    const message = await ctx.db
      .query("messages")
      .withIndex("by_user_id", (q) => q.eq("userId", user.subject))
      .filter((q) => q.eq(q.field("_id"), messageId))
      .unique()

    if (!message || message.role !== "assistant") {
      throw new ConvexError("No message found")
    }

    const thread = await ctx.db.get(message.threadId)
    if (!thread) throw new ConvexError("Thread not found")

    const messagesBefore = await ctx.db
      .query("messages")
      .withIndex("by_thread_id", (q) =>
        q
          .eq("threadId", message.threadId)
          .lte("_creationTime", message._creationTime)
      )

      .collect()

    const newThreadId = await ctx.db.insert("threads", {
      title: thread.title,
      userId: thread.userId,
      lastMessageAt: Date.now(),
      branchParentThreadId: thread._id,
      modelId: thread.modelId
    })

    for (const { _id, _creationTime, ...oldMessage } of messagesBefore) {
      await ctx.db.insert("messages", { ...oldMessage, threadId: newThreadId })
    }

    return newThreadId
  }
})

export const getThreadModel = query({
  args: {
    threadId: v.optional(v.id("threads"))
  },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    if (!threadId) return null

    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("_id"), threadId))
      .unique()

    if (thread) {
      return getModelById(thread.modelId).id ?? null
    }

    return null
  }
})

export const updateThreadModel = mutation({
  args: {
    threadId: v.id("threads"),
    modelId: v.string()
  },
  handler: async (ctx, { threadId, modelId }) => {
    if (!isModelValid(modelId)) throw new ConvexError("Invalid model")

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("_id"), threadId))
      .unique()

    if (!thread) throw new ConvexError("Thread not found")

    await ctx.db.patch(threadId, { modelId })
  }
})
