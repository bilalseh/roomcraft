import type { Room } from "@roomcraft/shared";
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  PointerLockControls,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { REDUCED_MOTION, useMediaQuery } from "../components/useMediaQuery";
import { Vector3 } from "three";
import { pointOnWall, wallFrame } from "../domain/walls";

/** The element that captures the mouse when walk mode is clicked. */
export const WALK_SURFACE_ID = "editor-canvas";

type RoomSize = Pick<Room, "width" | "depth">;

/** Looking into the room from above one corner; drag to orbit. */
export function OrbitView({ room }: { room: RoomSize }) {
  const span = Math.max(room.width, room.depth);
  // The camera keeps drifting after a drag unless motion is reduced.
  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[span * 0.75, span * 1.05, span * 1.2]}
        fov={45}
        near={0.05}
        far={200}
      />
      <OrbitControls
        makeDefault
        target={[0, 0.6, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={1.5}
        maxDistance={span * 4}
        enableDamping={!reducedMotion}
      />
    </>
  );
}

/** Straight down, north at the top, sized to fit the room with a margin for measurements. */
export function PlanView({ room }: { room: RoomSize }) {
  const size = useThree((state) => state.size);
  const zoom = Math.min(size.width / (room.width + 2), size.height / (room.depth + 2));
  return (
    <OrthographicCamera
      makeDefault
      position={[0, 30, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      zoom={zoom}
      near={0.1}
      far={100}
    />
  );
}

const EYE_HEIGHT = 1.6;
const WALK_SPEED = 1.6;
const WALL_MARGIN = 0.25;
const KEYS: Record<string, [forward: number, right: number]> = {
  KeyW: [1, 0],
  ArrowUp: [1, 0],
  KeyS: [-1, 0],
  ArrowDown: [-1, 0],
  KeyD: [0, 1],
  ArrowRight: [0, 1],
  KeyA: [0, -1],
  ArrowLeft: [0, -1],
};

/** First person at eye height, starting inside the first door and looking into the room. */
export function WalkView({ room }: { room: Room }) {
  const pressed = useRef(new Set<string>());
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const start = walkStart(room);

  useEffect(() => {
    const keys = pressed.current;
    const down = (event: KeyboardEvent) => {
      if (event.code in KEYS) keys.add(event.code);
    };
    const up = (event: KeyboardEvent) => {
      keys.delete(event.code);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.clear();
    };
  }, []);

  useFrame(({ camera }, delta) => {
    let ahead = 0;
    let side = 0;
    for (const code of pressed.current) {
      const [f, r] = KEYS[code] ?? [0, 0];
      ahead += f;
      side += r;
    }
    if (ahead === 0 && side === 0) return;
    // Walk along the floor in the direction the camera faces, whatever the pitch.
    camera.getWorldDirection(forward.current).setY(0).normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();
    const step = WALK_SPEED * Math.min(delta, 0.1);
    camera.position.addScaledVector(forward.current, ahead * step);
    camera.position.addScaledVector(right.current, side * step);
    const limitX = room.width / 2 - WALL_MARGIN;
    const limitZ = room.depth / 2 - WALL_MARGIN;
    camera.position.x = Math.min(Math.max(camera.position.x, -limitX), limitX);
    camera.position.z = Math.min(Math.max(camera.position.z, -limitZ), limitZ);
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[start.x - room.width / 2, EYE_HEIGHT, start.z - room.depth / 2]}
        rotation={[0, start.yaw, 0]}
        fov={70}
        near={0.05}
        far={100}
      />
      <PointerLockControls selector={`#${WALK_SURFACE_ID}`} />
    </>
  );
}

/** Just inside the first door, facing into the room; the middle of the room without a door. */
function walkStart(room: Room): { x: number; z: number; yaw: number } {
  const door = room.openings.find((opening) => opening.kind === "door");
  if (!door) return { x: room.width / 2, z: room.depth / 2, yaw: 0 };
  const frame = wallFrame(room, door.wall);
  const [x, z] = pointOnWall(frame, door.offset + door.width / 2, 0.6);
  // A camera looks down -z; turn it to face the wall's inward direction.
  return { x, z, yaw: Math.atan2(-frame.inward[0], -frame.inward[1]) };
}
