import type { Wall } from "@roomcraft/shared";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, PlaneGeometry, type Group } from "three";
import { catalogItem } from "../domain/catalog";
import { curtains, type CurtainPanel, type CurtainRod } from "../domain/curtains";
import { footprint } from "../domain/placement";
import { WALLS } from "../domain/room";
import { CURTAIN_COLORS } from "../domain/styles";
import { pointOnWall, wallFrame, type WallFrame } from "../domain/walls";
import { isWallCutAway } from "./cutaway";
import { useEditor } from "./state/useEditor";
import { projectUvs } from "./surfaces/projectUvs";
import { SurfaceMaterial } from "./surfaces/SurfaceMaterial";

/** The curtain line's distance from the wall, and the depth and spacing of its folds. */
const HANG = 0.07;
const FOLD = { depth: 0.035, every: 0.11 };
const ROD_COLOR = "#3a3633";

/**
 * Curtains at every window, left out where furniture stands in the way. They
 * belong to their walls, so they go when the dollhouse view cuts a wall away.
 */
export function Curtains() {
  const layout = useEditor((state) => state.preview?.layout ?? state.history.present);
  const { room, furniture } = layout;
  const { panels, rods } = useMemo(() => {
    const pieces = furniture.flatMap((placement) => {
      const item = catalogItem(placement.itemId);
      return item ? [footprint(placement, item)] : [];
    });
    return curtains(room, pieces);
  }, [room, furniture]);
  const groups = useRef<Partial<Record<Wall, Group | null>>>({});

  useFrame(({ camera }) => {
    for (const wall of WALLS) {
      const group = groups.current[wall];
      if (group) group.visible = !isWallCutAway(room, wall, camera.position);
    }
  });

  const color = CURTAIN_COLORS[room.style];
  return (
    <group>
      {WALLS.map((wall) => {
        const frame = wallFrame(room, wall);
        return (
          <group
            key={wall}
            ref={(group) => {
              groups.current[wall] = group;
            }}
          >
            {panels
              .filter((panel) => panel.wall === wall)
              .map((panel) => (
                <Panel key={panel.start} panel={panel} frame={frame} color={color} />
              ))}
            {rods
              .filter((rod) => rod.wall === wall)
              .map((rod) => (
                <Rod key={rod.start} rod={rod} frame={frame} />
              ))}
          </group>
        );
      })}
    </group>
  );
}

/** Facing into the room: a plane faces +z, so turn +z to the wall's inward direction. */
const facing = (frame: WallFrame) => Math.atan2(frame.inward[0], frame.inward[1]);

function Panel({ panel, frame, color }: { panel: CurtainPanel; frame: WallFrame; color: string }) {
  const width = panel.end - panel.start;
  const height = panel.top - 0.01;
  const geometry = useMemo(() => pleated(width, height), [width, height]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  const [x, z] = pointOnWall(frame, (panel.start + panel.end) / 2, HANG);
  return (
    <mesh position={[x, 0.01 + height / 2, z]} rotation-y={facing(frame)} castShadow receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <SurfaceMaterial surface="fabric" color={color} roughness={1} side={DoubleSide} />
    </mesh>
  );
}

/** A flat panel folded like gathered fabric, with texture coordinates in metres. */
function pleated(width: number, height: number) {
  const geometry = new PlaneGeometry(width, height, Math.ceil(width / 0.012), 1);
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    position.setZ(index, FOLD.depth * Math.sin(((x + width / 2) / FOLD.every) * 2 * Math.PI));
  }
  geometry.computeVertexNormals();
  return projectUvs(geometry);
}

function Rod({ rod, frame }: { rod: CurtainRod; frame: WallFrame }) {
  const [x, z] = pointOnWall(frame, (rod.start + rod.end) / 2, HANG);
  return (
    <mesh
      position={[x, rod.height + 0.01, z]}
      rotation={[0, facing(frame), Math.PI / 2]}
      castShadow
    >
      <cylinderGeometry args={[0.012, 0.012, rod.end - rod.start + 0.08, 12]} />
      <meshStandardMaterial color={ROD_COLOR} roughness={0.4} metalness={0.6} />
    </mesh>
  );
}
