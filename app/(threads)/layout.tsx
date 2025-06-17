import Link from "next/link"
import { cookies } from "next/headers"
import { Suspense } from "react"
import { fetchQuery } from "convex/nextjs"

import { parseCookie } from "@/lib/utils"
import { getAuthToken } from "@/lib/auth"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { DEFAULT_MODEL, getModelById } from "@/lib/models"
import { ThemeSwitcher } from "@/components/theme-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar"

import { Header } from "./_components/header"
import { ThreadInput } from "./_components/thread-input"
import { ThreadsList } from "./_components/threads-list"

function ThreadsLoading() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Loading...</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {Array.from({ length: 10 }).map((_, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuSkeleton index={index} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export default async function ThreadsLayout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const modelId = getModelById(
    parseCookie(cookieStore.get("model_id")?.value, DEFAULT_MODEL)
  ).id

  const hasSearch = parseCookie(cookieStore.get("search")?.value, false)

  const sidebarState = parseCookie(
    cookieStore.get("sidebar_state")?.value,
    true
  )

  return (
    <SidebarProvider defaultOpen={sidebarState}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <SidebarTrigger />
            <Link
              href="/"
              className="text-primary focus-visible:ring-ring text-[23px] font-bold outline-none focus-visible:ring-2"
            >
              T3.Clone
            </Link>
            <ThemeSwitcher />
          </div>

          <Button className="mt-2 w-full" asChild>
            <Link href="/">New Chat</Link>
          </Button>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden outline-none">
          <Suspense fallback={<ThreadsLoading />}>
            <ThreadsListAsync />
          </Suspense>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="max-h-svh overflow-hidden">
        <Header />
        <div className="h-full flex-1">{children}</div>
        <ThreadInput modelId={modelId} hasSearch={hasSearch} />
      </SidebarInset>
    </SidebarProvider>
  )
}

async function ThreadsListAsync() {
  const token = await getAuthToken()
  // idk if it is worth it but I feel it made the query faster
  const initialThreads = await fetchQuery(api.threads.list, undefined, {
    token
  })

  return <ThreadsList initialThreads={initialThreads} />
}
