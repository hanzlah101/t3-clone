"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MarkdownRenderer } from "./markdown-renderer"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"

export type ReasoningPart = {
  type: "reasoning"
  reasoning: string
  details: Array<{ type: "text"; text: string }>
}

type ReasoningMessagePartProps = {
  part: ReasoningPart
  isReasoning: boolean
}

export function ReasoningMessagePart({
  part,
  isReasoning
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(true)

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
    if (!isReasoning) {
      setIsExpanded(false)
    }
  }, [isReasoning])

  return (
    <div className="flex flex-col">
      {isReasoning ? (
        <div className="flex flex-row items-center gap-2">
          <div className="text-sm font-medium">Reasoning</div>
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-row items-center gap-2">
          <div className="text-sm font-medium">Reasoned for a few seconds</div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn("size-6 cursor-pointer rounded-full", {
              "bg-accent dark:bg-accent-foreground": isExpanded
            })}
          >
            {isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </Button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-base-400 dark:text-base-600 flex flex-col gap-4 border-l pl-3 text-sm"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {part.details.map((detail, detailIndex) =>
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
