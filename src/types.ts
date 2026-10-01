import type { Category } from "@/data/model"

export type Tool = "select" | "move" | "pan"
export type DisplayMode = "shaded" | "xray"
export type ViewPreset = "iso" | "top" | "front" | "side"
export type Vec3 = [number, number, number]

export type ViewerState = {
  selectedId: string | null
  hoveredId: string | null
  tool: Tool
  displayMode: DisplayMode
  hiddenLevels: Set<string>
  hiddenCategories: Set<Category>
  cutHeight: number | null
  offsets: Record<string, Vec3>
  names: Record<string, string>
}

export type ViewportHandle = {
  fit: (target?: "all" | "selection") => void
  setView: (preset: ViewPreset) => void
}
