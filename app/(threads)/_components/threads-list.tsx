"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { isToday, isYesterday, subDays, isAfter, subYears } from "date-fns"
import { type FunctionReturnType } from "convex/server"

import { api } from "@/convex/_generated/api"
import { BranchIcon } from "@/components/icons/branch"
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
  const router = useRouter()
  const { threadId } = useParams()
  const { isSignedIn } = useAuth()
  const threads =
    useQuery(api.threads.list, isSignedIn ? {} : "skip") ?? initialThreads

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

  return Object.entries(groupedThreads).map(([group, threads]) => (
    <SidebarGroup key={group}>
      <SidebarGroupLabel>{group}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {threads.map((thread) => (
            <SidebarMenuItem key={thread._id}>
              <SidebarMenuButton asChild isActive={threadId === thread._id}>
                <Link href={`/threads/${thread._id}`}>
                  {thread.parentThread && (
                    <Tooltip>
                      <TooltipTrigger
                        onClick={(evt) => {
                          evt.preventDefault()
                          evt.stopPropagation()
                          router.push(`/threads/${thread.parentThread?._id}`)
                        }}
                      >
                        <BranchIcon className="size-4" />
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
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}
