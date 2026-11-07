import type { FloorMaterial, Materials, Opening, Room, Wall } from "@roomcraft/shared";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, PlaneGeometry, type BufferGeometry, type Group } from "three";
import { WALLS } from "../domain/room";
import { STYLE_PALETTES } from "../domain/styles";
import { trimBoxes } from "../domain/trim";
import { isWallCutAway } from "./cutaway";
import { projectUvs } from "./surfaces/projectUvs";
import { SurfaceMaterial } from "./surfaces/SurfaceMaterial";
import type { SurfaceName } from "./surfaces/surfaces";
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

const FLOORS: Record<FloorMaterial, { surface: SurfaceName; roughness: number }> = {
  wood: { surface: "wood-floor", roughness: 0.9 },
  tile: { surface: "tile-floor", roughness: 0.6 },
  carpet: { surface: "carpet", roughness: 1 },
};

interface RoomShellProps {
  room: Room;
  materials: Materials;
  night: boolean;
  /** Shown when walking around inside; the dollhouse view looks in from above. */
  ceiling: boolean;
}

/**
 * Floor, walls with their openings, skirting and frames, window glass and open
 * doors, in room coordinates. The parent group centres the room on the world origin.
 */
export function RoomShell({ room, materials, night, ceiling }: RoomShellProps) {
  const palette = STYLE_PALETTES[room.style];
  const floor = FLOORS[materials.floor];
  const floorGeometry = useMemo(
    () => projectUvs(new PlaneGeometry(room.width, room.depth)),
    [room.width, room.depth],
  );
  useDisposed(floorGeometry);
  const boxes = useMemo(() => wallBoxes(room, WALL_THICKNESS), [room]);
  const trim = useMemo(() => trimBoxes(room, WALL_THICKNESS), [room]);
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
        <primitive object={floorGeometry} attach="geometry" />
        <SurfaceMaterial
          surface={floor.surface}
          color={materials.floorColor}
          roughness={floor.roughness}
        />
      </mesh>
      {ceiling && (
        <mesh rotation-x={Math.PI / 2} position={[room.width / 2, room.height, room.depth / 2]}>
          <planeGeometry args={[room.width, room.depth]} />
          <meshStandardMaterial color="#f7f6f3" roughness={1} />
        </mesh>
      )}

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
                <SurfaceMaterial surface="plaster" color={materials.wallColor} roughness={1} />
              </BoxMesh>
            ))}
          {trim
            .filter((box) => box.wall === wall)
            .map((box) => (
              <BoxMesh key={`trim${box.center.join()}`} box={box} castShadow>
                <meshStandardMaterial color={palette.trim} roughness={0.45} />
              </BoxMesh>
            ))}
          {panes
            .filter((pane) => pane.wall === wall)
            .map((pane) => (
              <BoxMesh key={pane.center.join()} box={pane}>
                <meshPhysicalMaterial
                  color={night ? "#1c2638" : "#dbeafe"}
                  transparent
                  opacity={night ? 0.85 : 0.25}
                  roughness={0.05}
                />
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

/** Frees a geometry's GPU buffers once it is replaced or unmounted. */
function useDisposed(geometry: BufferGeometry) {
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
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
  const [width, height, depth] = box.size;
  // Texture coordinates in metres, so plaster tiles at the same size on every wall.
  const geometry = useMemo(
    () => projectUvs(new BoxGeometry(width, height, depth)),
    [width, height, depth],
  );
  useDisposed(geometry);
  return (
    <mesh position={box.center} castShadow={castShadow} receiveShadow>
      <primitive object={geometry} attach="geometry" />
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
