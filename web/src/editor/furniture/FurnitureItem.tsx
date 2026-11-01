import type { CatalogItem, Placement, Room } from "@roomcraft/shared";
import { Edges } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { memo, useMemo, useRef, type ReactNode } from "react";
import { Plane, Vector3, type Group } from "three";
import { isWallCutAway, wallFacing } from "../cutaway";
import { useEditor, useEditorStore } from "../state/useEditor";
import { MODELS } from "./models";

const FLOOR = new Plane(new Vector3(0, 1, 0), 0);
const SELECTED = "#0f766e";
const INVALID = "#dc2626";

interface FurnitureItemProps {
  placement: Placement;
  item: CatalogItem;
  room: Room;
}

/**
 * One piece of furniture. It subscribes only to its own drag state, so dragging
 * re-renders this item and nothing else in the scene.
 */
export const FurnitureItem = memo(function FurnitureItem({
  placement,
  item,
  room,
}: FurnitureItemProps) {
  const store = useEditorStore();
  const drag = useEditor((state) => (state.drag?.id === placement.id ? state.drag : null));
  const selected = useEditor((state) => state.selectedId === placement.id);
  const controls = useThree((state) => state.controls);
  const grab = useRef<{ dx: number; dz: number } | null>(null);
  const hit = useMemo(() => new Vector3(), []);

  const shown = drag ?? placement;
  const y = item.layer === "ceiling" ? room.height - item.height : (item.elevation ?? 0);
  const Model = MODELS[item.model];

  // Pointer position on the floor, in room coordinates (the room group is centred on the origin).
  const floorPoint = (event: ThreeEvent<PointerEvent>) => {
    event.ray.intersectPlane(FLOOR, hit);
    return { x: hit.x + room.width / 2, z: hit.z + room.depth / 2 };
  };

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    store.getState().select(placement.id);
    const point = floorPoint(event);
    grab.current = { dx: placement.x - point.x, dz: placement.z - point.z };
    if (canCapture(event.target)) event.target.setPointerCapture(event.pointerId);
    setControlsEnabled(controls, false);
  };

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!grab.current) return;
    event.stopPropagation();
    const point = floorPoint(event);
    store.getState().dragTo(placement.id, point.x + grab.current.dx, point.z + grab.current.dz);
  };

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!grab.current) return;
    event.stopPropagation();
    grab.current = null;
    if (canCapture(event.target)) event.target.releasePointerCapture(event.pointerId);
    setControlsEnabled(controls, true);
    store.getState().endDrag();
  };

  return (
    <group
      position={[shown.x, y, shown.z]}
      rotation-y={(shown.rotation * Math.PI) / 180}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <HiddenWithWall room={room} rotation={item.layer === "wall" ? shown.rotation : null}>
        <Model
          width={item.width}
          depth={item.depth}
          height={item.height}
          color={placement.color ?? item.color}
        />
      </HiddenWithWall>
      {(selected || drag) && <SelectionBox item={item} invalid={drag?.problem != null} />}
    </group>
  );
});

/** Wall pieces disappear with their wall in the dollhouse view; others always show. */
function HiddenWithWall(props: { room: Room; rotation: number | null; children: ReactNode }) {
  const { room, rotation, children } = props;
  const group = useRef<Group>(null);
  useFrame(({ camera }) => {
    if (group.current && rotation !== null) {
      group.current.visible = !isWallCutAway(room, wallFacing(rotation), camera.position);
    }
  });
  return <group ref={group}>{children}</group>;
}

function SelectionBox({ item, invalid }: { item: CatalogItem; invalid: boolean }) {
  const color = invalid ? INVALID : SELECTED;
  const pad = 0.03;
  return (
    <group>
      <mesh position={[0, item.height / 2, 0]} raycast={() => null}>
        <boxGeometry args={[item.width + pad, item.height + pad, item.depth + pad]} />
        <meshBasicMaterial visible={false} />
        <Edges color={color} />
      </mesh>
      {item.layer === "floor" && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]} raycast={() => null}>
          <planeGeometry args={[item.width, item.depth]} />
          <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

interface PointerCaptureTarget {
  setPointerCapture: (pointerId: number) => void;
  releasePointerCapture: (pointerId: number) => void;
}

/** R3F replaces the event target with one that captures the pointer for this 3D object. */
function canCapture(target: unknown): target is PointerCaptureTarget {
  return typeof target === "object" && target !== null && "setPointerCapture" in target;
}

/** OrbitControls would turn the camera while an item is dragged, so they pause meanwhile. */
function setControlsEnabled(controls: unknown, enabled: boolean) {
  if (controls && typeof controls === "object" && "enabled" in controls) {
    controls.enabled = enabled;
  }
}
