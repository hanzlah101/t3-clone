// import { useChat } from "@ai-sdk/react"
// import { useParams } from "next/navigation"

import { ScrollWrapper } from "./_components/scroll-wrapper"
import { ThreadMessages } from "./_components/thread-messages"

export default function Thread() {
  // const { threadId } = useParams()

  // const { status } = useChat({
  //   id: threadId
  // })

  return (
    <ScrollWrapper>
      <ThreadMessages />
    </ScrollWrapper>
  )
}
