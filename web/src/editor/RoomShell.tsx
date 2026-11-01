import type { Opening, Room, Wall } from "@roomcraft/shared";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { WALLS } from "../domain/room";
import { STYLE_PALETTES } from "../domain/styles";
import { isWallCutAway } from "./cutaway";
import {
  pointOnWall,
  WALL_THICKNESS,
  wallBoxes,
  wallFrame,
  windowPanes,
  type Box,
} from "../domain/walls";

const DOOR_OPEN_ANGLE = (75 * Math.PI) / 180;
const DOOR_THICKNESS = 0.04;

/**
 * Floor, walls with their openings, window glass and open doors, in room
 * coordinates. The parent group centres the room on the world origin.
 */
export function RoomShell({ room }: { room: Room }) {
  const palette = STYLE_PALETTES[room.style];
  const boxes = useMemo(() => wallBoxes(room, WALL_THICKNESS), [room]);
  const panes = useMemo(() => windowPanes(room, WALL_THICKNESS), [room]);
  const wallGroups = useRef<Partial<Record<Wall, Group | null>>>({});

  useFrame(({ camera }) => {
    for (const wall of WALLS) {
      const group = wallGroups.current[wall];
      if (group) group.visible = !isWallCutAway(room, wall, camera.position);
    }
  });

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[room.width / 2, 0, room.depth / 2]} receiveShadow>
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color={palette.floor} roughness={0.8} />
      </mesh>

      {WALLS.map((wall) => (
        <group
          key={wall}
          ref={(group) => {
            wallGroups.current[wall] = group;
          }}
        >
          {boxes
            .filter((box) => box.wall === wall)
            .map((box) => (
              <BoxMesh key={box.center.join()} box={box} castShadow>
                <meshStandardMaterial color={palette.wall} roughness={0.95} />
              </BoxMesh>
            ))}
          {panes
            .filter((pane) => pane.wall === wall)
            .map((pane) => (
              <BoxMesh key={pane.center.join()} box={pane}>
                <meshPhysicalMaterial color="#dbeafe" transparent opacity={0.25} roughness={0.05} />
              </BoxMesh>
            ))}
          {room.openings
            .filter((opening) => opening.kind === "door" && opening.wall === wall)
            .map((door) => (
              <DoorLeaf key={door.id} room={room} door={door} color={palette.trim} />
            ))}
        </group>
      ))}
    </group>
  );
}

function BoxMesh({
  box,
  castShadow = false,
  children,
}: {
  box: Box;
  castShadow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <mesh position={box.center} castShadow={castShadow} receiveShadow>
      <boxGeometry args={box.size} />
      {children}
    </mesh>
  );
}

/** The door leaf, hinged at the opening's start and swung into the room. */
function DoorLeaf({ room, door, color }: { room: Room; door: Opening; color: string }) {
  const frame = wallFrame(room, door.wall);
  const direction: [number, number] = [
    frame.along[0] * Math.cos(DOOR_OPEN_ANGLE) + frame.inward[0] * Math.sin(DOOR_OPEN_ANGLE),
    frame.along[1] * Math.cos(DOOR_OPEN_ANGLE) + frame.inward[1] * Math.sin(DOOR_OPEN_ANGLE),
  ];
  const [hingeX, hingeZ] = pointOnWall(frame, door.offset);
  const half = door.width / 2;

  return (
    <mesh
      position={[hingeX + direction[0] * half, door.height / 2, hingeZ + direction[1] * half]}
      rotation-y={Math.atan2(-direction[1], direction[0])}
      castShadow
    >
      <boxGeometry args={[door.width, door.height, DOOR_THICKNESS]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}
