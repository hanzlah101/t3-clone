"use client"

import Link from "next/link"
import { toast } from "sonner"
import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { useConvexAuth } from "convex/react"
import { isToday, isYesterday, subDays, isAfter, subYears } from "date-fns"
import { CopyIcon, EditIcon, Trash2Icon } from "lucide-react"
import { type FunctionReturnType } from "convex/server"

import { api } from "@/convex/_generated/api"
import { BranchIcon } from "@/components/icons/branch"
import { DeleteThread } from "./delete-thread"
import { focusThreadInput } from "@/lib/utils"
import { parseError } from "@/lib/error"
import { type Doc } from "@/convex/_generated/dataModel"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu"

function getDateGroup(updatedAt: number) {
  const now = new Date()
  if (isToday(updatedAt)) return "Today"
  if (isYesterday(updatedAt)) return "Yesterday"
  if (isAfter(updatedAt, subDays(now, 7))) return "Last 7 Days"
  if (isAfter(updatedAt, subDays(now, 30))) return "Last 30 Days"
  if (isAfter(updatedAt, subYears(now, 1))) return "Last Year"
  return "Older"
}

export function ThreadsList({
  initialThreads
}: {
  initialThreads: FunctionReturnType<typeof api.threads.list>
}) {
  const { isAuthenticated } = useConvexAuth()
  const threads =
    useQuery(api.threads.list, isAuthenticated ? {} : "skip") ?? initialThreads

  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const groupedThreads = useMemo(() => {
    return threads.reduce(
      (acc, thread) => {
        const group = getDateGroup(thread.lastMessageAt)
        if (!acc[group]) acc[group] = []
        acc[group].push(thread)
        return acc
      },
      {} as Record<string, typeof threads>
    )
  }, [threads])

  if (!threads.length) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="mx-auto w-fit text-center text-sm">
          No threads
        </SidebarGroupLabel>
      </SidebarGroup>
    )
  }

  return (
    <>
      {threadToDelete && (
        <DeleteThread
          thread={threadToDelete}
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open)
            if (!open) setTimeout(() => setThreadToDelete(null), 300)
          }}
        />
      )}
      {Object.entries(groupedThreads).map(([group, threads]) => (
        <SidebarGroup key={group}>
          <SidebarGroupLabel>{group}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.map((thread) => (
                <ThreadItem
                  key={thread._id}
                  {...thread}
                  onDelete={(thread) => {
                    setThreadToDelete(thread)
                    setIsDeleteOpen(true)
                  }}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

type Thread = Doc<"threads">

function ThreadItem({
  onDelete,
  ...thread
}: Thread & {
  parentThread: Thread | null
  onDelete: (thread: Thread) => void
}) {
  const router = useRouter()
  const { threadId } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState("")

  const updateTitleMutation = useMutation(
    api.threads.update
  ).withOptimisticUpdate((store, { threadId, title }) => {
    const threads = store.getQuery(api.threads.list)
    if (threads !== undefined) {
      const updatedThreads = threads.map((thread) => {
        if (thread._id === threadId) return { ...thread, title }
        return thread
      })
      store.setQuery(api.threads.list, {}, updatedThreads)
    }
  })

  function startEditing() {
    setValue(thread.title)
    setIsEditing(true)
  }

  async function updateTitle() {
    if (!value.trim() || value === thread.title) {
      setIsEditing(false)
      setValue("")
      focusThreadInput()
      return
    }

    setIsEditing(false)
    focusThreadInput()
    setValue("")

    await updateTitleMutation({
      threadId: thread._id,
      title: value.trim()
    }).catch((error) => {
      toast.error(parseError(error, "Failed to update thread title"))
    })
  }

  return (
    <ContextMenu>
      <SidebarMenuItem>
        <ContextMenuTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={threadId === thread._id || isEditing}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            onDoubleClick={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()
              startEditing()
            }}
          >
            <Link href={`/threads/${thread._id}`}>
              {thread.parentThread && (
                <Tooltip delayDuration={500}>
                  <TooltipTrigger
                    onClick={(evt) => {
                      evt.preventDefault()
                      evt.stopPropagation()
                      router.push(`/threads/${thread.parentThread?._id}`)
                    }}
                  >
                    <BranchIcon className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={10}
                    className="max-w-[300px]"
                  >
                    Branch from: {thread.parentThread?.title}
                  </TooltipContent>
                </Tooltip>
              )}

              {isEditing ? (
                <input
                  value={value}
                  ref={(el) => el?.focus()}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                  onBlur={updateTitle}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") updateTitle()
                  }}
                />
              ) : (
                <Tooltip delayDuration={1000}>
                  <TooltipTrigger className="max-w-full overflow-hidden">
                    <p className="truncate">{thread.title}</p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={10}
                    align="center"
                    className="max-w-[300px]"
                  >
                    {thread.title}
                  </TooltipContent>
                </Tooltip>
              )}
            </Link>
          </SidebarMenuButton>
        </ContextMenuTrigger>
      </SidebarMenuItem>

      {!isEditing && (
        <ContextMenuContent
          className="bg-background text-foreground"
          onCloseAutoFocus={(evt) => evt.preventDefault()}
          onPointerDownOutside={focusThreadInput}
          onEscapeKeyDown={focusThreadInput}
        >
          <ContextMenuItem
            onSelect={() => {
              navigator.clipboard
                .writeText(`${window.location.origin}/threads/${thread._id}`)
                .then(() => toast.success("Thread url copied to clipboard"))
            }}
          >
            <CopyIcon />
            Copy URL
          </ContextMenuItem>
          <ContextMenuItem onSelect={startEditing}>
            <EditIcon />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            onSelect={() => onDelete(thread)}
          >
            <Trash2Icon />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}
