"use client"

import { UserButton } from "@clerk/nextjs"
import { useParams } from "next/navigation"
import { Authenticated, AuthLoading } from "convex/react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ShareThread } from "./share-thread"
import { type Id } from "@/convex/_generated/dataModel"

export function Header() {
  const { open } = useSidebar()
  const { threadId }: { threadId?: Id<"threads"> } = useParams()

  return (
    <header
      className={cn(
        "bg-background/60 fixed top-0 right-0 z-50 flex h-12 w-full shrink-0 items-center justify-between px-8 py-4 backdrop-blur",
        { "md:left-64 md:w-[calc(100%-16rem)]": open }
      )}
    >
      <div className={cn({ "md:hidden": open })}>
        <SidebarTrigger />
      </div>

      <div className="ml-auto flex items-center space-x-2">
        {threadId && <ShareThread />}

        <Authenticated>
          <div className="bg-accent size-7 shrink-0 rounded-full">
            <UserButton signInUrl={ROUTES.auth} />
          </div>
        </Authenticated>
        <AuthLoading>
          <Skeleton className="size-7 shrink-0 rounded-full" />
        </AuthLoading>
      </div>
    </header>
  )
}
