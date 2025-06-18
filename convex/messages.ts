import { ConvexError, v } from "convex/values"

import { getModelById } from "@/lib/models"
import { api } from "./_generated/api"
import { internalMutation, mutation, query } from "./_generated/server"
import { messageModelSchema, messageRole, messageStatus } from "./schema"
import { type Doc } from "./_generated/dataModel"

export const list = query({
  args: {
    threadId: v.id("threads")
  },
  handler: async (ctx, { threadId }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new ConvexError("Unauthorized")

    const thread: Doc<"threads"> = await ctx.runQuery(api.threads.getByUserId, {
      threadId,
      userId: user.subject
    })

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_id", (q) => q.eq("threadId", thread._id))
      .collect()

    return messages
  }
})

export const initMessages = internalMutation({
  args: {
    threadId: v.id("threads"),
    prompt: v.string(),
    search: v.boolean(),
    userId: v.string(),
    modelId: v.string()
  },
  handler: async (ctx, args) => {
    const model = getModelById(args.modelId)

    await ctx.db.insert("messages", {
      threadId: args.threadId,
      content: args.prompt,
      userId: args.userId,
      role: "user",
      status: "completed"
    })

    await ctx.db.insert("messages", {
      threadId: args.threadId,
      content: "",
      userId: args.userId,
      role: "assistant",
      status: "waiting",
      model: {
        name: model.id,
        temperature: model.temperature,
        search: args.search
      }
    })

    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() })
  }
})

export const listShared = query({
  args: {
    shareId: v.string()
  },
  handler: async (ctx, { shareId }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new ConvexError("Unauthorized")

    const thread = await ctx.db
      .query("threads")
      .withIndex("by_shared_thread_id", (q) => q.eq("sharedThreadId", shareId))
      .unique()

    if (!thread) {
      throw new ConvexError("Thread not found")
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_id", (q) => q.eq("threadId", thread._id))
      .collect()

    return messages
  }
})

/**
 * Internal queries and mutations
 */

export const listInternal = query({
  args: {
    threadId: v.id("threads"),
    userId: v.string()
  },
  handler: async (ctx, { threadId, userId }) => {
    const thread: Doc<"threads"> = await ctx.runQuery(api.threads.getByUserId, {
      threadId,
      userId,
      allowShared: true
    })

    return await ctx.db
      .query("messages")
      .withIndex("by_thread_id", (q) => q.eq("threadId", thread._id))
      .collect()
  }
})

export const update = mutation({
  args: {
    _id: v.id("messages"),
    content: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    error: v.optional(v.string()),
    status: messageStatus,
    model: messageModelSchema
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args._id, args)
  }
})

export const createInternal = internalMutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    userId: v.string(),
    role: messageRole,
    status: messageStatus
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.insert("messages", args)
    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() })
    return message
  }
})
