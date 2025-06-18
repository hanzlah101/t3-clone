"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { type Preloaded, usePreloadedQuery } from "convex/react"

import { cn } from "@/lib/utils"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { ScrollWrapper } from "./scroll-wrapper"
import { DEFAULT_ERROR } from "@/lib/constants"
import { Reasoning } from "./reasoning"
import { MarkdownRenderer } from "./markdown-renderer"
import { BranchOff } from "./branch-off"
import { CopyButton } from "@/components/copy-button"
import { getModelName } from "@/lib/models"
import { type api } from "@/convex/_generated/api"

export function ThreadMessages({
  preloaded
}: {
  preloaded: Preloaded<
    typeof api.messages.list | typeof api.messages.listShared
  >
}) {
  const messages = usePreloadedQuery(preloaded)

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
      {messages.map((msg, index) => {
        if (msg.status === "waiting" && !msg.content.trim()) return null
        if (isStreaming && index === messages.length - 1) return null
        const isError = ["error", "disconnected", "cancelled"].includes(
          msg.status
        )

        return (
          <div key={msg._id} className="group/message space-y-2">
            <div
              className={cn({
                "bg-accent text-accent-foreground ml-auto w-fit max-w-xl rounded-xl px-4 py-2":
                  msg.role === "user"
              })}
            >
              {msg.reasoning && (
                <Reasoning details={[{ type: "text", text: msg.reasoning }]} />
              )}

              <MarkdownRenderer>{msg.content}</MarkdownRenderer>
            </div>

            {isError && (
              <div className="bg-destructive/15 text-destructive my-2 rounded-md px-4 py-3 text-[15px]">
                {msg.error ?? DEFAULT_ERROR}
              </div>
            )}

            <div
              className={cn(
                "flex w-fit items-center gap-2 opacity-0 transition-opacity group-hover/message:opacity-100",
                msg.role === "user" ? "ml-auto" : "mr-auto"
              )}
            >
              <CopyButton text={msg.content} className="size-8" />

              {msg?.role === "assistant" && <BranchOff messageId={msg._id} />}

              {msg?.role === "assistant" && msg?.model && (
                <span className="text-muted-foreground text-[13px]">
                  {getModelName(msg?.model?.name)}
                </span>
              )}
            </div>
          </div>
        )
      })}

      {isStreaming && (
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
                />
              )
            }
          })}
        </div>
      )}

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

/**
 * 
 *  {stream.parts.map((part, index) => {
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
                  />
                )
              }
            })}
 */
