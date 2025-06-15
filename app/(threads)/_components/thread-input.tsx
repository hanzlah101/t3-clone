"use client"

import * as React from "react"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { useChat } from "@ai-sdk/react"
import { ArrowUpIcon, SquareIcon } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"

import { api } from "@/convex/_generated/api"
import { parseError } from "@/lib/error"
import { Button } from "@/components/ui/button"
import { type Id } from "@/convex/_generated/dataModel"

export function ThreadInput() {
  const router = useRouter()
  const { threadId }: { threadId: Id<"threads"> } = useParams()

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const pendingSubmitRef = React.useRef<string | null>(null)

  const createThread = useMutation(api.threads.create)

  const { status, input, setInput, handleInputChange, handleSubmit, stop } =
    useChat({
      id: threadId,
      experimental_prepareRequestBody: ({ requestData }) => {
        const id = (requestData as { id?: Id<"threads"> })?.id ?? threadId
        return { threadId: id, prompt: input }
      }
    })

  const [isPending, setIsPending] = React.useState(false)

  async function handleCreateThread() {
    if (!input.trim()) {
      textareaRef.current?.focus()
      return
    }

    if (threadId) {
      handleSubmit()
      textareaRef.current?.focus()
      return
    }

    try {
      setIsPending(true)
      const currentInput = input.trim()

      const { newThreadId } = await createThread({ prompt: input })
      router.push(`/threads/${newThreadId}`)

      pendingSubmitRef.current = currentInput
    } catch (error) {
      toast.error(parseError(error, "Failed to create thread"))
      setIsPending(false)
    }
  }

  function handleKeyDown(evt: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (evt.key === "Enter" && !evt.shiftKey) {
      evt.preventDefault()
      evt.stopPropagation()
      handleCreateThread()
    }
  }

  function onSubmit(evt: React.FormEvent) {
    evt.preventDefault()
    evt.stopPropagation()
    handleCreateThread()
  }

  React.useEffect(() => {
    if (threadId && pendingSubmitRef.current) {
      const inputToSubmit = pendingSubmitRef.current
      pendingSubmitRef.current = null
      setInput(inputToSubmit)
      setTimeout(() => {
        handleSubmit(undefined, { data: { id: threadId } })
        setIsPending(false)
        setTimeout(() => textareaRef.current?.focus(), 0)
      }, 0)
    }
  }, [threadId, handleSubmit, setInput])

  React.useEffect(() => {
    textareaRef.current?.focus()
  }, [threadId])

  return (
    <form
      onSubmit={onSubmit}
      id="thread-form"
      className="sticky bottom-0 z-50 mx-auto w-full max-w-4xl px-4"
    >
      <div className="border-border/50 bg-base-200/35 dark:bg-background/50 w-full rounded-t-3xl border border-b-0 px-2 pt-2 backdrop-blur">
        <div className="border-border/50 bg-background/50 dark:bg-base-900/50 relative w-full rounded-t-2xl border border-b-0">
          <TextareaAutosize
            autoFocus
            id="thread-input"
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            disabled={isPending}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="placeholder:text-muted-foreground max-h-75 min-h-22.5 w-full resize-none p-3.5 text-sm outline-none disabled:opacity-80"
          />

          {status === "submitted" || status === "streaming" ? (
            <Button
              size="icon"
              type="button"
              onClick={stop}
              aria-label="Stop streaming"
              className="absolute right-2 bottom-2 size-8 rounded-full"
            >
              <SquareIcon className="size-4.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              type="submit"
              aria-label="Send message"
              disabled={isPending}
              className="absolute right-2 bottom-2 size-8 rounded-full"
            >
              <ArrowUpIcon className="size-4.5" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
