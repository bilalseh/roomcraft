import type { Room } from "@roomcraft/shared";
import { Html, Line } from "@react-three/drei";
import { usePreferences } from "../app/preferences";
import { catalogItem } from "../domain/catalog";
import { halfExtents } from "../domain/placement";
import { formatDimensions, formatLength } from "../domain/units";
import { useEditor } from "./state/useEditor";

const LIFT = 0.03;
const MEASURE = "#0f766e";

/**
 * Plan view labels, in room coordinates: the room's size along its walls, and
 * the selected piece's size and its distance from each wall.
 */
export function PlanMeasurements({ room }: { room: Room }) {
  const units = usePreferences((state) => state.units);
  const placement = useEditor((state) => {
    const id = state.drag?.id ?? state.selectedId;
    return state.history.present.furniture.find((candidate) => candidate.id === id);
  });
  const drag = useEditor((state) => state.drag);
  const item = placement && catalogItem(placement.itemId);

  return (
    <group>
      <Label at={[room.width / 2, LIFT, -0.45]}>{formatLength(room.width, units)}</Label>
      <Label at={[-0.45, LIFT, room.depth / 2]}>{formatLength(room.depth, units)}</Label>
      {placement && item && (
        <ItemGaps
          room={room}
          x={drag?.x ?? placement.x}
          z={drag?.z ?? placement.z}
          {...halfExtents(item.width, item.depth, drag?.rotation ?? placement.rotation)}
          size={formatDimensions(item.width, item.depth, units)}
          format={(metres) => formatLength(metres, units)}
        />
      )}
    </group>
  );
}

function ItemGaps(props: {
  room: Room;
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
  size: string;
  format: (metres: number) => string;
}) {
  const { room, x, z, halfX, halfZ, size, format } = props;
  const gaps: { from: [number, number]; to: [number, number]; length: number }[] = [
    { from: [0, z], to: [x - halfX, z], length: x - halfX },
    { from: [x + halfX, z], to: [room.width, z], length: room.width - x - halfX },
    { from: [x, 0], to: [x, z - halfZ], length: z - halfZ },
    { from: [x, z + halfZ], to: [x, room.depth], length: room.depth - z - halfZ },
  ];
  return (
    <group>
      <Label at={[x, LIFT, z]} strong>
        {size}
      </Label>
      {gaps
        .filter((gap) => gap.length > 0.02)
        .map(({ from, to, length }) => (
          <group key={`${from.join()}-${to.join()}`}>
            <Line
              points={[
                [from[0], LIFT, from[1]],
                [to[0], LIFT, to[1]],
              ]}
              color={MEASURE}
              lineWidth={1.5}
              dashed
              dashSize={0.08}
              gapSize={0.05}
            />
            <Label at={[(from[0] + to[0]) / 2, LIFT, (from[1] + to[1]) / 2]}>
              {format(length)}
            </Label>
          </group>
        ))}
    </group>
  );
}

function Label({
  at,
  strong = false,
  children,
}: {
  at: [number, number, number];
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Html position={at} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
      <span
        className={`rounded px-1.5 py-0.5 text-xs whitespace-nowrap shadow-sm ${
          strong ? "bg-teal-700 font-medium text-white" : "bg-white/90 text-stone-700"
        }`}
      >
        {children}
      </span>
    </Html>
  );
}
