"use client"

import { UserButton } from "@clerk/nextjs"
import { Authenticated, AuthLoading } from "convex/react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"

export function Header() {
  const { open } = useSidebar()

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
        <Authenticated>
          <UserButton signInUrl={ROUTES.auth} />
        </Authenticated>
        <AuthLoading>
          <Skeleton className="size-7 shrink-0 rounded-full" />
        </AuthLoading>
      </div>
    </header>
  )
}
