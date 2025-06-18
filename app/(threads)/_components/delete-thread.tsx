"use client"

import { toast } from "sonner"
import { useMutation } from "convex/react"

import { api } from "@/convex/_generated/api"
import { parseError } from "@/lib/error"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { useDeleteThread } from "@/stores/use-delete-thread"
import { type Doc } from "@/convex/_generated/dataModel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"

export function DeleteThread({
  thread,
  ...props
}: {
  thread: Doc<"threads">
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { threadId } = useParams()
  const setDeletingThread = useDeleteThread((state) => state.setDeletingThread)

  const deleteThread = useMutation(api.threads.remove).withOptimisticUpdate(
    (store, { threadId }) => {
      const threads = store.getQuery(api.threads.list)
      if (threads !== undefined) {
        const newThreads = threads.filter((thread) => thread._id !== threadId)
        store.setQuery(api.threads.list, {}, newThreads)
      }
    }
  )

  async function handleDelete() {
    await deleteThread({ threadId: thread._id }).catch((err) =>
      toast.error(parseError(err, "Failed to delete thread"))
    )

    if (threadId === thread._id) {
      setDeletingThread(thread._id)
      router.push(ROUTES.afterLogin)
    }
  }

  return (
    <AlertDialog {...props}>
      <AlertDialogContent className="max-h-[300px] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete thread</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">{thread.title}</span>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" className="border-0">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
