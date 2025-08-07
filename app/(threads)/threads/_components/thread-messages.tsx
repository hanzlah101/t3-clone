"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { useQuery, useConvexAuth } from "convex/react"

import { TextShimmer } from "@/components/ui/text-shimmer"
import { ScrollWrapper } from "./scroll-wrapper"
import { api } from "@/convex/_generated/api"
import { MessageBubble } from "./message-bubble"
import { StreamingMessage } from "./streaming-message"
import type { Doc, Id } from "@/convex/_generated/dataModel"

function useMessages() {
  const { isAuthenticated } = useConvexAuth()
  const { threadId, shareId }: { threadId?: Id<"threads">; shareId?: string } =
    useParams()

  const threadQuery = useQuery(
    api.messages.list,
    isAuthenticated && threadId ? { threadId } : "skip"
  )
  const sharedQuery = useQuery(
    api.messages.listShared,
    isAuthenticated && shareId ? { shareId } : "skip"
  )

  if (threadId) return threadQuery
  if (shareId) return sharedQuery

  return undefined
}

export function ThreadMessages({
  initialMessages
}: {
  initialMessages: Doc<"messages">[]
}) {
  const messages = useMessages() ?? initialMessages

  const { threadId, shareId } = useParams()
  const { messages: streamMessages, status } = useChat({
    id: (threadId ?? shareId) as string
  })

  const stream = useMemo(() => streamMessages.at(-1), [streamMessages])
  const lastMessage = useMemo(() => messages.at(-1), [messages])

  const isSearching = useMemo(() => {
    return (
      stream?.role === "assistant" &&
      stream?.parts.some(
        (part) =>
          part.type === "tool-invocation" &&
          part.toolInvocation.toolName === "webSearch" &&
          (part.toolInvocation.state !== "result" ||
            (part.toolInvocation.state === "result" &&
              stream.content.trim() === ""))
      )
    )
  }, [stream])

  const isStreaming = useMemo(() => {
    return (
      stream &&
      stream.role === "assistant" &&
      (status === "streaming" || lastMessage?.status === "waiting")
    )
  }, [status, lastMessage?.status, stream])

  return (
    <ScrollWrapper>
      {messages.map((msg, index) =>
        isStreaming && index === messages.length - 1 ? null : (
          <MessageBubble key={msg._id} {...msg} />
        )
      )}

      {isStreaming && <StreamingMessage stream={stream} />}

      {(isSearching || status === "submitted") && (
        <div className="overflow-visible">
          <TextShimmer className="pointer-events-none">
            {isSearching ? "Searching the web..." : "Thinking..."}
          </TextShimmer>
        </div>
      )}
    </ScrollWrapper>
  )
}
