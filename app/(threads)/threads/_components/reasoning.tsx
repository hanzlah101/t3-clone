"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "./markdown-renderer"
import { TextShimmer } from "@/components/ui/text-shimmer"

export type ReasoningPart = {
  isReasoning?: boolean
  details: (
    | {
        type: "text"
        text: string
        signature?: string
      }
    | {
        type: "redacted"
        data: string
      }
  )[]
}

export function Reasoning({ isReasoning, details }: ReasoningPart) {
  const [isExpanded, setIsExpanded] = useState(false)

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: 0
    }
  }

  useEffect(() => {
    if (isReasoning) {
      setIsExpanded(true)
    }
  }, [isReasoning])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (!isReasoning) {
      timeout = setTimeout(() => setIsExpanded(false), 500)
    }
    return () => clearTimeout(timeout)
  }, [isReasoning])

  return (
    <div className="mb-3 flex flex-col">
      {isReasoning ? (
        <div className="overflow-visible">
          <TextShimmer className="pointer-events-none">
            Reasoning...
          </TextShimmer>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex w-fit items-center gap-2 font-mono text-sm font-medium transition-colors",
            isExpanded
              ? "text-foreground"
              : "text-muted-foreground hover:text-muted-foreground/80"
          )}
        >
          Reasoned for a few seconds
          <ChevronRightIcon
            className={cn("size-4 transition-all duration-300", {
              "rotate-90": isExpanded
            })}
          />
        </button>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-muted-foreground flex flex-col gap-4 border-l-2 pl-3 text-sm"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {details.map((detail, detailIndex) =>
              detail.type === "text" ? (
                <MarkdownRenderer key={detailIndex}>
                  {detail.text}
                </MarkdownRenderer>
              ) : (
                "<redacted>"
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
