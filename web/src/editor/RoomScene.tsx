import { Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FurnitureLayer } from "./furniture/FurnitureLayer";
import { PlanMeasurements } from "./PlanMeasurements";
import { RoomShell } from "./RoomShell";
import { useEditor } from "./state/useEditor";
import { ThumbnailCapture } from "./ThumbnailCapture";
import { OrbitView, PlanView, WALK_SURFACE_ID, WalkView } from "./views";

const DAY = { background: "#e7e5e4", sky: 1.3, sun: 1.7 };
const NIGHT = { background: "#18202c", sky: 0.12, sun: 0.15 };

export function RoomScene() {
  const room = useEditor((state) => state.history.present.room);
  const materials = useEditor(
    (state) => (state.preview?.layout ?? state.history.present).materials,
  );
  const mode = useEditor((state) => state.cameraMode);
  const night = useEditor((state) => state.lighting === "night");
  const select = useEditor((state) => state.select);
  // The snapping grid only matters while a piece is being placed.
  const placing = useEditor((state) => state.selectedId !== null || state.drag !== null);
  const span = Math.max(room.width, room.depth);
  const light = night ? NIGHT : DAY;

  return (
    <Canvas
      id={WALK_SURFACE_ID}
      shadows="percentage"
      dpr={[1, 2]}
      onPointerMissed={() => {
        select(null);
      }}
    >
      <color attach="background" args={[light.background]} />
      <hemisphereLight args={[night ? "#8ea3c7" : "#ffffff", "#d6cfc7", light.sky]} />
      <directionalLight
        position={[span * 0.6, span * 2, span * 0.9]}
        color={night ? "#9fb4d8" : "#ffffff"}
        intensity={light.sun}
        castShadow={!night}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />

      <ThumbnailCapture />
      {mode === "orbit" && <OrbitView room={room} />}
      {mode === "plan" && <PlanView room={room} />}
      {mode === "walk" && <WalkView room={room} />}

      {/* Room coordinates: origin at the north-west corner, centred on the world origin. */}
      <group position={[-room.width / 2, 0, -room.depth / 2]}>
        <RoomShell room={room} materials={materials} night={night} ceiling={mode === "walk"} />
        {placing && mode !== "walk" && (
          <Grid
            args={[room.width, room.depth]}
            position={[room.width / 2, 0.002, room.depth / 2]}
            cellSize={0.5}
            sectionSize={1}
            cellThickness={0.4}
            sectionThickness={0.7}
            cellColor="#a8a29e"
            sectionColor="#8b8580"
            fadeDistance={span * 6}
          />
        )}
        <FurnitureLayer />
        {mode === "plan" && <PlanMeasurements room={room} />}
      </group>
    </Canvas>
  );
}
