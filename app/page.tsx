"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <main>
      <Button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {resolvedTheme === "dark" ? "Light" : "Dark"}
      </Button>
    </main>
  )
}
