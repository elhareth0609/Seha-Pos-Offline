
"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

const themes = ['light', 'dark', 'theme-blue', 'theme-green', 'theme-rose', 'theme-black', 'theme-violet', 'theme-serenity-blue', 'theme-radiant-orchid', 'theme-golden-sunset', 'theme-forest-dreams', 'theme-crimson-elegance', 'theme-pastel-paradise'];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
      setIsMounted(true);
  }, []);

  const cycleTheme = () => {
    const currentTheme = theme?.includes('theme-') ? theme : (theme === 'dark' ? 'dark' : 'light');
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  if (!isMounted) {
      return (
          <Button variant="ghost" size="icon" disabled className="h-8 w-8">
              <Sun className="h-4 w-4" />
          </Button>
      );
  }

  return (
    <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        className="h-8 w-8"
        aria-label="Toggle theme"
    >
        {theme === 'light' || theme === 'system' ? (
             <Sun className="h-4 w-4 transition-all" />
        ) : theme === 'dark' ? (
            <Moon className="h-4 w-4 transition-all" />
        ) : (
            <Palette className="h-4 w-4 transition-all" />
        )}
        <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
