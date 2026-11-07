import { Cylinder, type ModelProps } from "../parts";

const SHADE = 0.3;
const GLOW = "#ffcf8a";
const LAMPLIGHT = "#ffd9a6";
// Lamps light by the inverse square law with no cut-off range (distance 0), which the
// photo's path tracer needs: a range draws a hard edge where the light stops.

/** A weighted base, a slim pole and a fabric shade that glows at night. */
export function FloorLamp({ width, height, color, lit }: ModelProps) {
  const pole = height - SHADE;
  return (
    <group>
      <Cylinder at={[0, 0.015, 0]} radius={width * 0.35} height={0.03} color="#27272a" />
      <Cylinder at={[0, pole / 2, 0]} radius={0.012} height={pole} color="#52525b" />
      <Cylinder
        at={[0, pole + SHADE / 2, 0]}
        radius={width / 2}
        topRadius={width * 0.36}
        height={SHADE}
        color={color}
        roughness={0.95}
        surface="fabric"
        {...(lit ? { emissive: GLOW } : {})}
      />
      {lit && (
        <pointLight
          position={[0, pole + SHADE / 2, 0]}
          color={LAMPLIGHT}
          intensity={3}
          distance={0}
          decay={2}
        />
      )}
    </group>
  );
}

/** A shade hanging from the ceiling on a cord; its origin is the bottom of the shade. */
export function Pendant({ width, height, color, lit }: ModelProps) {
  const shade = height * 0.45;
  const cord = height - shade;
  return (
    <group>
      <Cylinder at={[0, shade + cord / 2, 0]} radius={0.005} height={cord} color="#18181b" />
      <Cylinder
        at={[0, shade / 2, 0]}
        radius={width / 2}
        topRadius={0.05}
        height={shade}
        color={color}
        roughness={0.5}
        {...(lit ? { emissive: "#3a2a14" } : {})}
      />
      {lit && (
        <pointLight
          position={[0, -0.05, 0]}
          color={LAMPLIGHT}
          intensity={5}
          distance={0}
          decay={2}
        />
      )}
    </group>
  );
}
