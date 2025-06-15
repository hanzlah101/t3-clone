"use client"

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { useParams } from "next/navigation"
import { useChat } from "@ai-sdk/react"

import { api } from "@/convex/_generated/api"
import { MessageBubble } from "./message-bubble"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { ScrollWrapper } from "./scroll-wrapper"
import { type Id } from "@/convex/_generated/dataModel"

export function ThreadMessages() {
  const { threadId }: { threadId: Id<"threads"> } = useParams()
  const queryRes = useQuery(api.messages.list, { threadId })

  const { messages, status } = useChat({ id: threadId })

  const mergedMessages = useMemo(() => {
    return messages.map((msg) => {
      const dbMessage = queryRes?.find((m) => m._id === msg.id)
      if (!dbMessage) return msg
      return { ...msg, dbMessage }
    })
  }, [messages, queryRes])

  const isSearching = useMemo(() => {
    const lastMessage = messages.at(-1)
    return (
      lastMessage?.role === "assistant" &&
      lastMessage?.parts.some(
        (part) =>
          part.type === "tool-invocation" &&
          part.toolInvocation.toolName === "webSearch" &&
          part.toolInvocation.state !== "result"
      )
    )
  }, [messages])

  return (
    <ScrollWrapper>
      {mergedMessages.map((msg) => (
        <MessageBubble key={msg.id} {...msg} />
      ))}

      {(isSearching || status === "submitted") && (
        <div className="relative h-0 overflow-visible">
          <TextShimmer className="pointer-events-none absolute top-0 left-0">
            {isSearching ? "Searching the web..." : "Thinking..."}
          </TextShimmer>
        </div>
      )}
    </ScrollWrapper>
  )
}
