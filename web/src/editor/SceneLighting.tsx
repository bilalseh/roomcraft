import { SoftShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const DAY = { sky: 0.3, sun: 1.9, environment: 0.4 };
const NIGHT = { sky: 0.05, sun: 0.1, environment: 0.04 };

interface SceneLightingProps {
  /** The room's longer side, which sizes the sun's shadow camera. */
  span: number;
  night: boolean;
  sunShadows: boolean;
}

/**
 * Light from a soft studio room for reflections and fill, a sky and ground
 * hemisphere, and the sun, whose shadows soften with distance (PCSS).
 */
export function SceneLighting({ span, night, sunShadows }: SceneLightingProps) {
  const light = night ? NIGHT : DAY;
  useRoomEnvironment(light.environment);

  return (
    <>
      <SoftShadows size={8} samples={10} focus={0.5} />
      <hemisphereLight args={[night ? "#8ea3c7" : "#ffffff", "#d6cfc7", light.sky]} />
      <directionalLight
        position={[span * 0.6, span * 2, span * 0.9]}
        color={night ? "#9fb4d8" : "#fff6ea"}
        intensity={light.sun}
        castShadow={sunShadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
      />
    </>
  );
}

/** three's procedural RoomEnvironment as the scene's environment map: no image to download. */
function useRoomEnvironment(intensity: number) {
  const get = useThree((state) => state.get);

  useEffect(() => {
    const { gl, scene } = get();
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = generator.fromScene(room, 0.04).texture;
    room.dispose();
    generator.dispose();
    scene.environment = texture;
    return () => {
      scene.environment = null;
      texture.dispose();
    };
  }, [get]);

  useEffect(() => {
    get().scene.environmentIntensity = intensity;
  }, [get, intensity]);
}
