"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BranchIcon } from "@/components/icons/branch"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

export function BranchOff({ messageId }: { messageId: Id<"messages"> }) {
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
