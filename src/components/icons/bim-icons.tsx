import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * BIM icon set — drawn for this project.
 * Grid: 24 × 24, 2 px live-area padding, 1.5 stroke, round caps and joins.
 * Geometry is kept on whole and half pixels so it stays crisp at 16 and 20 px,
 * and matches Lucide's metrics so the two sets can sit side by side.
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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconWall = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="1" />
    <path d="M3 9.67h18M3 14.33h18M9 5v4.67M15 5v4.67M6 9.67v4.66M12 9.67v4.66M18 9.67v4.66M9 14.33V19M15 14.33V19" />
  </Base>
)

export const IconSlab = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 6l9 4.5-9 4.5-9-4.5z" />
    <path d="M3 10.5V13l9 4.5 9-4.5v-2.5" />
  </Base>
)

export const IconColumn = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 4h11M6.5 20h11" />
    <rect x="9" y="4" width="6" height="16" />
  </Base>
)

export const IconWindow = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="3.5" width="16" height="15" rx="1" />
    <path d="M12 3.5v15M4 10h16M2.5 20.5h19" />
  </Base>
)

export const IconDoor = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 20.5V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16.5M3 20.5h18" />
    <path d="M14.5 12v.01" strokeWidth={2.25} />
  </Base>
)

export const IconRoof = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 12L12 5l9.5 7" />
    <path d="M5.5 10v9.5h13V10" />
  </Base>
)

/** elevation marker, the triangle used on sections to tag a level */
export const IconLevel = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 6.5h4l-2 3z" />
    <path d="M9 6.5h12" />
    <path d="M3 15h4l-2 3z" />
    <path d="M9 15h12" />
  </Base>
)

/** horizontal cutting plane through a volume */
export const IconSectionCut = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 11V5h10v6" />
    <path d="M2.5 15l4.5-4h14.5L17 15z" />
    <path d="M7 15v4h10v-4" strokeDasharray="1.5 2" />
  </Base>
)

/** box with its hidden edges drawn dashed */
export const IconXray = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="8" width="12" height="12" rx="0.5" />
    <path d="M3.5 8L8.5 3.5h12V15.5L15.5 20M15.5 8l5-4.5" />
    <path d="M8.5 3.5V15.5H20.5M8.5 15.5L3.5 20" strokeDasharray="1.5 2" />
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
