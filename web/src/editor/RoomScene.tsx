import { Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { PHONE, useMediaQuery } from "../components/useMediaQuery";
import { sunDirection } from "../domain/sun";
import { Curtains } from "./Curtains";
import { FurnitureLayer } from "./furniture/FurnitureLayer";
import { PhotoRenderer } from "./photo/PhotoRenderer";
import { PlanMeasurements } from "./PlanMeasurements";
import { RoomShell } from "./RoomShell";
import { SceneEffects } from "./SceneEffects";
import { SceneLighting } from "./SceneLighting";
import { useEditor } from "./state/useEditor";
import { ThumbnailCapture } from "./ThumbnailCapture";
import { OrbitView, PlanView, WALK_SURFACE_ID, WalkView } from "./views";

const BACKGROUND = { day: "#e7e5e4", night: "#18202c" };

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
  const phone = useMediaQuery(PHONE);
  const photographing = useEditor((state) => state.photo?.status === "rendering");
  const span = Math.max(room.width, room.depth);
  const sun = useMemo(() => sunDirection(room), [room]);

  return (
    <Canvas
      id={WALK_SURFACE_ID}
      shadows="percentage"
      flat
      // Phones draw fewer pixels: the effects cost per pixel, and their screens are small.
      dpr={[1, phone ? 1.5 : 2]}
      onPointerMissed={() => {
        select(null);
      }}
    >
      <color attach="background" args={[night ? BACKGROUND.night : BACKGROUND.day]} />
      <SceneLighting
        span={span}
        sun={sun}
        night={night}
        sunShadows={!night && mode !== "plan"}
        indoors={mode === "walk"}
      />
      {photographing ? (
        <PhotoRenderer />
      ) : (
        <SceneEffects night={night} occlusion={mode !== "plan"} />
      )}

      <ThumbnailCapture />
      {mode === "orbit" && <OrbitView room={room} />}
      {mode === "plan" && <PlanView room={room} />}
      {mode === "walk" && <WalkView room={room} />}

      {/* Room coordinates: origin at the north-west corner, centred on the world origin. */}
      <group position={[-room.width / 2, 0, -room.depth / 2]}>
        <RoomShell room={room} materials={materials} night={night} ceiling={mode === "walk"} />
        {mode !== "plan" && <Curtains />}
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
