"use client"

import { memo, useTransition } from "react"
import { useMutation } from "convex/react"
import { useParams, useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { type UIMessage } from "ai"

import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "./markdown-renderer"
import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getModelName } from "@/lib/models"
import { BranchIcon } from "@/components/icons/branch"
import { DEFAULT_ERROR } from "@/lib/constants"
import { ReasoningMessagePart, type ReasoningPart } from "./reasoning"
import type { Id, Doc } from "@/convex/_generated/dataModel"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

function MessageBubbleComp({
  role,
  content,
  parts,
  dbMessage
}: UIMessage & { dbMessage?: Doc<"messages"> }) {
  const { threadId }: { threadId: string } = useParams()
  const { status } = useChat({ id: threadId })

  if (!content.trim()) return null

  const hasError =
    dbMessage &&
    ["error", "disconnected", "cancelled"].includes(dbMessage?.status)

  return (
    <div className="group/message space-y-2">
      <div
        className={cn({
          "bg-accent text-accent-foreground ml-auto w-fit max-w-xl rounded-xl px-4 py-2":
            role === "user"
        })}
      >
        {parts.map((part, index) => {
          if (part.type === "text")
            return (
              <MarkdownRenderer key={`${part.type}-${index}`}>
                {part.text}
              </MarkdownRenderer>
            )

          if (part.type === "reasoning") {
            return (
              <ReasoningMessagePart
                key={`${part.type}-${index}`}
                part={part as ReasoningPart}
                isReasoning={
                  status === "streaming" && index === parts.length - 1
                }
              />
            )
          }
        })}
      </div>

      {hasError && (
        <div className="bg-destructive/15 text-destructive my-2 rounded-md px-4 py-3 text-[15px]">
          {dbMessage.error ?? DEFAULT_ERROR}
        </div>
      )}

      {(dbMessage || role === "user") && (
        <div
          className={cn(
            "flex w-fit items-center gap-2 opacity-0 transition-opacity group-hover/message:opacity-100",
            role === "user" ? "ml-auto" : "mr-auto"
          )}
        >
          <CopyButton text={content} className="size-8" />

          {dbMessage?.role === "assistant" && (
            <BranchOffButton messageId={dbMessage._id} />
          )}

          {dbMessage?.role === "assistant" && dbMessage?.model && (
            <span className="text-muted-foreground text-[13px]">
              {getModelName(dbMessage?.model?.name)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export const MessageBubble = memo(MessageBubbleComp)

function BranchOffButton({ messageId }: { messageId: Id<"messages"> }) {
  const router = useRouter()
  const branchOff = useMutation(api.threads.branchOff)
  const [isPending, startTransition] = useTransition()

  const handleBranchOff = () => {
    startTransition(async () => {
      const newThreadId = await branchOff({ messageId })
      router.push(`/threads/${newThreadId}`)
    })
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild onClick={handleBranchOff} disabled={isPending}>
        <Button size="sm" variant="ghost" className="size-8">
          {isPending ? <Spinner className="size-4" /> : <BranchIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Branch off</TooltipContent>
    </Tooltip>
  )
}
