import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Moon, PanelLeft, PanelRight, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LogoMark } from "@/components/icons/bim-icons"
import { ModelTree } from "@/components/ModelTree"
import { PropertyPanel } from "@/components/PropertyPanel"
import { SectionControl, ViewportToolbar, ViewPresets } from "@/components/ViewportOverlays"
import { Viewport } from "@/components/viewport/Viewport"
import { ELEMENTS, ELEMENT_BY_ID, LEVELS, type Category } from "@/data/model"
import { useTheme } from "@/hooks/use-theme"
import { useCssColors } from "@/hooks/use-css-colors"
import type { DisplayMode, Tool, Vec3, ViewPreset, ViewportHandle } from "@/types"
import { cn } from "@/lib/utils"

const ZERO: Vec3 = [0, 0, 0]

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const colors = useCssColors(theme)
  const viewport = useRef<ViewportHandle>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>("select")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("shaded")
  const [cutHeight, setCutHeight] = useState<number | null>(null)
  const [hiddenLevels, setHiddenLevels] = useState<Set<string>>(new Set())
  const [hiddenCategories, setHiddenCategories] = useState<Set<Category>>(new Set())
  const [offsets, setOffsets] = useState<Record<string, Vec3>>({})
  const [names, setNames] = useState<Record<string, string>>({})
  const [panel, setPanel] = useState<"tree" | "props" | null>(null) // small screens only

  const visible = useMemo(
    () => ELEMENTS.filter((e) => !hiddenLevels.has(e.level) && !hiddenCategories.has(e.category)),
    [hiddenLevels, hiddenCategories]
  )

  // hiding an element's level or category also drops it from the selection
  useEffect(() => {
    if (selectedId && !visible.some((e) => e.id === selectedId)) setSelectedId(null)
  }, [visible, selectedId])

  const toggleIn = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set)
    if (n.has(v)) n.delete(v)
    else n.add(v)
    return n
  }

  const setOffset = useCallback((id: string, v: Vec3) => setOffsets((o) => ({ ...o, [id]: v })), [])
  const fit = useCallback(() => viewport.current?.fit(selectedId ? "selection" : "all"), [selectedId])
  const toggleSection = useCallback(() => setCutHeight((h) => (h == null ? LEVELS[1].elevation + 1.5 : null)), [])
  const toggleXray = useCallback(() => setDisplayMode((m) => (m === "xray" ? "shaded" : "xray")), [])

  // keyboard shortcuts, skipped while typing in a field
  useEffect(() => {
    const views: Record<string, ViewPreset> = { "1": "iso", "2": "top", "3": "front", "4": "side" }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest("input, textarea, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === "v") setTool("select")
      else if (k === "g") setTool("move")
      else if (k === "h") setTool("pan")
      else if (k === "f") fit()
      else if (k === "x") toggleXray()
      else if (k === "c") toggleSection()
      else if (k === "escape") {
        setSelectedId(null)
        setTool((t) => (t === "move" ? "select" : t))
      } else if (views[k]) viewport.current?.setView(views[k])
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fit, toggleSection, toggleXray])

  const selected = selectedId ? ELEMENT_BY_ID.get(selectedId) ?? null : null
  const statusTarget = hoveredId ?? selectedId
  const statusName = statusTarget ? names[statusTarget] ?? ELEMENT_BY_ID.get(statusTarget)?.name : null

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* top bar */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-card px-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Model tree"
            aria-expanded={panel === "tree"}
            onClick={() => setPanel((p) => (p === "tree" ? null : "tree"))}
          >
            <PanelLeft />
          </Button>
          <LogoMark />
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="truncate text-sm font-semibold">Harbour Street Office</h1>
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">ARC_model_v12.ifc</span>
          </div>
          <Badge variant="secondary" className="hidden font-normal md:inline-flex">
            IFC 4
          </Badge>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Properties"
              aria-expanded={panel === "props"}
              onClick={() => setPanel((p) => (p === "props" ? null : "props"))}
            >
              <PanelRight />
            </Button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {/* left: model tree */}
          <aside
            aria-label="Model tree"
            className={cn(
              "absolute inset-y-0 left-0 z-30 w-[min(20rem,85vw)] border-r bg-card shadow-lg transition-transform duration-200 lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:shadow-none",
              panel === "tree" ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <ModelTree
              selectedId={selectedId}
              hoveredId={hoveredId}
              names={names}
              hiddenLevels={hiddenLevels}
              hiddenCategories={hiddenCategories}
              onSelect={(id) => {
                setSelectedId(id)
                setPanel(null)
              }}
              onHover={setHoveredId}
              toggleLevel={(id) => setHiddenLevels((s) => toggleIn(s, id))}
              toggleCategory={(c) => setHiddenCategories((s) => toggleIn(s, c))}
            />
          </aside>

          {/* centre: viewport */}
          <main className="relative min-w-0 flex-1 bg-viewport" aria-label="Model viewport">
            <Viewport
              ref={viewport}
              elements={visible}
              colors={colors}
              selectedId={selectedId}
              hoveredId={hoveredId}
              tool={tool}
              displayMode={displayMode}
              cutHeight={cutHeight}
              offsets={offsets}
              onSelect={setSelectedId}
              onHover={setHoveredId}
              onOffsetChange={setOffset}
            />
            <ViewportToolbar
              tool={tool}
              setTool={setTool}
              displayMode={displayMode}
              toggleXray={toggleXray}
              sectionOn={cutHeight != null}
              toggleSection={toggleSection}
              onFit={fit}
              hasSelection={!!selectedId}
            />
            <ViewPresets onView={(v) => viewport.current?.setView(v)} />
            {cutHeight != null && <SectionControl value={cutHeight} onChange={setCutHeight} />}
            {tool === "move" && !selectedId && (
              <p className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-sm">
                Select an element to move it
              </p>
            )}
          </main>

          {/* right: properties */}
          <aside
            aria-label="Properties"
            className={cn(
              "absolute inset-y-0 right-0 z-30 w-[min(22rem,90vw)] border-l bg-card shadow-lg transition-transform duration-200 lg:static lg:z-auto lg:w-80 lg:translate-x-0 lg:shadow-none",
              panel === "props" ? "translate-x-0" : "translate-x-full"
            )}
          >
            <PropertyPanel
              element={selected}
              name={selected ? names[selected.id] ?? selected.name : ""}
              offset={selected ? offsets[selected.id] ?? ZERO : ZERO}
              onRename={(n) => selected && setNames((s) => ({ ...s, [selected.id]: n }))}
              onOffsetChange={(v) => selected && setOffset(selected.id, v)}
              onZoomTo={() => {
                viewport.current?.fit("selection")
                setPanel(null)
              }}
              onMove={() => {
                setTool("move")
                setPanel(null)
              }}
              onClear={() => setSelectedId(null)}
            />
          </aside>

          {panel && (
            <button
              aria-label="Close panel"
              className="absolute inset-0 z-20 bg-foreground/20 lg:hidden"
              onClick={() => setPanel(null)}
            />
          )}
        </div>

        {/* status bar */}
        <footer className="flex h-7 shrink-0 items-center gap-3 border-t bg-card px-3 text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate">{statusName ?? "Ready"}</span>
          <div className="ml-auto flex items-center gap-3 tabular-nums">
            {cutHeight != null && (
              <>
                <span>Section at {cutHeight.toFixed(2)} m</span>
                <Separator orientation="vertical" className="h-3" />
              </>
            )}
            <span className="hidden sm:inline">
              {visible.length} of {ELEMENTS.length} elements shown
            </span>
            <Separator orientation="vertical" className="hidden h-3 sm:block" />
            <span>Metres</span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
