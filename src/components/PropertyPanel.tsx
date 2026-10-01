import { useEffect, useState } from "react"
import { Check, Crosshair, Minus, Move3d, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_ICON } from "@/components/icons/bim-icons"
import { CATEGORY_LABEL, ELEMENTS, LEVELS, type Category, type Element, type PropValue } from "@/data/model"
import type { Vec3 } from "@/types"

type Props = {
  element: Element | null
  name: string
  offset: Vec3
  onRename: (name: string) => void
  onOffsetChange: (v: Vec3) => void
  onZoomTo: () => void
  onMove: () => void
  onClear: () => void
}

export function PropertyPanel({ element, name, offset, onRename, onOffsetChange, onZoomTo, onMove, onClear }: Props) {
  if (!element) return <EmptyState />

  const Icon = CATEGORY_ICON[element.category]
  const level = LEVELS.find((l) => l.id === element.level)
  const moved = offset.some((v) => Math.abs(v) > 1e-6)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 pt-3 pb-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-selection/20 text-foreground">
            <Icon />
          </span>
          <Badge variant="outline" className="font-normal">
            {element.ifcClass}
          </Badge>
          <span className="truncate text-xs text-muted-foreground">{level?.name}</span>
          <Button variant="ghost" size="icon-sm" className="ml-auto size-7" aria-label="Clear selection" onClick={onClear}>
            <X />
          </Button>
        </div>
        <NameField key={element.id} value={name} onCommit={onRename} />
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onZoomTo}>
            <Crosshair /> Zoom to
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onMove}>
            <Move3d /> Move
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <section aria-labelledby="loc-h">
          <div className="mb-2 flex items-center justify-between">
            <h3 id="loc-h" className="text-xs font-medium text-muted-foreground">
              Position offset
            </h3>
            {moved && (
              <Button variant="ghost" size="sm" className="-mr-2 h-6 px-2 text-xs" onClick={() => onOffsetChange([0, 0, 0])}>
                <RotateCcw className="size-3" /> Reset
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["X", "Y", "Z"] as const).map((axis, i) => (
              <AxisInput
                key={`${element.id}-${axis}`}
                axis={axis}
                value={offset[i]}
                onCommit={(v) => {
                  const next = [...offset] as Vec3
                  next[i] = v
                  onOffsetChange(next)
                }}
              />
            ))}
          </div>
        </section>

        {element.psets.map((pset) => (
          <section key={pset.name} className="mt-5" aria-label={pset.name}>
            <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">{pset.name}</h3>
            <dl className="divide-y divide-border/70">
              {Object.entries(pset.props).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-1.5 text-[13px]">
                  <dt className="truncate text-muted-foreground" title={k}>
                    {k}
                  </dt>
                  <dd className="min-w-0 break-words">
                    <Value v={v} mono={k === "GlobalId"} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}

function Value({ v, mono }: { v: PropValue; mono?: boolean }) {
  if (typeof v === "boolean")
    return (
      <span className="inline-flex items-center gap-1">
        {v ? <Check className="size-3.5" /> : <Minus className="size-3.5 text-muted-foreground" />}
        {v ? "Yes" : "No"}
      </span>
    )
  return <span className={mono ? "font-mono text-xs break-all" : undefined}>{String(v)}</span>
}

function NameField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const commit = () => {
    const v = draft.trim()
    if (v && v !== value) onCommit(v)
    else setDraft(value)
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor="el-name">Name</Label>
      <Input
        id="el-name"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
          if (e.key === "Escape") {
            setDraft(value)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        className="h-8 text-sm font-medium"
      />
    </div>
  )
}

const AXIS_COLOR = { X: "bg-axis-x", Y: "bg-axis-y", Z: "bg-axis-z" } as const

function AxisInput({ axis, value, onCommit }: { axis: "X" | "Y" | "Z"; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(value.toFixed(2))
  useEffect(() => setDraft(value.toFixed(2)), [value])
  const commit = () => {
    const n = Number.parseFloat(draft.replace(",", "."))
    if (Number.isFinite(n)) onCommit(Math.round(n * 100) / 100)
    else setDraft(value.toFixed(2))
  }
  const id = `axis-${axis}`
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {axis} offset in metres
      </label>
      <span aria-hidden className={`absolute top-1.5 bottom-1.5 left-1.5 w-0.5 rounded-full ${AXIS_COLOR[axis]}`} />
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[11px] text-muted-foreground">
        {axis}
      </span>
      <Input
        id={id}
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault()
            const step = e.shiftKey ? 1 : 0.1
            onCommit(Math.round((value + (e.key === "ArrowUp" ? step : -step)) * 100) / 100)
          }
        }}
        className="pl-7 text-right text-[13px] tabular-nums"
      />
    </div>
  )
}

function EmptyState() {
  const counts = ELEMENTS.reduce<Partial<Record<Category, number>>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})
  return (
    <div className="flex h-full flex-col px-4 py-4">
      <h2 className="text-sm font-medium">Nothing selected</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        Click an element in the model or the tree to see its properties. Drag to orbit, scroll to zoom.
      </p>
      <Separator className="my-4" />
      <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">In this model</h3>
      <dl className="divide-y divide-border/70">
        {(Object.keys(counts) as Category[]).map((c) => {
          const Icon = CATEGORY_ICON[c]
          return (
            <div key={c} className="flex items-center gap-2 py-1.5 text-[13px]">
              <Icon className="text-muted-foreground" />
              <dt className="flex-1">{CATEGORY_LABEL[c]}</dt>
              <dd className="tabular-nums text-muted-foreground">{counts[c]}</dd>
            </div>
          )
        })}
        <div className="flex items-center gap-2 py-1.5 text-[13px] font-medium">
          <dt className="flex-1 pl-6">Total</dt>
          <dd className="tabular-nums">{ELEMENTS.length}</dd>
        </div>
      </dl>
    </div>
  )
}
