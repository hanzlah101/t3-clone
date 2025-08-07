"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom"

import { Button } from "@/components/ui/button"

export function ScrollWrapper({ children }: { children: React.ReactNode }) {
  const [formHeight, setFormHeight] = useState(139)

  useEffect(() => {
    const form = document.getElementById("thread-form")
    if (!form) return

    setFormHeight(form.getBoundingClientRect().height)

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && entries[0].target === form) {
        setFormHeight(entries[0].contentRect.height)
      }
    })

    resizeObserver.observe(form)

    return () => {
      resizeObserver.unobserve(form)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <StickToBottom
      initial="instant"
      resize="smooth"
      className="relative h-full"
    >
      <StickToBottom.Content
        style={{ paddingBottom: `${formHeight + 32}px` }}
        className="mx-auto flex max-w-4xl flex-col space-y-4 px-8 pt-20"
      >
        {children}
      </StickToBottom.Content>
      <ScrollToBottom style={{ paddingBottom: `${formHeight + 10}px` }} />
    </StickToBottom>
  )
}

function ScrollToBottom({ style }: { style?: React.CSSProperties }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  return (
    !isAtBottom && (
      <div
        style={style}
        className="absolute bottom-0 left-[50%] translate-x-[-50%]"
      >
        <Button
          size="sm"
          variant="ghost"
          className="dark:bg-accent/60 bg-base-200/60 hover:bg-base-200/60 dark:hover:bg-accent/80 rounded-full text-[13px] backdrop-blur-xs"
          onClick={() => {
            scrollToBottom()
            document.getElementById("thread-input")?.focus()
          }}
        >
          Scroll to bottom
          <ChevronDownIcon />
        </Button>
      </div>
    )
  )
}
