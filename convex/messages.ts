import { ConvexError, v } from "convex/values"

import { getModelById } from "@/lib/models"
import { mutation, query } from "./_generated/server"
import { messageModelSchema, messageRole, messageStatus } from "./schema"

export const list = query({
  args: {
    threadId: v.id("threads")
  },
  handler: async (ctx, { threadId }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new ConvexError("Unauthorized")

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_user_id", (q) =>
        q.eq("userId", user.subject).eq("threadId", threadId)
      )
      .collect()

    return messages.filter((msg) => !!msg.content)
  }
})

export const getServerMessages = query({
  args: {
    threadId: v.id("threads"),
    userId: v.string()
  },
  handler: async (ctx, { threadId, userId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread_and_user_id", (q) =>
        q.eq("userId", userId).eq("threadId", threadId)
      )
      .collect()
  }
})

export const create = mutation({
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

export const createAssistantAndUserMessages = mutation({
  args: {
    threadId: v.id("threads"),
    prompt: v.string(),
    search: v.boolean()
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new ConvexError("Unauthorized")

    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user_id", (q) => q.eq("userId", user.subject))
      .filter((q) => q.eq(q.field("_id"), args.threadId))
      .unique()

    if (!thread) {
      throw new ConvexError("Thread not found")
    }

    const model = getModelById(thread.modelId)

    await ctx.db.insert("messages", {
      threadId: args.threadId,
      content: args.prompt,
      userId: user.subject,
      role: "user",
      status: "completed"
    })

    await ctx.db.insert("messages", {
      threadId: args.threadId,
      content: "",
      userId: user.subject,
      role: "assistant",
      status: "waiting",
      streamId: crypto.randomUUID(),
      model: {
        name: model.id,
        temperature: model.temperature,
        search: args.search
      }
    })

    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() })
  }
})

export const updateAssistantMessage = mutation({
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

export const getLastMessage = query({
  args: {
    threadId: v.id("threads"),
    userId: v.string()
  },
  handler: async (ctx, { threadId, userId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread_and_user_id", (q) =>
        q.eq("userId", userId).eq("threadId", threadId)
      )
      .order("desc")
      .first()
  }
})
