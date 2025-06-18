import { useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { useParams } from "next/navigation"

import { formatMessages } from "@/lib/utils"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { ThreadMessages } from "../_components/thread-messages"
import { type Doc } from "@/convex/_generated/dataModel"

export function Thread({
  queryMessages
}: {
  queryMessages?: Doc<"messages">[]
}) {
  const { threadId, shareId } = useParams()
  const formattedQueryRes = useMemo(() => {
    return formatMessages(queryMessages)
  }, [queryMessages])

  const { messages, setMessages } = useChat({
    id: (threadId ?? shareId) as string,
    initialMessages: formattedQueryRes
  })

  useEffect(() => {
    if (formattedQueryRes.length) setMessages(formattedQueryRes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedQueryRes])

  if (!messages.length && queryMessages === undefined) {
    return (
      <div className="mx-auto max-w-4xl p-8 pt-16">
        <TextShimmer>Loading...</TextShimmer>
      </div>
    )
  }

  return <ThreadMessages queryMessages={queryMessages} />
}
