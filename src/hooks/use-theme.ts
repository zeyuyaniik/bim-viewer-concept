import { useCallback, useEffect, useState } from "react"

export type Theme = "light" | "dark"

function initialTheme(): Theme {
  if (typeof document === "undefined") return "light"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme)
    } catch {
      /* storage can be unavailable; the theme still applies for this session */
    }
  }, [theme])

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    // flip the class before re-rendering so anything reading CSS variables
    // during this render (the 3D scene) already sees the new palette
    document.documentElement.classList.toggle("dark", next === "dark")
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
