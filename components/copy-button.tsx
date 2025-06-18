"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckIcon, CopyIcon } from "lucide-react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

type ButtonProps = React.ComponentProps<typeof TooltipTrigger> &
  VariantProps<typeof buttonVariants>

export function CopyButton({
  className,
  text,
  tooltip = "Copy message",
  variant = "ghost",
  size = "icon",
  ...props
}: ButtonProps & { text: string; tooltip?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch((error) => {
      console.error("[COPY_ERROR]", error)
      toast.error("Failed to copy to clipboard")
    })

    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={() => handleCopy(text)}
        className={cn(
          buttonVariants({
            variant,
            size,
            className: "relative size-8 shrink-0"
          }),
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <CheckIcon
            className={cn(
              "transition-transform ease-in-out",
              copied ? "scale-100" : "scale-0"
            )}
          />
        </div>
        <CopyIcon
          className={cn(
            "transition-transform ease-in-out",
            copied ? "scale-0" : "scale-100"
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
