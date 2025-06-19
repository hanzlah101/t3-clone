"use client"

import { z } from "zod/v4"
import { toast } from "sonner"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { useConvexAuth } from "convex/react"
import { GlobeIcon, Share2Icon } from "lucide-react"
import { notFound, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ReactMutation, useMutation, useQuery } from "convex/react"

import { env } from "@/env"
import { parseError } from "@/lib/error"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CopyButton } from "@/components/copy-button"
import { Label } from "@/components/ui/label"
import { focusThreadInput } from "@/lib/utils"
import { type Id } from "@/convex/_generated/dataModel"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem
} from "@/components/ui/form"

const shareAccessOptions = ["readonly", "editable"] as const

const shareThreadSchema = z.object({
  shareAccess: z.enum(shareAccessOptions)
})

type ShareThreadSchema = z.infer<typeof shareThreadSchema>
type ShareAccess = ShareThreadSchema["shareAccess"]

export function ShareThread() {
  const { isAuthenticated } = useConvexAuth()
  const { threadId }: { threadId: Id<"threads"> } = useParams()

  const thread = useQuery(
    api.threads.get,
    isAuthenticated ? { threadId } : "skip"
  )

  const shareThread = useMutation(api.threads.share).withOptimisticUpdate(
    (store, args) => {
      const thread = store.getQuery(api.threads.get, { threadId })
      if (thread) {
        store.setQuery(
          api.threads.get,
          { threadId },
          { ...thread, ...args, updatedAt: Date.now() }
        )
      }
    }
  )

  const privateThread = useMutation(api.threads.unshare).withOptimisticUpdate(
    (store, args) => {
      const thread = store.getQuery(api.threads.get, args)
      if (thread) {
        store.setQuery(api.threads.get, args, {
          ...thread,
          sharedThreadId: undefined,
          shareAccess: undefined,
          updatedAt: Date.now()
        })
      }
    }
  )

  async function handlePrivate() {
    try {
      await privateThread({ threadId })
    } catch (error) {
      toast.error(parseError(error, "Failed to private thread"))
    }
  }

  async function handleChangeAccess(shareAccess: ShareAccess) {
    try {
      if (!thread?.sharedThreadId) return
      await shareThread({
        threadId,
        shareAccess,
        sharedThreadId: thread?.sharedThreadId
      })
    } catch (error) {
      toast.error(parseError(error, "Failed to change thread access"))
    }
  }

  async function handleRollShareLink() {
    try {
      if (!thread?.shareAccess) return
      const sharedThreadId = crypto.randomUUID()
      await shareThread({
        threadId,
        sharedThreadId,
        shareAccess: thread.shareAccess
      })

      navigator.clipboard.writeText(url)
    } catch (error) {
      toast.error(parseError(error, "Failed to change thread access"))
    }
  }

  if (thread === null) notFound()

  const url = `${env.NEXT_PUBLIC_URL}/threads/s/${thread?.sharedThreadId}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          <Share2Icon className="size-3.5" /> Share
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        alignOffset={-10}
        className="bg-popover/60 flex w-84 backdrop-blur"
        onCloseAutoFocus={(evt) => {
          evt.preventDefault()
          focusThreadInput()
        }}
      >
        {thread?.sharedThreadId ? (
          <div className="w-full space-y-4">
            <div className="text-primary flex items-center gap-2">
              <GlobeIcon className="size-4" />
              <h1 className="text-sm font-medium">This thread is public</h1>
            </div>

            <ShareAccessRatio
              value={thread.shareAccess ?? "readonly"}
              onChange={handleChangeAccess}
            />

            <div className="space-y-2">
              <div className="flex h-9 items-center">
                <button
                  title="Click to copy"
                  className="bg-accent border-input h-9 w-full overflow-hidden rounded-l-md border px-3 text-sm font-medium"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success("URL copied to clipboard"))
                  }}
                >
                  <p className="truncate">{url}</p>
                </button>
                <CopyButton
                  text={url}
                  variant="default"
                  tooltip="Copy url"
                  className="h-9 w-10 rounded-l-none"
                />
              </div>

              <div className="flex w-full items-end justify-end">
                <Button
                  variant="link"
                  onClick={handleRollShareLink}
                  className="ml-auto size-fit p-0 text-xs"
                >
                  Roll Link
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              variant="outline"
              onClick={handlePrivate}
            >
              Private
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center space-y-2 text-center">
            <GlobeIcon className="size-8" />
            <h1 className="text-muted-foreground text-[15px] font-medium">
              Share this thread
            </h1>
            <ShareForm shareThread={shareThread} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function ShareForm({
  shareThread
}: {
  shareThread: ReactMutation<typeof api.threads.share>
}) {
  const { threadId }: { threadId: Id<"threads"> } = useParams()

  const form = useForm<ShareThreadSchema>({
    resolver: zodResolver(shareThreadSchema),
    defaultValues: {
      shareAccess: "readonly"
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await shareThread({
        threadId,
        shareAccess: values.shareAccess,
        sharedThreadId: crypto.randomUUID()
      })
    } catch (error) {
      toast.error(parseError(error, "Failed to share thread"))
    }
  })

  const isPending = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="w-full space-y-2">
        <FormField
          control={form.control}
          name="shareAccess"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ShareAccessRatio
                  disabled={isPending}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {field.value === "readonly"
                  ? "Users can respond, but replies go to a private thread."
                  : "Users can chat directly within this shared thread."}
              </FormDescription>
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-3 w-full" disabled={isPending}>
          Share
        </Button>
      </form>
    </Form>
  )
}

function ShareAccessRatio({
  disabled,
  value,
  onChange
}: {
  disabled?: boolean
  value: ShareAccess
  onChange: (value: ShareAccess) => void | Promise<void>
}) {
  return (
    <RadioGroup
      disabled={disabled}
      onValueChange={onChange}
      value={value}
      className="bg-input/20 relative grid h-10 w-full grid-cols-2 gap-0 rounded-full border"
    >
      {/* Indicator */}
      <motion.div
        initial={value}
        animate={value}
        className="bg-input pointer-events-none absolute inset-y-1/2 -z-1 h-8.5 w-1/2 -translate-y-1/2 rounded-full"
        variants={{
          readonly: { x: 0, left: "3px" },
          editable: { x: "100%", left: "-3px" }
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      />

      {shareAccessOptions.map((option) => (
        <Label
          htmlFor={option}
          key={option}
          aria-disabled={disabled}
          className="flex size-full cursor-pointer items-center justify-center text-center capitalize aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          <RadioGroupItem id={option} value={option} className="sr-only" />
          {option}
        </Label>
      ))}
    </RadioGroup>
  )
}
