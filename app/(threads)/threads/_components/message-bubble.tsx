"use client"

import { cn } from "@/lib/utils"
import { Reasoning } from "./reasoning"
import { MarkdownRenderer } from "./markdown-renderer"
import { DEFAULT_ERROR } from "@/lib/constants"
import { CopyButton } from "@/components/copy-button"
import { BranchOff } from "./branch-off"
import { getModelName } from "@/lib/models"
import { type Doc } from "@/convex/_generated/dataModel"
import { memo } from "react"

function MessageBubbleComp(msg: Doc<"messages">) {
  if (msg.status === "waiting" && !msg.content.trim()) return null
  const isError = ["error", "disconnected", "cancelled"].includes(msg.status)

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
}

export const MessageBubble = memo(MessageBubbleComp)
