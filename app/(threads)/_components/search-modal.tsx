"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useConvexAuth } from "convex/react"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import {
  MoonIcon,
  SunIcon,
  Laptop2Icon,
  BotMessageSquareIcon
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command"

export function SearchModal() {
  const { isAuthenticated } = useConvexAuth()
  const { setTheme } = useTheme()
  const threads = useQuery(api.threads.list, isAuthenticated ? {} : "skip")

  const router = useRouter()

  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (threads === undefined) {
    return null
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search threads..." />
      <CommandList>
        <CommandEmpty>No threads found.</CommandEmpty>

        <CommandGroup heading="Threads">
          {threads.map((thread) => (
            <CommandItem
              key={thread._id}
              onSelect={() => {
                router.push(`/threads/${thread._id}`)
                setOpen(false)
              }}
            >
              <BotMessageSquareIcon />
              <p className="line-clamp-1">{thread.title}</p>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => {
              setTheme("dark")
              setOpen(false)
            }}
          >
            <MoonIcon />
            Dark
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("light")
              setOpen(false)
            }}
          >
            <SunIcon />
            Light
          </CommandItem>

          <CommandItem
            onSelect={() => {
              setTheme("system")
              setOpen(false)
            }}
          >
            <Laptop2Icon />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
