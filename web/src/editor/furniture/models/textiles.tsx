import { Block } from "../parts";

type Vec3 = [x: number, y: number, z: number];

interface CushionProps {
  /** Centre of the cushion. */
  at: Vec3;
  /** Width, height and thickness. */
  size: Vec3;
  color: string;
  /** Leaning back against a sofa or headboard, and turned a little sideways, in radians. */
  lean?: number;
  tilt?: number;
}

/** A plump cushion, leaning back. */
export function Cushion({ at, size, color, lean = 0.25, tilt = 0 }: CushionProps) {
  return (
    <group position={at} rotation={[-lean, 0, tilt]}>
      <Block
        at={[0, 0, 0]}
        size={size}
        color={color}
        roughness={0.95}
        surface="fabric"
        radius={Math.min(size[2] / 2.2, 0.06)}
      />
    </group>
  );
}

interface FoldedThrowProps {
  /** Where it lies on the seat, and how it is turned, in radians. */
  at: Vec3;
  turn: number;
  color: string;
}

const THROW_THICKNESS = 0.025;

/** A blanket folded into a soft square on a seat. */
export function FoldedThrow({ at, turn, color }: FoldedThrowProps) {
  return (
    <group position={at} rotation-y={turn}>
      <Block
        at={[0, 0.035, 0]}
        size={[0.42, 0.07, 0.34]}
        color={color}
        roughness={1}
        surface="fabric"
        radius={0.03}
      />
    </group>
  );
}

interface BedThrowProps {
  width: number;
  /** Where across the bed it lies, and the height of the duvet it lies on. */
  z: number;
  top: number;
  color: string;
}

/** A runner across the foot of a bed, hanging over both sides. */
export function BedThrow({ width, z, top, color }: BedThrowProps) {
  const length = 0.5;
  const drop = 0.28;
  return (
    <group>
      <Block
        at={[0, top + THROW_THICKNESS / 2, z]}
        size={[width + 0.03, THROW_THICKNESS, length]}
        color={color}
        roughness={1}
        surface="fabric"
        radius={0.01}
      />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          at={[side * (width / 2 + 0.015), top - drop / 2 + 0.02, z]}
          size={[THROW_THICKNESS, drop, length]}
          color={color}
          roughness={1}
          surface="fabric"
          radius={0.01}
        />
      ))}
    </group>
  );
}
