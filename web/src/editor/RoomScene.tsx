import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FurnitureLayer } from "./furniture/FurnitureLayer";
import { RoomShell } from "./RoomShell";
import { useEditor } from "./state/useEditor";

export function RoomScene() {
  const room = useEditor((state) => state.history.present.room);
  const select = useEditor((state) => state.select);
  const span = Math.max(room.width, room.depth);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: [span * 0.75, span * 1.05, span * 1.2], fov: 45, near: 0.05, far: 200 }}
      onPointerMissed={() => {
        select(null);
      }}
    >
      <color attach="background" args={["#e7e5e4"]} />
      <hemisphereLight args={["#ffffff", "#d6cfc7", 1.3]} />
      <directionalLight
        position={[span * 0.6, span * 2, span * 0.9]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />

      {/* Room coordinates: origin at the north-west corner, centred on the world origin. */}
      <group position={[-room.width / 2, 0, -room.depth / 2]}>
        <RoomShell room={room} />
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
        <FurnitureLayer />
      </group>

      <OrbitControls
        makeDefault
        target={[0, 0.6, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={1.5}
        maxDistance={span * 4}
      />
    </Canvas>
  );
}
