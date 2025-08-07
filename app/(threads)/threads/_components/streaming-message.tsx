"use client"

import { memo } from "react"
import { useParams } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { type UIMessage } from "ai"

import { MarkdownRenderer } from "./markdown-renderer"
import { Reasoning } from "./reasoning"

function StreamingMessageComp({ stream }: { stream?: UIMessage }) {
  const { threadId, shareId } = useParams()
  const { status } = useChat({
    id: (threadId ?? shareId) as string
  })

  return (
    <div>
      {stream?.parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <MarkdownRenderer key={`${part.type}-${index}`}>
              {part.text}
            </MarkdownRenderer>
          )
        }

        if (part.type === "reasoning") {
          return (
            <Reasoning
              key={`${part.type}-${index}`}
              details={part.details}
              isReasoning={
                status === "streaming" && index === stream.parts.length - 1
              }
            />
          )
        }
      })}
    </div>
  )
}

export const StreamingMessage = memo(StreamingMessageComp)
