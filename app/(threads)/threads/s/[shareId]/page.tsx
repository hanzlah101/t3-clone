import { fetchQuery } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import { getAuthToken } from "@/lib/auth"
import { ThreadMessages } from "../../_components/thread-messages"

type ShareThreadProps = {
  params: Promise<{ shareId: string }>
}

export default async function ShareThread({ params }: ShareThreadProps) {
  const { shareId } = await params
  const token = await getAuthToken()
  const messages = await fetchQuery(
    api.messages.listShared,
    { shareId },
    { token }
  )

  return <ThreadMessages initialMessages={messages} />
}
