import type { Opening, Room } from "@roomcraft/shared";
import { formatLength, type Units } from "../domain/units";
import { pointOnWall, WALL_THICKNESS, wallFrame, type Vec2 } from "../domain/walls";

interface RoomPlanProps {
  room: Pick<Room, "width" | "depth" | "openings">;
  units: Units;
  /** Openings drawn in red, for example because they do not fit. */
  invalidOpeningIds?: ReadonlySet<string>;
  className?: string;
}

const T = WALL_THICKNESS;

/** A top-down plan of the room's walls, doors and windows, with its dimensions. */
export function RoomPlan({ room, units, invalidOpeningIds, className }: RoomPlanProps) {
  const { width, depth } = room;
  const valid = Number.isFinite(width) && Number.isFinite(depth) && width > 0 && depth > 0;
  if (!valid) return null;

  const span = Math.max(width, depth);
  const pad = span * 0.16;
  const font = span * 0.045;
  const viewBox = [-pad, -pad, width + 2 * pad, depth + 2 * pad].join(" ");
  const label = `Floor plan, ${formatLength(width, units)} by ${formatLength(depth, units)}`;

  return (
    <svg viewBox={viewBox} role="img" aria-label={label} className={className}>
      <rect x={-T} y={-T} width={width + 2 * T} height={depth + 2 * T} className="fill-stone-700" />
      <rect x={0} y={0} width={width} height={depth} className="fill-stone-50" />
      {room.openings.map((opening) => (
        <PlanOpening
          key={opening.id}
          room={room}
          opening={opening}
          invalid={invalidOpeningIds?.has(opening.id) ?? false}
          stroke={span * 0.006}
        />
      ))}
      <text
        x={width / 2}
        y={-pad * 0.45}
        fontSize={font}
        textAnchor="middle"
        className="fill-stone-600"
      >
        {formatLength(width, units)}
      </text>
      <text
        x={-pad * 0.45}
        y={depth / 2}
        fontSize={font}
        textAnchor="middle"
        transform={`rotate(-90 ${-pad * 0.45} ${depth / 2})`}
        className="fill-stone-600"
      >
        {formatLength(depth, units)}
      </text>
      <text
        x={width + pad * 0.5}
        y={-pad * 0.45}
        fontSize={font}
        textAnchor="middle"
        className="fill-stone-400"
      >
        N ↑
      </text>
    </svg>
  );
}

function PlanOpening({
  room,
  opening,
  invalid,
  stroke,
}: {
  room: RoomPlanProps["room"];
  opening: Opening;
  invalid: boolean;
  stroke: number;
}) {
  const frame = wallFrame(room, opening.wall);
  const start = opening.offset;
  const end = opening.offset + opening.width;
  const color = invalid ? "stroke-red-600" : "stroke-stone-700";
  // The gap through the wall, from its outer face to its inner face.
  const gap = [
    pointOnWall(frame, start, -T),
    pointOnWall(frame, end, -T),
    pointOnWall(frame, end, 0),
    pointOnWall(frame, start, 0),
  ];

  return (
    <g data-opening={opening.id}>
      <polygon points={toPoints(gap)} className={invalid ? "fill-red-100" : "fill-stone-50"} />
      {opening.kind === "window" ? (
        <polyline
          points={toPoints([pointOnWall(frame, start, -T / 2), pointOnWall(frame, end, -T / 2)])}
          strokeWidth={stroke * 1.5}
          className={color}
        />
      ) : (
        <DoorSwing
          hinge={pointOnWall(frame, start)}
          leafEnd={pointOnWall(frame, start, opening.width)}
          closedEnd={pointOnWall(frame, end)}
          radius={opening.width}
          stroke={stroke}
          className={color}
        />
      )}
    </g>
  );
}

/** The door leaf, open into the room, and the arc it sweeps. */
function DoorSwing(props: {
  hinge: Vec2;
  leafEnd: Vec2;
  closedEnd: Vec2;
  radius: number;
  stroke: number;
  className: string;
}) {
  const { hinge, leafEnd, closedEnd, radius, stroke, className } = props;
  // Sweep from the open leaf back to the closed position, on the room side.
  const cross =
    (leafEnd[0] - hinge[0]) * (closedEnd[1] - hinge[1]) -
    (leafEnd[1] - hinge[1]) * (closedEnd[0] - hinge[0]);
  const sweep = cross < 0 ? 0 : 1;
  const arc = `M ${toPoint(leafEnd)} A ${radius} ${radius} 0 0 ${sweep} ${toPoint(closedEnd)}`;

  return (
    <g fill="none" strokeWidth={stroke} className={className}>
      <polyline points={toPoints([hinge, leafEnd])} strokeWidth={stroke * 1.5} />
      <path d={arc} strokeDasharray={`${stroke * 3} ${stroke * 2}`} />
    </g>
  );
}

const toPoint = ([x, z]: Vec2) => `${x} ${z}`;
const toPoints = (points: Vec2[]) => points.map(([x, z]) => `${x},${z}`).join(" ");
