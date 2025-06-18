"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useChat } from "@ai-sdk/react"

import { MessageBubble } from "./message-bubble"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { ScrollWrapper } from "./scroll-wrapper"
import { type Doc } from "@/convex/_generated/dataModel"

export function ThreadMessages({
  queryMessages
}: {
  queryMessages?: Doc<"messages">[]
}) {
  const { threadId, shareId } = useParams()
  const { messages, status } = useChat({ id: (threadId ?? shareId) as string })

  const mergedMessages = useMemo(() => {
    return messages.map((msg) => {
      const dbMessage = queryMessages?.find((m) => m._id === msg.id)
      if (!dbMessage) return msg
      return { ...msg, dbMessage }
    })
  }, [messages, queryMessages])

  const isSearching = useMemo(() => {
    const lastMessage = messages.at(-1)
    return (
      lastMessage?.role === "assistant" &&
      lastMessage?.parts.some(
        (part) =>
          part.type === "tool-invocation" &&
          part.toolInvocation.toolName === "webSearch" &&
          (part.toolInvocation.state !== "result" ||
            (part.toolInvocation.state === "result" &&
              lastMessage.content.trim() === ""))
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
