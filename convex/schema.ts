import { v } from "convex/values"
import { defineSchema, defineTable } from "convex/server"

export const messageRole = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system")
)

export const messageStatus = v.union(
  v.literal("waiting"),
  v.literal("thinking"),
  v.literal("streaming"),
  v.literal("completed"),
  v.literal("error"),
  v.literal("cancelled"),
  v.literal("deleted")
)

export const messageModelSchema = v.optional(
  v.object({
    model: v.string(),
    temp: v.optional(v.number()),
    topP: v.optional(v.number()),
    topK: v.optional(v.number()),
    search: v.boolean()
  })
)

export default defineSchema({
  threads: defineTable({
    title: v.string(),
    userId: v.string(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    lastMessageAt: v.number(),
    branchParentThreadId: v.optional(v.id("threads"))
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_deleted", ["userId", "deletedAt"]),
  messages: defineTable({
    threadId: v.id("threads"),
    reasoning: v.optional(v.string()),
    content: v.string(),
    userId: v.string(),
    role: messageRole,
    status: messageStatus,
    error: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    model: v.optional(messageModelSchema)
  })
    .index("by_thread_id", ["threadId"])
    .index("by_thread_and_user_id", ["userId", "threadId"])
})
