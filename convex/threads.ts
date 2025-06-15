import { ConvexError, v } from "convex/values"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

import { api } from "./_generated/api"

import { action, mutation, query } from "./_generated/server"
import { type Doc } from "./_generated/dataModel"

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_user_id_and_deleted", (q) =>
        q.eq("userId", identity.subject).eq("deletedAt", undefined)
      )
      .collect()

    return threads.sort((a, b) => b.lastMessageAt - a.lastMessageAt)
  }
})

export const create = mutation({
  args: {
    prompt: v.string()
  },
  handler: async (ctx, { prompt }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")
    const userId = identity.subject
    const threadId = await ctx.db.insert("threads", {
      title: "New Thread",
      userId,
      lastMessageAt: Date.now()
    })

    const newMessages: Doc<"messages">[] = await ctx.runMutation(
      api.messages.createAssistantAndUserMessages,
      { prompt, threadId, userId }
    )

    await ctx.scheduler.runAfter(0, api.threads.generateTitle, {
      prompt,
      threadId
    })

    return { newThreadId: threadId, newMessages }
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
      .filter((q) => q.eq(q.field("_id"), threadId))
      .withIndex("by_user_id_and_deleted", (q) =>
        q.eq("userId", userId).eq("deletedAt", undefined)
      )
      .unique()

    if (!thread) throw new ConvexError("No thread found")
    return thread
  }
})
