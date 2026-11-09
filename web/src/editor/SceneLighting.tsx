import { SoftShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Vec3 } from "../domain/walls";

const DAY = { sky: 0.3, sun: 1.9, environment: 0.4 };
const NIGHT = { sky: 0.05, sun: 0.1, environment: 0.04 };
const INDOOR_FILL = 1.9;

interface SceneLightingProps {
  /** The room's longer side, which sizes the sun's shadow camera. */
  span: number;
  /** Towards the sun, a unit vector (see sunDirection). */
  sun: Vec3;
  night: boolean;
  sunShadows: boolean;
  /**
   * Under the ceiling (walk mode), where the sun only comes in through windows:
   * more light from the sky and room stands in for daylight bouncing around.
   */
  indoors: boolean;
}

/**
 * Light from a soft studio room for reflections and fill, a sky and ground
 * hemisphere, and the sun, whose shadows soften with distance (PCSS). The sun
 * shines in through the largest window, so its light lands on the floor.
 */
export function SceneLighting(props: SceneLightingProps) {
  const { span, sun, night, sunShadows, indoors } = props;
  const light = night ? NIGHT : DAY;
  const fill = indoors && !night ? INDOOR_FILL : 1;
  useRoomEnvironment(light.environment * fill);

  return (
    <>
      <SoftShadows size={8} samples={10} focus={0.5} />
      <hemisphereLight args={[night ? "#8ea3c7" : "#ffffff", "#d6cfc7", light.sky * fill]} />
      <directionalLight
        position={[sun[0] * span * 2.4, sun[1] * span * 2.4, sun[2] * span * 2.4]}
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
