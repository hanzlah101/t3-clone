"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useConvexAuth } from "convex/react"

import { TextShimmer } from "@/components/ui/text-shimmer"
import { useDeleteThread } from "@/stores/use-delete-thread"

export function ThreadsWrapper({ children }: { children: React.ReactNode }) {
  const { threadId } = useParams()
  const { isLoading } = useConvexAuth()
  const { deletingThread, setDeletingThread } = useDeleteThread()

  useEffect(() => {
    if (threadId !== deletingThread) {
      setDeletingThread(null)
    }

    return () => {
      if (deletingThread) {
        setDeletingThread(null)
      }
    }
  }, [threadId, deletingThread, setDeletingThread])

  if (isLoading) {
    return (
      <div className="flex size-full flex-1 items-center justify-center text-center text-sm">
        <TextShimmer>Loading...</TextShimmer>
      </div>
    )
  }

  if (threadId === deletingThread) {
    return (
      <div className="flex size-full flex-1 items-center justify-center text-center text-sm">
        <TextShimmer>Redirecting...</TextShimmer>
      </div>
    )
  }

  return children
}
