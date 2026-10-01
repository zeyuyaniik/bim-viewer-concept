/**
 * A small, procedurally generated three-storey office block.
 * Every element carries IFC-style identity and property sets so the
 * property panel has something real to show, the same way a model
 * exported from Revit or ArchiCAD would.
 */

export type Category = "wall" | "slab" | "column" | "window" | "door" | "roof"

export type IfcClass = "IfcWall" | "IfcSlab" | "IfcColumn" | "IfcWindow" | "IfcDoor" | "IfcRoof"

export type Box = { pos: [number, number, number]; size: [number, number, number] }

export type PropValue = string | number | boolean

export type PropertySet = { name: string; props: Record<string, PropValue> }

export type Element = {
  id: string
  name: string
  ifcClass: IfcClass
  category: Category
  level: string
  boxes: Box[]
  psets: PropertySet[]
  /** bounding-box centre; the element's pivot for moving */
  center: [number, number, number]
}

export type Level = { id: string; name: string; elevation: number }

export const CATEGORY_LABEL: Record<Category, string> = {
  wall: "Walls",
  slab: "Floors",
  column: "Columns",
  window: "Windows",
  door: "Doors",
  roof: "Roof",
}

const STOREY = 3.2
const SLAB_T = 0.25
const WALL_T = 0.25
const LEN_X = 16
const LEN_Z = 10
const COLUMN = 0.4

export const LEVELS: Level[] = [
  { id: "L00", name: "Ground floor", elevation: 0 },
  { id: "L01", name: "Level 1", elevation: STOREY },
  { id: "L02", name: "Level 2", elevation: STOREY * 2 },
  { id: "RF", name: "Roof", elevation: STOREY * 3 },
]

export const MODEL_HEIGHT = STOREY * 3 + 0.3

// deterministic IFC-like GlobalId (22 chars, base64-ish alphabet)
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$"
function globalId(seed: string) {
  let h = 2166136261
  let out = ""
  for (let i = 0; i < 22; i++) {
    for (const c of seed + i) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
    out += ALPHABET[Math.abs(h) % 64]
  }
  return out
}

const r = (n: number) => Math.round(n * 100) / 100

type Opening = { center: number; width: number; sill: number; height: number; kind: "window" | "door" }
type Side = "north" | "south" | "east" | "west"

const SIDES: Record<Side, { axis: "x" | "z"; at: number; length: number; label: string }> = {
  south: { axis: "x", at: LEN_Z / 2, length: LEN_X, label: "south" },
  north: { axis: "x", at: -LEN_Z / 2, length: LEN_X, label: "north" },
  east: { axis: "z", at: LEN_X / 2, length: LEN_Z, label: "east" },
  west: { axis: "z", at: -LEN_X / 2, length: LEN_Z, label: "west" },
}

function openingsFor(side: Side, levelIndex: number): Opening[] {
  const win = (center: number, width = 1.8): Opening => ({ center, width, sill: 0.9, height: 1.6, kind: "window" })
  if (SIDES[side].axis === "z") return [win(-2.5, 1.6), win(2.5, 1.6)]
  if (side === "south" && levelIndex === 0) {
    return [win(-5.5, 1.6), win(-2.6, 1.6), { center: 0, width: 1.6, sill: 0, height: 2.4, kind: "door" }, win(2.6, 1.6), win(5.5, 1.6)]
  }
  return [win(-5.5), win(-1.8), win(1.8), win(5.5)]
}

/** place a span along a wall's run axis into world-space box coords */
function placeOnSide(side: Side, from: number, to: number, y0: number, y1: number, thickness: number): Box {
  const s = SIDES[side]
  const mid = (from + to) / 2
  const len = to - from
  const yc = (y0 + y1) / 2
  const h = y1 - y0
  return s.axis === "x"
    ? { pos: [mid, yc, s.at], size: [len, h, thickness] }
    : { pos: [s.at, yc, mid], size: [thickness, h, len] }
}

function buildModel() {
  const elements: Omit<Element, "center">[] = []

  for (let li = 0; li < 3; li++) {
    const level = LEVELS[li]
    const base = level.elevation
    const floorTop = base + SLAB_T
    const ceiling = base + STOREY
    const wallH = ceiling - floorTop

    // floor slab
    const slabId = `SL-${level.id}`
    elements.push({
      id: slabId,
      name: li === 0 ? "Ground bearing slab" : `Floor slab, ${level.name.toLowerCase()}`,
      ifcClass: "IfcSlab",
      category: "slab",
      level: level.id,
      boxes: [{ pos: [0, base + SLAB_T / 2, 0], size: [LEN_X + 0.2, SLAB_T, LEN_Z + 0.2] }],
      psets: [
        { name: "Identity", props: { "IFC class": "IfcSlab", "Predefined type": li === 0 ? "BASESLAB" : "FLOOR", GlobalId: globalId(slabId) } },
        {
          name: "Dimensions",
          props: { Thickness: `${SLAB_T * 1000} mm`, Area: `${r((LEN_X + 0.2) * (LEN_Z + 0.2))} m²`, Volume: `${r((LEN_X + 0.2) * (LEN_Z + 0.2) * SLAB_T)} m³` },
        },
        { name: "Material and performance", props: { Material: "Reinforced concrete C30/37", "Fire rating": "REI 90", "Load bearing": true, External: false } },
      ],
    })

    // columns on a 3 x 2 bay grid, inset from the facade
    const xs = [-LEN_X / 2 + 0.6, -LEN_X / 6, LEN_X / 6, LEN_X / 2 - 0.6]
    const zs = [-LEN_Z / 2 + 0.6, LEN_Z / 2 - 0.6]
    const gridX = ["A", "B", "C", "D"]
    xs.forEach((x, xi) =>
      zs.forEach((z, zi) => {
        const id = `CO-${level.id}-${gridX[xi]}${zi + 1}`
        elements.push({
          id,
          name: `Column ${gridX[xi]}${zi + 1}`,
          ifcClass: "IfcColumn",
          category: "column",
          level: level.id,
          boxes: [{ pos: [x, floorTop + wallH / 2, z], size: [COLUMN, wallH, COLUMN] }],
          psets: [
            { name: "Identity", props: { "IFC class": "IfcColumn", "Grid position": `${gridX[xi]}/${zi + 1}`, GlobalId: globalId(id) } },
            { name: "Dimensions", props: { Section: "400 × 400 mm", Height: `${r(wallH)} m`, Volume: `${r(COLUMN * COLUMN * wallH)} m³` } },
            { name: "Material and performance", props: { Material: "Reinforced concrete C40/50", "Fire rating": "R 120", "Load bearing": true, External: false } },
          ],
        })
      })
    )

    // facade walls with openings; windows and doors as their own elements
    ;(Object.keys(SIDES) as Side[]).forEach((side) => {
      const s = SIDES[side]
      const half = s.length / 2
      const openings = openingsFor(side, li).sort((a, b) => a.center - b.center)
      const boxes: Box[] = []
      let cursor = -half
      let openingArea = 0
      let windowNo = 0

      openings.forEach((o) => {
        const start = o.center - o.width / 2
        const end = o.center + o.width / 2
        if (start > cursor) boxes.push(placeOnSide(side, cursor, start, floorTop, ceiling, WALL_T))
        if (o.sill > 0) boxes.push(placeOnSide(side, start, end, floorTop, floorTop + o.sill, WALL_T))
        boxes.push(placeOnSide(side, start, end, floorTop + o.sill + o.height, ceiling, WALL_T))
        cursor = end
        openingArea += o.width * o.height

        const isDoor = o.kind === "door"
        const tag = isDoor ? `${side[0].toUpperCase()}1` : `${side[0].toUpperCase()}${++windowNo}`
        const oid = `${isDoor ? "DR" : "WN"}-${level.id}-${tag}`
        elements.push({
          id: oid,
          name: isDoor ? "Main entrance door" : `Window ${tag}`,
          ifcClass: isDoor ? "IfcDoor" : "IfcWindow",
          category: isDoor ? "door" : "window",
          level: level.id,
          boxes: [placeOnSide(side, start, end, floorTop + o.sill, floorTop + o.sill + o.height, 0.08)],
          psets: [
            { name: "Identity", props: { "IFC class": isDoor ? "IfcDoor" : "IfcWindow", "Host wall": `WA-${level.id}-${side}`, GlobalId: globalId(oid) } },
            {
              name: "Dimensions",
              props: { Width: `${o.width * 1000} mm`, Height: `${o.height * 1000} mm`, "Sill height": `${o.sill * 1000} mm` },
            },
            {
              name: "Material and performance",
              props: isDoor
                ? { Material: "Aluminium frame, laminated glass", "Fire rating": "E 30", "U-value": "1.4 W/m²K", External: true }
                : { Material: "Aluminium frame, triple glazing", "U-value": "0.8 W/m²K", "Solar factor (g)": 0.42, External: true },
            },
          ],
        })
      })
      if (cursor < half) boxes.push(placeOnSide(side, cursor, half, floorTop, ceiling, WALL_T))

      const wid = `WA-${level.id}-${side}`
      const gross = s.length * wallH
      elements.push({
        id: wid,
        name: `Exterior wall, ${s.label}`,
        ifcClass: "IfcWall",
        category: "wall",
        level: level.id,
        boxes,
        psets: [
          { name: "Identity", props: { "IFC class": "IfcWall", "Predefined type": "SOLIDWALL", GlobalId: globalId(wid) } },
          {
            name: "Dimensions",
            props: {
              Length: `${s.length} m`,
              Height: `${r(wallH)} m`,
              Thickness: `${WALL_T * 1000} mm`,
              "Net area": `${r(gross - openingArea)} m²`,
              Volume: `${r((gross - openingArea) * WALL_T)} m³`,
            },
          },
          {
            name: "Material and performance",
            props: { Material: "Clay block, mineral wool, render", "U-value": "0.22 W/m²K", "Fire rating": "EI 60", "Load bearing": false, External: true },
          },
        ],
      })
    })
  }

  // roof
  const roofTop = STOREY * 3
  elements.push({
    id: "RF-01",
    name: "Flat roof",
    ifcClass: "IfcRoof",
    category: "roof",
    level: "RF",
    boxes: [
      { pos: [0, roofTop + 0.15, 0], size: [LEN_X + 0.6, 0.3, LEN_Z + 0.6] },
      // parapet
      { pos: [0, roofTop + 0.6, LEN_Z / 2 + 0.2], size: [LEN_X + 0.6, 0.6, 0.2] },
      { pos: [0, roofTop + 0.6, -LEN_Z / 2 - 0.2], size: [LEN_X + 0.6, 0.6, 0.2] },
      { pos: [LEN_X / 2 + 0.2, roofTop + 0.6, 0], size: [0.2, 0.6, LEN_Z + 0.2] },
      { pos: [-LEN_X / 2 - 0.2, roofTop + 0.6, 0], size: [0.2, 0.6, LEN_Z + 0.2] },
    ],
    psets: [
      { name: "Identity", props: { "IFC class": "IfcRoof", "Predefined type": "FLAT_ROOF", GlobalId: globalId("RF-01") } },
      { name: "Dimensions", props: { Area: `${r((LEN_X + 0.6) * (LEN_Z + 0.6))} m²`, "Parapet height": "600 mm", Slope: "1.5°" } },
      { name: "Material and performance", props: { Material: "Concrete deck, PIR insulation, EPDM", "U-value": "0.15 W/m²K", External: true } },
    ],
  })

  return elements
}

function withCenter(el: Omit<Element, "center"> & { center?: Element["center"] }): Element {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const b of el.boxes)
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], b.pos[i] - b.size[i] / 2)
      max[i] = Math.max(max[i], b.pos[i] + b.size[i] / 2)
    }
  return { ...el, center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] }
}

export const ELEMENTS: Element[] = buildModel().map(withCenter)
export const ELEMENT_BY_ID = new Map(ELEMENTS.map((e) => [e.id, e]))
