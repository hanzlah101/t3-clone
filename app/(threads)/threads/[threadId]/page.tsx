import { fetchQuery } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import { getAuthToken } from "@/lib/auth"
import { ThreadMessages } from "../_components/thread-messages"
import { type Id } from "@/convex/_generated/dataModel"

type ThreadProps = {
  params: Promise<{
    threadId: Id<"threads">
  }>
}

export default async function Thread({ params }: ThreadProps) {
  const { threadId } = await params
  const token = await getAuthToken()
  const messages = await fetchQuery(api.messages.list, { threadId }, { token })

  return <ThreadMessages initialMessages={messages} />
}
