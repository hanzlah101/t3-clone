import { create } from "zustand"

type DeleteThreadStore = {
  deletingThread: string | null
  setDeletingThread: (deletingThread: string | null) => void
}

export const useDeleteThread = create<DeleteThreadStore>((set) => ({
  deletingThread: null,
  setDeletingThread: (deletingThread) => set({ deletingThread })
}))
