"use client"

import { useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"

import { ThreadMessages } from "./_components/thread-messages"
import { api } from "@/convex/_generated/api"
import { useChat } from "@ai-sdk/react"
import { formatMessages } from "@/lib/utils"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { type Id } from "@/convex/_generated/dataModel"

export default function Thread() {
  const { threadId }: { threadId: Id<"threads"> } = useParams()
  const queryRes = useQuery(api.messages.list, { threadId })

  const formattedQueryRes = useMemo(() => {
    return formatMessages(queryRes)
  }, [queryRes])

  const { messages, setMessages } = useChat({
    id: threadId,
    initialMessages: formattedQueryRes,
    onToolCall: ({ toolCall }) => {
      console.log("toolCall", toolCall)
    }
  })

  useEffect(() => {
    if (formattedQueryRes.length) setMessages(formattedQueryRes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedQueryRes])

  if (!messages.length && queryRes === undefined) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="relative h-0 overflow-visible">
          <TextShimmer className="pointer-events-none absolute top-0 left-0">
            Loading...
          </TextShimmer>
        </div>
      </div>
    )
  }

  return <ThreadMessages />
}
