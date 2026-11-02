import { Instance, Instances } from "@react-three/drei";
import type { ReactNode } from "react";

export interface ModelProps {
  width: number;
  depth: number;
  height: number;
  color: string;
  /** Night lighting: lamps glow and light the room. */
  lit: boolean;
}

type Vec3 = [x: number, y: number, z: number];

interface BlockProps {
  /** Centre of the box. */
  at: Vec3;
  size: Vec3;
  color: string;
  roughness?: number;
  metalness?: number;
}

export function Block({ at, size, color, roughness = 0.8, metalness = 0 }: BlockProps) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

interface CylinderProps {
  /** Centre of the cylinder. */
  at: Vec3;
  radius: number;
  height: number;
  color: string;
  /** Radius at the top, for cones and lamp shades. Defaults to `radius`. */
  topRadius?: number;
  roughness?: number;
  /** A glow colour, for lit lamp shades. */
  emissive?: string;
}

export function Cylinder(props: CylinderProps) {
  const { at, radius, height, color, topRadius, roughness = 0.7, emissive = "#000000" } = props;
  return (
    <mesh position={at} castShadow receiveShadow>
      <cylinderGeometry args={[topRadius ?? radius, radius, height, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        emissive={emissive}
        emissiveIntensity={1.4}
      />
    </mesh>
  );
}

/**
 * Every leg in the room is one instance of a single cylinder mesh: tables,
 * chairs, beds and sofas share it, so dozens of legs cost one draw call.
 */
export function LegInstances({ children }: { children: ReactNode }) {
  return (
    <Instances limit={2048} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 1, 10]} />
      <meshStandardMaterial roughness={0.6} />
      {children}
    </Instances>
  );
}

/** A leg standing on the floor at (x, z) relative to the item's centre. */
export function Leg({
  x,
  z,
  height,
  radius = 0.02,
  color,
}: {
  x: number;
  z: number;
  height: number;
  radius?: number;
  color: string;
}) {
  return <Instance position={[x, height / 2, z]} scale={[radius, height, radius]} color={color} />;
}

/** Four legs set in from the corners of a width × depth rectangle. */
export function FourLegs({
  width,
  depth,
  height,
  inset = 0.06,
  radius,
  color,
}: {
  width: number;
  depth: number;
  height: number;
  inset?: number;
  radius?: number;
  color: string;
}) {
  const x = width / 2 - inset;
  const z = depth / 2 - inset;
  const corners: [number, number][] = [
    [-x, -z],
    [x, -z],
    [x, z],
    [-x, z],
  ];
  return (
    <>
      {corners.map(([cx, cz]) => (
        <Leg
          key={`${cx},${cz}`}
          x={cx}
          z={cz}
          height={height}
          color={color}
          {...(radius === undefined ? {} : { radius })}
        />
      ))}
    </>
  );
}
