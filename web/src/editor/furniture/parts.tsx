import { Instance, Instances } from "@react-three/drei";
import { createContext, useContext, type ReactNode } from "react";
import { CylinderGeometry, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { projectUvs } from "../surfaces/projectUvs";
import { SurfaceMaterial } from "../surfaces/SurfaceMaterial";
import type { SurfaceName } from "../surfaces/surfaces";

export interface ModelProps {
  width: number;
  depth: number;
  height: number;
  color: string;
  /** Night lighting: lamps glow and light the room. */
  lit: boolean;
}

type Vec3 = [x: number, y: number, z: number];

// Geometry is shared by size: a shelf of books in a few heights makes a few geometries.
// Sizes come from the catalog, so the cache stays small and is never cleared.
const geometries = new Map<string, BufferGeometry>();

function shared(key: string, create: () => BufferGeometry): BufferGeometry {
  let geometry = geometries.get(key);
  if (!geometry) {
    geometry = projectUvs(create());
    geometries.set(key, geometry);
  }
  return geometry;
}

interface BlockProps {
  /** Centre of the box. */
  at: Vec3;
  size: Vec3;
  color: string;
  roughness?: number;
  metalness?: number;
  surface?: SurfaceName;
  /** How rounded the edges are, in metres; cushions are softer than boards. */
  radius?: number;
}

export function Block(props: BlockProps) {
  const { at, size, color, roughness = 0.8, metalness = 0, surface, radius } = props;
  const [width, height, depth] = size;
  const thinnest = Math.min(width, height, depth);
  const edge = Math.min(radius ?? 0.012, thinnest / 3);
  const geometry = shared(
    `box|${width}|${height}|${depth}|${edge}`,
    () => new RoundedBoxGeometry(width, height, depth, 2, edge),
  );
  return (
    <mesh position={at} castShadow receiveShadow>
      <primitive object={geometry} attach="geometry" dispose={null} />
      <SurfaceMaterial
        surface={surface}
        color={color}
        roughness={roughness}
        metalness={metalness}
      />
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
  surface?: SurfaceName;
}

export function Cylinder(props: CylinderProps) {
  const { at, radius, height, color, topRadius, roughness = 0.7, emissive = "#000000" } = props;
  const top = topRadius ?? radius;
  const geometry = shared(
    `cylinder|${top}|${radius}|${height}`,
    () => new CylinderGeometry(top, radius, height, 32),
  );
  return (
    <mesh position={at} castShadow receiveShadow>
      <primitive object={geometry} attach="geometry" dispose={null} />
      <SurfaceMaterial
        surface={props.surface}
        color={color}
        roughness={roughness}
        emissive={emissive}
        emissiveIntensity={1.4}
      />
    </mesh>
  );
}

const SeparateLegs = createContext(false);

/**
 * Every leg in the room is one instance of a single cylinder mesh: tables,
 * chairs, beds and sofas share it, so dozens of legs cost one draw call. The
 * path tracer cannot draw instances, so a photo gets one mesh per leg instead.
 */
export function LegInstances({ children, separate }: { children: ReactNode; separate: boolean }) {
  if (separate) return <SeparateLegs value>{children}</SeparateLegs>;
  return (
    <Instances limit={2048} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 1, 12]} />
      <meshStandardMaterial roughness={0.5} />
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
  const separate = useContext(SeparateLegs);
  const position: Vec3 = [x, height / 2, z];
  const scale: Vec3 = [radius, height, radius];
  if (!separate) return <Instance position={position} scale={scale} color={color} />;
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <primitive
        object={shared("leg", () => new CylinderGeometry(1, 1, 1, 12))}
        attach="geometry"
        dispose={null}
      />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
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
