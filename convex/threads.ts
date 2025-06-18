import { ConvexError, v } from "convex/values"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

import { api, internal } from "./_generated/api"
import { getModelById, isModelValid } from "@/lib/models"

import { shareAccess } from "./schema"
import { type Doc } from "./_generated/dataModel"
import {
  internalAction,
  internalMutation,
  mutation,
  query
} from "./_generated/server"

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
          if (parentThread?.userId !== identity.subject) {
            parentThread = null
          }
        }

        return { ...thread, parentThread }
      })
    )

    return threadsWithParents.sort((a, b) => b.lastMessageAt - a.lastMessageAt)
  }
})

export const create = mutation({
  args: {
    threadId: v.optional(v.id("threads")),
    shareId: v.optional(v.string()),
    modelId: v.optional(v.string()),
    prompt: v.string(),
    search: v.boolean()
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new ConvexError("Unauthorized")

    if (args.threadId) {
      const thread = await ctx.runQuery(api.threads.getByUserId, {
        threadId: args.threadId,
        userId: user.subject
      })

      await ctx.runMutation(internal.messages.initMessages, {
        threadId: args.threadId,
        prompt: args.prompt,
        search: args.search,
        userId: user.subject,
        modelId: thread.modelId
      })

      return null
    }

    if (args.shareId) {
      const thread = await ctx.db
        .query("threads")
        .withIndex("by_shared_thread_id", (q) =>
          q.eq("sharedThreadId", args.shareId)
        )
        .unique()

      if (!thread) throw new ConvexError("Thread not found")

      if (thread.shareAccess === "editable") {
        await ctx.runMutation(internal.messages.initMessages, {
          threadId: thread._id,
          prompt: args.prompt,
          search: args.search,
          userId: user.subject,
          modelId: thread.modelId
        })

        return { oldThreadId: thread._id }
      }

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_thread_id", (q) => q.eq("threadId", thread._id))
        .collect()

      const newThreadId = await ctx.db.insert("threads", {
        title: thread.title,
        userId: user.subject,
        lastMessageAt: Date.now(),
        modelId: thread.modelId
      })

      for (const { _id, _creationTime, ...oldMessage } of messages) {
        await ctx.db.insert("messages", {
          ...oldMessage,
          threadId: newThreadId
        })
      }

      await ctx.runMutation(internal.messages.initMessages, {
        threadId: newThreadId,
        prompt: args.prompt,
        search: args.search,
        userId: user.subject,
        modelId: thread.modelId
      })

      return { newThreadId }
    }

    const newThreadId = await ctx.db.insert("threads", {
      title: "New Thread",
      userId: user.subject,
      lastMessageAt: Date.now(),
      modelId: getModelById(args.modelId).id
    })

    await ctx.runMutation(internal.messages.initMessages, {
      threadId: newThreadId,
      prompt: args.prompt,
      search: args.search,
      userId: user.subject,
      modelId: getModelById(args.modelId).id
    })

    await ctx.scheduler.runAfter(0, internal.threads.generateTitle, {
      threadId: newThreadId,
      prompt: args.prompt
    })

    return { newThreadId }
  }
})

export const update = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const thread = await ctx.runQuery(api.threads.getByUserId, {
      threadId: args.threadId,
      userId: identity.subject
    })

    await ctx.runMutation(internal.threads.updateInternalTitle, {
      threadId: thread._id,
      title: args.title
    })
  }
})

export const get = query({
  args: {
    threadId: v.id("threads")
  },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")
    try {
      const thread: Doc<"threads"> = await ctx.runQuery(
        api.threads.getByUserId,
        {
          threadId,
          userId: identity.subject
        }
      )

      return thread
    } catch {
      return null
    }
  }
})

export const branchOff = mutation({
  args: {
    messageId: v.id("messages")
  },
  handler: async (ctx, { messageId }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new ConvexError("Unauthorized")

    const message = await ctx.db.get(messageId)

    if (!message || message.role !== "assistant") {
      throw new ConvexError("No message found")
    }

    const thread: Doc<"threads"> = await ctx.runQuery(api.threads.getByUserId, {
      threadId: message.threadId,
      userId: user.subject,
      allowShared: true
    })

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
      userId: user.subject,
      lastMessageAt: Date.now(),
      modelId: thread.modelId,
      branchParentThreadId: thread._id
    })

    for (const { _id, _creationTime, ...oldMessage } of messagesBefore) {
      await ctx.db.insert("messages", { ...oldMessage, threadId: newThreadId })
    }

    return newThreadId
  }
})

export const getModel = query({
  args: {
    threadId: v.optional(v.id("threads"))
  },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    if (!threadId) return null

    try {
      const thread: Doc<"threads"> = await ctx.runQuery(
        api.threads.getByUserId,
        {
          threadId,
          userId: identity.subject,
          allowShared: true
        }
      )

      return getModelById(thread.modelId).id ?? null
    } catch {
      return null
    }
  }
})

export const updateModel = mutation({
  args: {
    threadId: v.optional(v.id("threads")),
    shareId: v.optional(v.string()),
    modelId: v.string()
  },
  handler: async (ctx, { threadId, shareId, modelId }) => {
    if (!isModelValid(modelId)) throw new ConvexError("Invalid model")

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    if ((!threadId && !shareId) || (threadId && shareId)) {
      throw new ConvexError("Invalid thread")
    }

    let thread: Doc<"threads"> | null = null
    if (threadId) {
      thread = await ctx.runQuery(api.threads.getByUserId, {
        threadId,
        userId: identity.subject
      })
    } else {
      thread = await ctx.db
        .query("threads")
        .withIndex("by_shared_thread_id", (q) =>
          q.eq("sharedThreadId", shareId)
        )
        .unique()
    }

    if (!thread) throw new ConvexError("Thread not found")

    await ctx.db.patch(thread._id, { modelId, updatedAt: Date.now() })
  }
})

export const remove = mutation({
  args: {
    threadId: v.id("threads")
  },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const thread = await ctx.runQuery(api.threads.getByUserId, {
      threadId,
      userId: identity.subject
    })

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_id", (q) => q.eq("threadId", thread._id))
      .collect()

    for (const message of messages) {
      await ctx.db.delete(message._id)
    }

    const branchedThreads = await ctx.db
      .query("threads")
      .withIndex("by_branch_parent_thread_id", (q) =>
        q.eq("branchParentThreadId", threadId)
      )
      .collect()

    for (const thread of branchedThreads) {
      await ctx.db.patch(thread._id, {
        branchParentThreadId: undefined,
        updatedAt: Date.now()
      })
    }

    await ctx.db.delete(threadId)
  }
})

export const share = mutation({
  args: {
    threadId: v.id("threads"),
    sharedThreadId: v.string(),
    shareAccess: shareAccess
  },
  handler: async (ctx, { threadId, shareAccess, sharedThreadId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const thread = await ctx.runQuery(api.threads.getByUserId, {
      threadId,
      userId: identity.subject
    })

    await ctx.db.patch(thread._id, {
      sharedThreadId,
      shareAccess,
      updatedAt: Date.now()
    })
  }
})

export const unshare = mutation({
  args: {
    threadId: v.id("threads")
  },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const thread = await ctx.runQuery(api.threads.getByUserId, {
      threadId,
      userId: identity.subject
    })

    await ctx.db.patch(thread._id, {
      sharedThreadId: undefined,
      shareAccess: undefined,
      updatedAt: Date.now()
    })
  }
})

/**
 * Internal queries and mutations
 */

export const updateInternalTitle = internalMutation({
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

export const generateTitle = internalAction({
  args: {
    threadId: v.id("threads"),
    prompt: v.string()
  },
  handler: async (ctx, { prompt, threadId }) => {
    try {
      const { text } = await generateText({
        model: google("gemini-2.0-flash-lite"),
        prompt: `Write a clear and short title for this chat:\n\n${prompt}`,
        system:
          "Your job is to make short and clear titles based on chat content. Focus on the main topic. " +
          "Keep it under 15 words. Don't use quotes, emojis, or markdown. Just return the title.",
        maxTokens: 25,
        temperature: 0.1
      })

      await ctx.runMutation(internal.threads.updateInternalTitle, {
        threadId,
        title: text
      })
    } catch (error) {
      console.error("Error generating thread title", threadId, error)
    }
  }
})

export const getByUserId = query({
  args: {
    threadId: v.id("threads"),
    userId: v.string(),
    allowShared: v.optional(v.boolean())
  },
  handler: async (ctx, { threadId, userId, allowShared = false }) => {
    const thread = await ctx.db.get(threadId)
    const isShared = !!thread?.sharedThreadId
    const isOwner = thread?.userId === userId

    if (
      !thread ||
      (!allowShared && !isOwner) ||
      (allowShared && !isShared && !isOwner)
    ) {
      throw new ConvexError("No thread found")
    }

    return thread
  }
})
