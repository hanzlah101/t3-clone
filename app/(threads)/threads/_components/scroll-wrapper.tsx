"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { focusThreadInput } from "@/lib/utils"

const DEFAULT_PADDING = 139

function useBottom() {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting)
      },
      { threshold: 0.7 }
    )

    if (bottomRef.current) {
      observer.observe(bottomRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return { isAtBottom, setIsAtBottom, bottomRef }
}

export function ScrollWrapper({ children }: { children: React.ReactNode }) {
  const [formHeight, setFormHeight] = useState(DEFAULT_PADDING)
  const { isAtBottom, setIsAtBottom, bottomRef } = useBottom()

  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" })
    focusThreadInput()
    setIsAtBottom(true)
  }

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

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formHeight, isAtBottom])

  const padding = Math.max(formHeight, DEFAULT_PADDING)

  return (
    <main
      ref={containerRef}
      className="flex h-full flex-1 flex-col-reverse space-y-4 space-y-reverse overflow-y-auto"
    >
      <div
        ref={bottomRef}
        style={{ height: padding }}
        className="pointer-events-none w-full shrink-0"
      />
      <div className="mx-auto mb-auto w-full max-w-4xl px-8 pt-16 pb-8">
        {children}

        {!isAtBottom && (
          <Button
            size="sm"
            variant="ghost"
            style={{ bottom: `${padding + 10}px` }}
            className="dark:bg-accent/60 bg-base-200/60 hover:bg-base-200/60 dark:hover:bg-accent/80 absolute left-[50%] translate-x-[-50%] rounded-full text-[13px] backdrop-blur-xs"
            onClick={() => {
              scrollToBottom()
              focusThreadInput()
            }}
          >
            Scroll to bottom
            <ChevronDownIcon />
          </Button>
        )}
      </div>
    </main>
  )
}
