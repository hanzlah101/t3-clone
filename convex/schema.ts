import { v } from "convex/values"
import { defineSchema, defineTable } from "convex/server"

export const messageRole = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system")
)

export const messageStatus = v.union(
  v.literal("waiting"),
  v.literal("completed"),
  v.literal("disconnected"),
  v.literal("error"),
  v.literal("cancelled")
)

export const messageModelSchema = v.optional(
  v.object({
    name: v.string(),
    temperature: v.optional(v.number()),
    search: v.boolean()
  })
)

export const shareAccess = v.union(v.literal("editable"), v.literal("readonly"))

export default defineSchema({
  threads: defineTable({
    title: v.string(),
    userId: v.string(),
    modelId: v.string(),
    updatedAt: v.optional(v.number()),
    lastMessageAt: v.number(),
    branchParentThreadId: v.optional(v.id("threads")),
    sharedThreadId: v.optional(v.string()),
    shareAccess: v.optional(shareAccess)
  })
    .index("by_user_id", ["userId"])
    .index("by_branch_parent_thread_id", ["branchParentThreadId"])
    .index("by_shared_thread_id", ["sharedThreadId"]),
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
  }).index("by_thread_id", ["threadId"])
})
