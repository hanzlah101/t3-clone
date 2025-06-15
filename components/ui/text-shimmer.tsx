"use client"

import * as React from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export type TextShimmerProps = {
  children: string
  className?: string
  duration?: number
  spread?: number
}

function TextShimmerComponent({
  children,
  className,
  duration = 1,
  spread = 2
}: TextShimmerProps) {
  const dynamicSpread = React.useMemo(() => {
    return children.length * spread
  }, [children, spread])

  return (
    <motion.p
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text font-mono text-sm",
        "text-transparent [--base-color:var(--color-base-400)] [--base-gradient-color:var(--color-base-700)]",
        "[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        "dark:[--base-color:var(--color-base-300)] dark:[--base-gradient-color:var(--color-base-50)] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
        repeatDelay: 0.1
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`
        } as React.CSSProperties
      }
    >
      {children}
    </motion.p>
  )
}

export const TextShimmer = React.memo(TextShimmerComponent)
