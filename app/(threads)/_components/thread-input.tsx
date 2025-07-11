"use client"

import * as React from "react"
import { toast } from "sonner"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { useChat } from "@ai-sdk/react"
import { ArrowUpIcon, GlobeIcon, SquareIcon } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"

import { api } from "@/convex/_generated/api"
import { parseError } from "@/lib/error"
import { Button } from "@/components/ui/button"
import { ModelsSelect } from "./models-select"
import { DEFAULT_MODEL, getModelById, type ModelId } from "@/lib/models"
import { useCookieState } from "@/hooks/use-cookie-state"
import { getCookie } from "@/lib/utils"
import { type Id } from "@/convex/_generated/dataModel"

export function ThreadInput(initialState: {
  modelId: ModelId
  hasSearch: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { threadId, shareId }: { threadId?: Id<"threads">; shareId?: string } =
    useParams()

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const pendingSubmitRef = React.useRef<string | null>(null)

  const createThread = useMutation(api.threads.create)

  const { status, input, setInput, handleInputChange, handleSubmit, stop } =
    useChat({
      id: threadId ?? shareId,
      experimental_prepareRequestBody: ({ requestData }) => {
        const id = (requestData as { id?: Id<"threads"> })?.id ?? threadId
        return { threadId: id, prompt: input }
      }
    })

  const [isPending, setIsPending] = React.useState(false)

  function getModelId() {
    return getModelById(getCookie("model_id", DEFAULT_MODEL)).id
  }

  function hasSearch() {
    return getCookie("search", false)
  }

  async function handleCreateThread() {
    if (
      !input.trim() ||
      status === "streaming" ||
      status === "submitted" ||
      isPending
    ) {
      textareaRef.current?.focus()
      return
    }

    try {
      setIsPending(true)
      const currentInput = input.trim()
      const res = await createThread({
        prompt: input,
        modelId: getModelId(),
        search: hasSearch(),
        threadId,
        shareId
      })

      if (res?.newThreadId) {
        router.push(`/threads/${res.newThreadId}`)
        pendingSubmitRef.current = currentInput
        setTimeout(() => textareaRef.current?.focus(), 0)
      } else {
        handleSubmit(
          undefined,
          res?.oldThreadId ? { data: { id: res?.oldThreadId } } : undefined
        )
        setTimeout(() => textareaRef.current?.focus(), 0)
        setIsPending(false)
      }
    } catch (error) {
      toast.error(parseError(error, "Failed to create thread"))
      setIsPending(false)
    }
  }

  React.useEffect(() => {
    if (threadId && pendingSubmitRef.current) {
      const inputToSubmit = pendingSubmitRef.current
      pendingSubmitRef.current = null
      setInput(inputToSubmit)

      handleSubmit(undefined, { data: { id: threadId } })
      setIsPending(false)
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [threadId, handleSubmit, setInput])

  React.useEffect(() => {
    textareaRef.current?.focus()
  }, [pathname])

  return (
    <form
      id="thread-form"
      className="sticky bottom-0 z-50 mx-auto w-full max-w-4xl px-4"
      onSubmit={(evt) => {
        evt.preventDefault()
        evt.stopPropagation()
        handleCreateThread()
      }}
    >
      <div className="border-border/50 bg-base-200/35 dark:bg-background/50 w-full rounded-t-3xl border border-b-0 px-2 pt-2 backdrop-blur">
        <div className="border-border/50 bg-background/50 dark:bg-base-900/50 w-full rounded-t-2xl border border-b-0">
          <TextareaAutosize
            autoFocus
            id="thread-input"
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            disabled={isPending}
            placeholder="Type your message here..."
            className="placeholder:text-muted-foreground max-h-75 min-h-18 w-full resize-none p-3.5 text-sm outline-none disabled:opacity-80"
            onKeyDown={(evt) => {
              if (evt.key === "Enter" && !evt.shiftKey) {
                evt.preventDefault()
                evt.stopPropagation()
                handleCreateThread()
              }
            }}
          />

          <div
            className="flex items-center justify-between pt-1 pr-3.5 pb-3.5 pl-1.5"
            onClick={(evt) => {
              if (evt.target === evt.currentTarget) textareaRef.current?.focus()
            }}
          >
            <div className="flex items-center gap-2">
              <ModelsSelect
                textAreaRef={textareaRef}
                initialState={initialState.modelId}
              />
              <SearchToggle
                textareaRef={textareaRef}
                initialState={initialState.hasSearch}
              />
            </div>

            {status === "submitted" || status === "streaming" ? (
              <Button
                size="icon"
                type="button"
                aria-label="Stop streaming"
                onClick={stop}
                className="size-8 rounded-full"
              >
                <SquareIcon className="fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                type="submit"
                aria-label="Send message"
                disabled={isPending}
                className="size-8 rounded-full"
              >
                <ArrowUpIcon className="size-4.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}

function SearchToggle({
  textareaRef,
  initialState
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  initialState: boolean
}) {
  const [search, setSearch] = useCookieState("search", initialState)
  return (
    <Button
      type="button"
      size="sm"
      variant={search === true ? "default" : "ghost"}
      className="h-fit gap-1 rounded-full px-2.5 py-1.5 text-sm"
      onClick={() => {
        setSearch(!search)
        textareaRef.current?.focus()
      }}
    >
      <GlobeIcon className="size-4" />
      Search
    </Button>
  )
}
