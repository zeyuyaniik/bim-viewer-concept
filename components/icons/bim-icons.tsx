import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * BIM icon set, axonometric direction.
 * Elements are drawn as small volumes in a 2:1 isometric projection, the way
 * they appear in a 3D modelling tool, rather than as abstract glyphs.
 * Grid: 24 × 24, 1.25 stroke, round caps and joins. Hidden edges are dashed.
 * Lucide icons use the same stroke (see index.css) so both sets read as one.
 */
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 16, className, children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("bim-icon shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  )
}

const HIDDEN = "1.5 2"

export const IconWall = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8.5L13 13V21L4 16.5Z" />
    <path d="M4 8.5L6.5 7.25L15.5 11.75L13 13M15.5 11.75V19.75L13 21" />
  </Base>
)

export const IconSlab = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5L21 9.5L12 14L3 9.5Z" />
    <path d="M3 9.5V12L12 16.5L21 12V9.5M12 14V16.5" />
  </Base>
)

export const IconColumn = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3L15 4.5L12 6L9 4.5Z" />
    <path d="M9 4.5V18.5L12 20L15 18.5V4.5M12 6V20" />
  </Base>
)

/** wall panel with a glazed opening and a centre mullion */
export const IconWindow = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8.5L13 13V21L4 16.5Z" />
    <path d="M4 8.5L6.5 7.25L15.5 11.75L13 13M15.5 11.75V19.75L13 21" />
    <path d="M6.25 11.63L10.75 13.88V17.38L6.25 15.13Z" />
    <path d="M8.5 12.75V16.25" />
  </Base>
)

/** wall panel with an opening that runs to the floor */
export const IconDoor = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8.5L13 13V21L4 16.5Z" />
    <path d="M4 8.5L6.5 7.25L15.5 11.75L13 13M15.5 11.75V19.75L13 21" />
    <path d="M6.7 17.85V12.35L10.3 14.15V19.65" />
  </Base>
)

export const IconRoof = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 14L12 18.5L21 14L16.5 10.25L7.5 5.75Z" />
    <path d="M12 18.5L16.5 10.25" />
    <path d="M3 14V17L12 21.5L21 17V14M12 18.5V21.5" />
  </Base>
)

/** two floor plates, one storey apart */
export const IconLevel = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5L19 7L12 10.5L5 7Z" />
    <path d="M12 13.5L19 17L12 20.5L5 17Z" />
  </Base>
)

/** a cutting plane through a volume; everything above it is hidden */
export const IconSectionCut = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 7.5L21 12L12 16.5L3 12Z" />
    <path d="M3 12V16.5L12 21L21 16.5V12M12 16.5V21" />
    <path d="M5.5 10.75V6.5L12 3.25L18.5 6.5V10.75" strokeDasharray={HIDDEN} />
  </Base>
)

/** a cube with its hidden edges shown */
export const IconXray = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3L20 7L12 11L4 7Z" />
    <path d="M4 7V16L12 20L20 16V7M12 11V20" />
    <path d="M12 3V12M12 12L4 16M12 12L20 16" strokeDasharray={HIDDEN} />
  </Base>
)

export const IconFitView = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8.5V5a1 1 0 0 1 1-1h3.5M15.5 4H19a1 1 0 0 1 1 1v3.5M20 15.5V19a1 1 0 0 1-1 1h-3.5M8.5 20H5a1 1 0 0 1-1-1v-3.5" />
    <path d="M12 8.5l3.5 1.75v3.5L12 15.5l-3.5-1.75v-3.5z" />
    <path d="M8.5 10.25L12 12l3.5-1.75M12 12v3.5" />
  </Base>
)

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path d="M8 23V12l8-4 8 4v11" fill="none" stroke="var(--selection-3d)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 17.5h16M16 8v15" fill="none" className="stroke-primary-foreground" strokeWidth="1.5" opacity=".7" />
    </svg>
  )
}

export const CATEGORY_ICON = {
  wall: IconWall,
  slab: IconSlab,
  column: IconColumn,
  window: IconWindow,
  door: IconDoor,
  roof: IconRoof,
} as const
