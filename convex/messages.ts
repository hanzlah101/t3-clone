import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { messageModelSchema, messageRole, messageStatus } from "./schema"
import { type Doc } from "./_generated/dataModel"

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

    return messages
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
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const userMessage = {
      threadId: args.threadId,
      content: args.prompt,
      userId: args.userId,
      role: "user",
      status: "completed"
    } as Doc<"messages">

    const userMessageId = await ctx.db.insert("messages", userMessage)

    userMessage._id = userMessageId
    userMessage._creationTime = Date.now()

    const assistantMessage = {
      threadId: args.threadId,
      content: "",
      userId: args.userId,
      role: "assistant",
      status: "waiting"
    } as Doc<"messages">

    const assistantMessageId = await ctx.db.insert("messages", assistantMessage)

    assistantMessage._id = assistantMessageId
    assistantMessage._creationTime = Date.now()

    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() })

    return [userMessage, assistantMessage]
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
