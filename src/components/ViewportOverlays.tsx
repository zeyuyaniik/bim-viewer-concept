import type * as React from "react"
import { Hand, MousePointer2, Move3d } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { IconFitView, IconSectionCut, IconXray } from "@/components/icons/bim-icons"
import { LEVELS, MODEL_HEIGHT } from "@/data/model"
import type { DisplayMode, Tool, ViewPreset } from "@/types"
import { cn } from "@/lib/utils"

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-2 rounded border border-background/25 px-1 font-sans text-[10px] leading-4 text-background/70">
      {children}
    </kbd>
  )
}

function ToolButton({
  label,
  shortcut,
  pressed,
  onClick,
  children,
}: {
  label: string
  shortcut: string
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="tool" size="icon-sm" aria-label={label} aria-pressed={pressed ?? undefined} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {label}
        <Kbd>{shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

export function ViewportToolbar({
  tool,
  setTool,
  displayMode,
  toggleXray,
  sectionOn,
  toggleSection,
  onFit,
  hasSelection,
}: {
  tool: Tool
  setTool: (t: Tool) => void
  displayMode: DisplayMode
  toggleXray: () => void
  sectionOn: boolean
  toggleSection: () => void
  onFit: () => void
  hasSelection: boolean
}) {
  return (
    <div
      role="toolbar"
      aria-label="Viewport tools"
      aria-orientation="vertical"
      className="absolute top-3 left-3 z-10 flex flex-col gap-1 rounded-lg border bg-card/95 p-1 shadow-sm backdrop-blur"
    >
      <ToolButton label="Select" shortcut="V" pressed={tool === "select"} onClick={() => setTool("select")}>
        <MousePointer2 />
      </ToolButton>
      <ToolButton
        label={hasSelection ? "Move element" : "Move element (select one first)"}
        shortcut="G"
        pressed={tool === "move"}
        onClick={() => setTool("move")}
      >
        <Move3d />
      </ToolButton>
      <ToolButton label="Pan" shortcut="H" pressed={tool === "pan"} onClick={() => setTool("pan")}>
        <Hand />
      </ToolButton>
      <Separator className="my-0.5" />
      <ToolButton label={hasSelection ? "Zoom to selection" : "Zoom to fit"} shortcut="F" onClick={onFit}>
        <IconFitView />
      </ToolButton>
      <ToolButton label="X-ray" shortcut="X" pressed={displayMode === "xray"} onClick={toggleXray}>
        <IconXray />
      </ToolButton>
      <ToolButton label="Section cut" shortcut="C" pressed={sectionOn} onClick={toggleSection}>
        <IconSectionCut />
      </ToolButton>
    </div>
  )
}

const VIEW_LABEL: Record<ViewPreset, string> = { iso: "3D", top: "Top", front: "Front", side: "Side" }

export function ViewPresets({ onView }: { onView: (v: ViewPreset) => void }) {
  return (
    <div
      role="group"
      aria-label="Camera views"
      className="absolute top-3 right-3 z-10 flex rounded-lg border bg-card/95 p-1 shadow-sm backdrop-blur"
    >
      {(Object.keys(VIEW_LABEL) as ViewPreset[]).map((v, i) => (
        <Tooltip key={v}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs" onClick={() => onView(v)}>
              {VIEW_LABEL[v]}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {VIEW_LABEL[v]} view
            <Kbd>{i + 1}</Kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

export function SectionControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const max = Math.ceil(MODEL_HEIGHT + 1)
  return (
    <div className="absolute bottom-3 left-3 right-[8.5rem] z-10 max-w-[360px] rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span id="section-label" className="text-xs font-medium">
          Section height
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{value.toFixed(2)} m</span>
      </div>
      <Slider
        aria-labelledby="section-label"
        min={0.3}
        max={max}
        step={0.05}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
      <div className="mt-2.5 flex gap-1">
        {LEVELS.slice(0, 3).map((l) => {
          const cut = l.elevation + 1.5
          const active = Math.abs(value - cut) < 0.01
          return (
            <Button
              key={l.id}
              variant="outline"
              size="sm"
              className={cn("h-6 flex-1 px-2 text-[11px] font-normal", active && "border-selection text-foreground")}
              onClick={() => onChange(cut)}
            >
              Cut {l.name.toLowerCase()}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
