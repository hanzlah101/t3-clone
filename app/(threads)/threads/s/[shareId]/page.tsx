"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"

import { Thread } from "../../_components/thread"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"

export default function ShareThreadPage() {
  const { shareId }: { shareId: Id<"threads"> } = useParams()
  const messages = useQuery(api.messages.listShared, { shareId })

  if (messages === undefined) {
    return (
      <div className="mx-auto max-w-4xl p-8 pt-16">
        <TextShimmer>Loading...</TextShimmer>
      </div>
    )
  }

  return <Thread queryMessages={messages} />
}
