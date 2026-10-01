import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronRight, Eye, EyeOff } from "lucide-react"
import { CATEGORY_ICON, IconLevel } from "@/components/icons/bim-icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { CATEGORY_LABEL, ELEMENTS, ELEMENT_BY_ID, LEVELS, type Category, type Element } from "@/data/model"
import { cn } from "@/lib/utils"

const CATEGORY_ORDER: Category[] = ["wall", "column", "slab", "window", "door", "roof"]

type Props = {
  selectedId: string | null
  hoveredId: string | null
  names: Record<string, string>
  hiddenLevels: Set<string>
  hiddenCategories: Set<Category>
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  toggleLevel: (id: string) => void
  toggleCategory: (c: Category) => void
}

export function ModelTree(props: Props) {
  const grouped = useMemo(() => {
    const byLevel = new Map<string, Map<Category, Element[]>>()
    for (const el of ELEMENTS) {
      if (!byLevel.has(el.level)) byLevel.set(el.level, new Map())
      const cats = byLevel.get(el.level)!
      if (!cats.has(el.category)) cats.set(el.category, [])
      cats.get(el.category)!.push(el)
    }
    return byLevel
  }, [])

  const [open, setOpen] = useState<Set<string>>(() => new Set(["L00"]))
  const toggleOpen = (key: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })

  // selecting in the viewport reveals the element in the tree
  const rowRefs = useRef(new Map<string, HTMLButtonElement>())
  useEffect(() => {
    if (!props.selectedId) return
    const el = ELEMENT_BY_ID.get(props.selectedId)
    if (!el) return
    setOpen((s) => new Set([...s, el.level, `${el.level}:${el.category}`]))
    requestAnimationFrame(() => rowRefs.current.get(el.id)?.scrollIntoView({ block: "nearest" }))
  }, [props.selectedId])

  return (
    <Tabs defaultValue="tree" className="flex h-full min-h-0 flex-col gap-0">
      <div className="border-b px-3 py-2.5">
        <TabsList className="w-full">
          <TabsTrigger value="tree">Model</TabsTrigger>
          <TabsTrigger value="filters">Visibility</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tree" className="min-h-0 overflow-y-auto py-1.5">
        <ul role="tree" aria-label="Model structure" className="text-sm">
          {LEVELS.map((level) => {
            const cats = grouped.get(level.id)
            if (!cats) return null
            const levelHidden = props.hiddenLevels.has(level.id)
            const isOpen = open.has(level.id)
            return (
              <li key={level.id} role="treeitem" aria-expanded={isOpen}>
                <div className={cn("group flex items-center pr-2", levelHidden && "text-muted-foreground")}>
                  <button
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-1.5 pl-2 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={() => toggleOpen(level.id)}
                  >
                    <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                    <IconLevel className="text-muted-foreground" />
                    <span className="truncate font-medium">{level.name}</span>
                    <span className="ml-auto pr-1 text-xs text-muted-foreground tabular-nums">
                      +{level.elevation.toFixed(2)}
                    </span>
                  </button>
                  <VisibilityButton hidden={levelHidden} label={level.name} onClick={() => props.toggleLevel(level.id)} />
                </div>

                {isOpen && (
                  <ul role="group">
                    {CATEGORY_ORDER.filter((c) => cats.has(c)).map((cat) => {
                      const items = cats.get(cat)!
                      const key = `${level.id}:${cat}`
                      const catOpen = open.has(key)
                      const Icon = CATEGORY_ICON[cat]
                      const catHidden = props.hiddenCategories.has(cat)
                      return (
                        <li key={key} role="treeitem" aria-expanded={catOpen}>
                          <button
                            className={cn(
                              "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-3 pl-6 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50",
                              (levelHidden || catHidden) && "text-muted-foreground"
                            )}
                            onClick={() => toggleOpen(key)}
                          >
                            <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", catOpen && "rotate-90")} />
                            <Icon className="text-muted-foreground" />
                            <span className="truncate">{CATEGORY_LABEL[cat]}</span>
                            <span className="ml-auto text-xs text-muted-foreground tabular-nums">{items.length}</span>
                          </button>
                          {catOpen && (
                            <ul role="group">
                              {items.map((el) => {
                                const selected = el.id === props.selectedId
                                return (
                                  <li key={el.id} role="treeitem" aria-selected={selected}>
                                    <button
                                      ref={(n) => {
                                        if (n) rowRefs.current.set(el.id, n)
                                        else rowRefs.current.delete(el.id)
                                      }}
                                      className={cn(
                                        "relative flex w-full items-center rounded-md py-1 pr-3 pl-[3.25rem] text-left text-[13px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50",
                                        selected && "bg-selection/15 font-medium hover:bg-selection/20",
                                        el.id === props.hoveredId && !selected && "bg-accent"
                                      )}
                                      onClick={() => props.onSelect(el.id)}
                                      onMouseEnter={() => props.onHover(el.id)}
                                      onMouseLeave={() => props.onHover(null)}
                                    >
                                      {selected && <span className="absolute inset-y-1 left-[2.6rem] w-0.5 rounded-full bg-selection" />}
                                      <span className="truncate">{props.names[el.id] ?? el.name}</span>
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </TabsContent>

      <TabsContent value="filters" className="min-h-0 overflow-y-auto px-3 py-3">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">Categories</h3>
        <ul className="space-y-0.5">
          {CATEGORY_ORDER.map((cat) => {
            const Icon = CATEGORY_ICON[cat]
            const count = ELEMENTS.filter((e) => e.category === cat).length
            const id = `vis-${cat}`
            return (
              <li key={cat} className="flex items-center gap-2.5 rounded-md py-1.5">
                <span className="size-2.5 shrink-0 rounded-sm border" style={{ background: `var(--cat-${cat})` }} />
                <Icon className="text-muted-foreground" />
                <label htmlFor={id} className="flex-1 text-sm">
                  {CATEGORY_LABEL[cat]}
                </label>
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                <Switch id={id} checked={!props.hiddenCategories.has(cat)} onCheckedChange={() => props.toggleCategory(cat)} />
              </li>
            )
          })}
        </ul>
        <h3 className="mt-5 mb-2 text-xs font-medium text-muted-foreground">Levels</h3>
        <ul className="space-y-0.5">
          {LEVELS.map((l) => {
            const id = `vis-${l.id}`
            return (
              <li key={l.id} className="flex items-center gap-2.5 py-1.5">
                <IconLevel className="text-muted-foreground" />
                <label htmlFor={id} className="flex-1 text-sm">
                  {l.name}
                </label>
                <Switch id={id} checked={!props.hiddenLevels.has(l.id)} onCheckedChange={() => props.toggleLevel(l.id)} />
              </li>
            )
          })}
        </ul>
      </TabsContent>
    </Tabs>
  )
}

function VisibilityButton({ hidden, label, onClick }: { hidden: boolean; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
      aria-pressed={hidden}
      onClick={onClick}
      className={cn(
        "ml-0.5 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
        !hidden && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      )}
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}
