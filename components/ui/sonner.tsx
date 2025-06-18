"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          toast: "backdrop-blur-xl !border-border/70"
        }
      }}
      style={
        {
          "--normal-bg": "var(--popover)/90",
          "--normal-text": "var(--popover-foreground)"
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
