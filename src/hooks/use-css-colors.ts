import { useMemo } from "react"
import type { Theme } from "./use-theme"

const KEYS = [
  "viewport",
  "viewport-grid",
  "viewport-grid-strong",
  "selection-3d",
  "axis-x",
  "axis-y",
  "axis-z",
  "cat-wall",
  "cat-slab",
  "cat-column",
  "cat-window",
  "cat-door",
  "cat-roof",
  "foreground",
  "border",
] as const

export type SceneColors = Record<(typeof KEYS)[number], string>

/**
 * The 3D scene can't read CSS variables, so this bridges the token layer
 * into three.js. Recomputed whenever the theme flips, which keeps the
 * canvas and the 2D chrome on the same palette.
 */
export function useCssColors(theme: Theme): SceneColors {
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(KEYS.map((k) => [k, style.getPropertyValue(`--${k}`).trim()])) as SceneColors
    // theme is the trigger: the class on <html> has already changed when this runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])
}
