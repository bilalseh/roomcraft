import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

// Metres. Replaced by the room from the setup wizard.
const FLOOR = { width: 5, depth: 4 };

export function RoomScene() {
  return (
    <Canvas camera={{ position: [5, 4.5, 6], fov: 45 }} shadows="percentage" dpr={[1, 2]}>
      <color attach="background" args={["#e7e5e4"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 3]} intensity={1.8} castShadow />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[FLOOR.width, FLOOR.depth]} />
        <meshStandardMaterial color="#d6c4a8" />
      </mesh>
      <Grid
        args={[FLOOR.width, FLOOR.depth]}
        position-y={0.002}
        cellSize={0.5}
        sectionSize={1}
        cellColor="#a8a29e"
        sectionColor="#78716c"
      />

      <mesh position={[0, 0.4, -1.4]} castShadow>
        <boxGeometry args={[2, 0.8, 0.9]} />
        <meshStandardMaterial color="#0f766e" />
      </mesh>

      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={20}
      />
    </Canvas>
  );
}
