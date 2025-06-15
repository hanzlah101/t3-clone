"use client"

import { useEffect, useMemo } from "react"
import { useQuery } from "convex/react"
import { useParams } from "next/navigation"
import { useChat } from "@ai-sdk/react"

import { api } from "@/convex/_generated/api"
import { MessageBubble } from "./message-bubble"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { formatMessages } from "@/lib/utils"
import { type Id } from "@/convex/_generated/dataModel"

export function ThreadMessages() {
  const { threadId }: { threadId: Id<"threads"> } = useParams()
  const queryRes = useQuery(api.messages.list, { threadId })

  const formattedQueryRes = useMemo(() => {
    return formatMessages(queryRes)
  }, [queryRes])

  const { messages, setMessages, status } = useChat({
    id: threadId,
    initialMessages: formattedQueryRes
  })

  const mergedMessages = useMemo(() => {
    return messages.map((msg) => {
      const dbMessage = queryRes?.find((m) => m._id === msg.id)
      if (!dbMessage) return msg
      return { ...msg, dbMessage }
    })
  }, [messages, queryRes])

  useEffect(() => {
    setMessages(formattedQueryRes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedQueryRes])

  if (!mergedMessages.length && queryRes === undefined) {
    return (
      <div className="relative h-0 overflow-visible">
        <TextShimmer className="pointer-events-none absolute top-0 left-0">
          Loading...
        </TextShimmer>
      </div>
    )
  }

  return (
    <>
      {mergedMessages.map((msg) => (
        <MessageBubble key={msg.id} {...msg} />
      ))}

      {status === "submitted" && (
        <div className="relative h-0 overflow-visible">
          <TextShimmer className="pointer-events-none absolute top-0 left-0">
            Thinking...
          </TextShimmer>
        </div>
      )}
    </>
  )
}
