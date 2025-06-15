import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type UIMessage } from "ai"

import { type Doc } from "@/convex/_generated/dataModel"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessages(messages?: Doc<"messages">[]): UIMessage[] {
  return (
    messages?.map((msg) => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg._creationTime),
      parts: [
        {
          type: "text",
          text: msg.content
        },
        ...(msg.reasoning
          ? [
              {
                type: "reasoning" as const,
                reasoning: msg.reasoning,
                details: [{ type: "text" as const, text: msg.reasoning }]
              }
            ]
          : [])
      ]
    })) ?? []
  )
}
