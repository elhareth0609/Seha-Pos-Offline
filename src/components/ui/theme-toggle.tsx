
"use client"

import * as React from "react"
import { Moon, Sun, Paintbrush } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("theme-pink")
    } else {
      setTheme("light")
    }
  }
  return (
    <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8"
        aria-label="Toggle theme"
    >
        <Paintbrush className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
