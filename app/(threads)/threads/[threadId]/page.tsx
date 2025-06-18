"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"

import { Thread } from "../_components/thread"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"

export default function ThreadPage() {
  const { threadId }: { threadId: Id<"threads"> } = useParams()
  const messages = useQuery(api.messages.list, { threadId })

  return <Thread queryMessages={messages} />
}
