import { memo } from "react"
import { type UIMessage } from "ai"

import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "./markdown-renderer"
import { type Doc } from "@/convex/_generated/dataModel"

function MessageBubbleComp({
  role,
  content,
  dbMessage
}: UIMessage & { dbMessage?: Doc<"messages"> }) {
  if (dbMessage?.status === "error") {
    return (
      <div className="bg-destructive/15 text-destructive px-4 py-2 text-[15px]">
        {dbMessage.error ??
          "An error occurred while processing your request. Please try again."}
      </div>
    )
  }

  return (
    <div
      className={cn({
        "bg-muted text-muted-foreground ml-auto w-fit max-w-xl rounded-xl px-4 py-2":
          role === "user"
      })}
    >
      <MarkdownRenderer>{content}</MarkdownRenderer>
    </div>
  )
}

export const MessageBubble = memo(MessageBubbleComp)
