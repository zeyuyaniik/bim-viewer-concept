# Model viewer concept

A small BIM model viewer built to explore how a 3D AEC tool can be designed directly in code: a shadcn/ui design system on one side, a live three.js scene on the other, and one set of tokens shared by both.

Designed and built by Zeynep Uyanık, with Claude as a coding partner.

**Live:** _add your Vercel URL here_

## What it does

- Orbit, pan and zoom a three-storey sample building (77 elements across walls, columns, floors, windows, doors and roof)
- Select elements in the viewport or the model tree; the two stay in sync
- Read IFC-style properties per element (class, GlobalId, dimensions, material, fire rating, U-value)
- Rename elements and move them with a transform gizmo or by typing X/Y/Z offsets
- Section cut with a height slider and one-click cuts per level
- X-ray mode, level and category visibility, camera presets (3D, top, front, side)
- Light and dark mode, responsive down to phone width (panels become drawers)

## Keyboard

| Key | Action |
| --- | --- |
| V | Select |
| G | Move selected element |
| H | Pan |
| F | Zoom to selection, or fit the whole model |
| X | X-ray |
| C | Section cut |
| 1 to 4 | 3D, top, front and side views |
| Esc | Clear selection |

## Design system

- **Base tokens** follow shadcn/ui's contract (`background`, `card`, `primary`, `muted`, `ring`…) so every primitive is theme-aware out of the box. Defined in `src/index.css`.
- **Product tokens** cover what a 3D tool needs and a generic app doesn't: viewport surface, grid, axis colours, selection highlight and IFC category colours.
- **Bridge into 3D:** `useCssColors` reads the same CSS variables into the three.js scene, so the canvas and the 2D chrome switch theme together.
- **Primitives** live in `src/components/ui` (Button, Badge, Tabs, Switch, Slider, Tooltip, Input, Label, Separator). Button has an extra `tool` variant for toolbar tools that can be the active one.
- **Icons:** a BIM icon set drawn on Lucide's grid (24 px, 1.5 stroke, round joins) so it sits next to Lucide's generic icons without a visible seam. See `src/components/icons/bim-icons.tsx`.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui (Radix primitives), three.js with @react-three/fiber and drei.

## Run locally

```bash
npm install
npm run dev
```

## Notes

The scene is Y-up, following three.js. A production BIM viewer would usually present Z-up to match IFC and the authoring tools.
