import type * as React from "react"
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { Canvas, type ThreeEvent } from "@react-three/fiber"
import { CameraControls, CameraControlsImpl, GizmoHelper, GizmoViewport, Grid, TransformControls } from "@react-three/drei"
import { MODEL_HEIGHT, type Box, type Category, type Element } from "@/data/model"
import type { SceneColors } from "@/hooks/use-css-colors"
import type { DisplayMode, Tool, Vec3, ViewPreset, ViewportHandle } from "@/types"

const { ACTION } = CameraControlsImpl
const CENTER = new THREE.Vector3(0, MODEL_HEIGHT / 2, 0)

const VIEWS: Record<ViewPreset, Vec3> = {
  iso: [21, 15, 23],
  top: [0, 42, 0.01],
  front: [0, MODEL_HEIGHT / 2, 34],
  side: [38, MODEL_HEIGHT / 2, 0],
}

type ViewportProps = {
  elements: Element[]
  colors: SceneColors
  selectedId: string | null
  hoveredId: string | null
  tool: Tool
  displayMode: DisplayMode
  cutHeight: number | null
  offsets: Record<string, Vec3>
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onOffsetChange: (id: string, offset: Vec3) => void
}

export const Viewport = forwardRef<ViewportHandle, ViewportProps>(function Viewport(props, ref) {
  const controls = useRef<CameraControlsImpl>(null)
  const registry = useRef(new Map<string, THREE.Group>())
  const downAt = useRef<[number, number]>([0, 0])

  useImperativeHandle(ref, () => ({
    setView(preset) {
      const [x, y, z] = VIEWS[preset]
      controls.current?.setLookAt(x, y, z, CENTER.x, CENTER.y, CENTER.z, true)
    },
    fit(target = "all") {
      const c = controls.current
      if (!c) return
      const box = new THREE.Box3()
      if (target === "selection" && props.selectedId) {
        const g = registry.current.get(props.selectedId)
        if (g) box.setFromObject(g)
      }
      if (box.isEmpty()) registry.current.forEach((g) => box.expandByObject(g))
      // fitToSphere keeps the current viewing angle; fitToBox would snap to a face
      if (!box.isEmpty()) c.fitToSphere(box.getBoundingSphere(new THREE.Sphere()), true)
    },
  }))

  // the pan tool hands the left mouse button to panning; every other tool orbits
  useEffect(() => {
    const c = controls.current
    if (!c) return
    c.mouseButtons.left = props.tool === "pan" ? ACTION.TRUCK : ACTION.ROTATE
    c.touches.one = props.tool === "pan" ? ACTION.TOUCH_TRUCK : ACTION.TOUCH_ROTATE
  }, [props.tool])

  const clipPlanes = useMemo(
    () => (props.cutHeight == null ? [] : [new THREE.Plane(new THREE.Vector3(0, -1, 0), props.cutHeight)]),
    [props.cutHeight]
  )

  const selectedObject = props.selectedId ? registry.current.get(props.selectedId) : undefined

  return (
    <div
      className="absolute inset-0"
      onPointerDown={(e) => (downAt.current = [e.clientX, e.clientY])}
    >
      <Canvas
        camera={{ position: VIEWS.iso, fov: 40, near: 0.1, far: 500 }}
        gl={{ localClippingEnabled: true, antialias: true }}
        dpr={[1, 2]}
        onPointerMissed={(e) => {
          const [x, y] = downAt.current
          if (Math.hypot(e.clientX - x, e.clientY - y) < 5) props.onSelect(null)
        }}
        aria-label="3D model viewport"
      >
        <color attach="background" args={[props.colors.viewport]} />
        <hemisphereLight args={["#ffffff", "#8a8f96", 1.4]} />
        <directionalLight position={[18, 30, 14]} intensity={1.6} />
        <directionalLight position={[-20, 12, -16]} intensity={0.5} />

        <Grid
          position={[0, -0.005, 0]}
          infiniteGrid
          cellSize={1}
          sectionSize={5}
          cellThickness={0.6}
          sectionThickness={1}
          cellColor={props.colors["viewport-grid"]}
          sectionColor={props.colors["viewport-grid-strong"]}
          fadeDistance={90}
          fadeStrength={1.5}
        />

        {props.elements.map((el) => (
          <ElementMesh
            key={el.id}
            element={el}
            offset={props.offsets[el.id]}
            colors={props.colors}
            selected={el.id === props.selectedId}
            hovered={el.id === props.hoveredId}
            dimmed={props.displayMode === "xray" && el.id !== props.selectedId}
            clipPlanes={clipPlanes}
            registry={registry.current}
            onSelect={props.onSelect}
            onHover={props.onHover}
          />
        ))}

        {props.cutHeight != null && <SectionPlane height={props.cutHeight} color={props.colors["selection-3d"]} />}

        {props.tool === "move" && selectedObject && (
          <TransformControls
            object={selectedObject}
            mode="translate"
            size={0.8}
            translationSnap={0.1}
            onMouseUp={() => {
              const p = selectedObject.position
              const c = selectedObject.userData.center as Vec3
              const r = (n: number) => Math.round(n * 100) / 100
              props.onOffsetChange(props.selectedId!, [r(p.x - c[0]), r(p.y - c[1]), r(p.z - c[2])])
            }}
          />
        )}

        <CameraControls ref={controls} makeDefault minDistance={3} maxDistance={140} dollyToCursor smoothTime={0.25} />
        <InitialFit controls={controls} registry={registry} />

        <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
          <GizmoViewport
            axisColors={[props.colors["axis-x"], props.colors["axis-y"], props.colors["axis-z"]]}
            labelColor="#ffffff"
            axisHeadScale={0.9}
          />
        </GizmoHelper>
      </Canvas>
    </div>
  )
})

/* ---------------------------------------------------------------- */

const CATEGORY_COLOR_KEY: Record<Category, keyof SceneColors> = {
  wall: "cat-wall",
  slab: "cat-slab",
  column: "cat-column",
  window: "cat-window",
  door: "cat-door",
  roof: "cat-roof",
}

type ElementMeshProps = {
  element: Element
  offset?: Vec3
  colors: SceneColors
  selected: boolean
  hovered: boolean
  dimmed: boolean
  clipPlanes: THREE.Plane[]
  registry: Map<string, THREE.Group>
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const ElementMesh = memo(function ElementMesh({
  element,
  offset,
  colors,
  selected,
  hovered,
  dimmed,
  clipPlanes,
  registry,
  onSelect,
  onHover,
}: ElementMeshProps) {
  const base = colors[CATEGORY_COLOR_KEY[element.category]]
  const color = useMemo(() => {
    if (selected) return new THREE.Color(colors["selection-3d"])
    const c = new THREE.Color(base)
    return hovered ? c.lerp(new THREE.Color(colors["selection-3d"]), 0.35) : c
  }, [base, selected, hovered, colors])

  const isGlass = element.category === "window" || element.category === "door"
  const opacity = dimmed ? 0.12 : isGlass && !selected ? 0.6 : 1
  const edgeColor = selected ? colors["selection-3d"] : colors.foreground
  const edgeOpacity = selected ? 1 : dimmed ? 0.25 : 0.35

  const register = useCallback(
    (g: THREE.Group | null) => {
      if (g) registry.set(element.id, g)
      else registry.delete(element.id)
    },
    [registry, element.id]
  )

  const [cx, cy, cz] = element.center
  const [ox, oy, oz] = offset ?? [0, 0, 0]

  const stop = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.stopPropagation()

  return (
    <group
      ref={register}
      position={[cx + ox, cy + oy, cz + oz]}
      onClick={(e) => {
        stop(e)
        if (e.delta < 5) onSelect(element.id)
      }}
      onPointerOver={(e) => {
        stop(e)
        onHover(element.id)
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = ""
      }}
      userData={{ id: element.id, center: element.center }}
    >
      {element.boxes.map((b, i) => (
        <BoxPart
          key={i}
          box={b}
          origin={element.center}
          color={color}
          opacity={opacity}
          edgeColor={edgeColor}
          edgeOpacity={edgeOpacity}
          clipPlanes={clipPlanes}
          renderOnTop={selected}
        />
      ))}
    </group>
  )
})

function BoxPart({
  box,
  origin,
  color,
  opacity,
  edgeColor,
  edgeOpacity,
  clipPlanes,
  renderOnTop,
}: {
  box: Box
  origin: Vec3
  color: THREE.Color
  opacity: number
  edgeColor: string
  edgeOpacity: number
  clipPlanes: THREE.Plane[]
  renderOnTop: boolean
}) {
  const geometry = useMemo(() => new THREE.BoxGeometry(...box.size), [box.size])
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry])
  useEffect(() => () => (geometry.dispose(), edges.dispose()), [geometry, edges])

  const transparent = opacity < 1
  return (
    <group position={[box.pos[0] - origin[0], box.pos[1] - origin[1], box.pos[2] - origin[2]]}>
      <mesh geometry={geometry} renderOrder={renderOnTop ? 2 : transparent ? 1 : 0}>
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          metalness={0}
          transparent={transparent}
          opacity={opacity}
          depthWrite={!transparent}
          clippingPlanes={clipPlanes}
          clipShadows
          side={clipPlanes.length ? THREE.DoubleSide : THREE.FrontSide}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={edges} raycast={() => null}>
        <lineBasicMaterial color={edgeColor} transparent opacity={edgeOpacity} clippingPlanes={clipPlanes} />
      </lineSegments>
    </group>
  )
}

function SectionPlane({ height, color }: { height: number; color: string }) {
  const outline = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(22, 16)), [])
  return (
    <group position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh raycast={() => null}>
        <planeGeometry args={[22, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={outline} raycast={() => null}>
        <lineBasicMaterial color={color} transparent opacity={0.7} />
      </lineSegments>
    </group>
  )
}

/** frames the whole model once, after every element has mounted */
function InitialFit({
  controls,
  registry,
}: {
  controls: React.RefObject<CameraControlsImpl | null>
  registry: React.RefObject<Map<string, THREE.Group>>
}) {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const c = controls.current
      if (!c) return
      const [x, y, z] = VIEWS.iso
      c.setLookAt(x, y, z, CENTER.x, CENTER.y, CENTER.z, false)
      const box = new THREE.Box3()
      registry.current.forEach((g) => box.expandByObject(g))
      if (!box.isEmpty()) c.fitToSphere(box.getBoundingSphere(new THREE.Sphere()), false)
    })
    return () => cancelAnimationFrame(id)
  }, [controls, registry])
  return null
}
