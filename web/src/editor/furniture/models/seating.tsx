import { shade } from "../color";
import { Block, Cylinder, FourLegs, type ModelProps } from "../parts";

const FOOT = 0.08;
const SEAT = 0.42;
const ARM = 0.16;
const BACK = 0.18;

/** Sofas and armchairs: a base, back, arms and one cushion per seat. */
export function Sofa({ width, depth, height, color }: ModelProps) {
  const seats = width > 1.8 ? 3 : width > 1.2 ? 2 : 1;
  const cushionWidth = (width - 2 * ARM) / seats;
  const cushionDepth = depth - BACK - 0.04;
  const armHeight = Math.min(height, 0.62);

  return (
    <group>
      <FourLegs width={width} depth={depth} height={FOOT} radius={0.025} color="#3f3a36" />
      <Block at={[0, (FOOT + SEAT) / 2, 0]} size={[width, SEAT - FOOT, depth]} color={color} />
      <Block
        at={[0, (SEAT + height) / 2, -depth / 2 + BACK / 2]}
        size={[width, height - SEAT, BACK]}
        color={color}
      />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          at={[side * (width / 2 - ARM / 2), (FOOT + armHeight) / 2, 0]}
          size={[ARM, armHeight - FOOT, depth]}
          color={color}
        />
      ))}
      {Array.from({ length: seats }, (_, seat) => (
        <Block
          key={seat}
          at={[-width / 2 + ARM + cushionWidth * (seat + 0.5), SEAT + 0.06, BACK / 2]}
          size={[cushionWidth - 0.02, 0.12, cushionDepth]}
          color={shade(color, 1.08)}
          roughness={0.95}
        />
      ))}
    </group>
  );
}

export function Chair({ width, depth, height, color }: ModelProps) {
  const seat = 0.45;
  return (
    <group>
      <FourLegs
        width={width}
        depth={depth}
        height={seat}
        inset={0.03}
        radius={0.017}
        color={color}
      />
      <Block at={[0, seat + 0.02, 0]} size={[width, 0.04, depth]} color={color} />
      <Block
        at={[0, (seat + 0.04 + height) / 2, -depth / 2 + 0.015]}
        size={[width, height - seat - 0.04, 0.03]}
        color={color}
      />
    </group>
  );
}

export function OfficeChair({ width, depth, height, color }: ModelProps) {
  const seat = 0.48;
  return (
    <group>
      <Cylinder at={[0, 0.04, 0]} radius={width * 0.45} height={0.05} color="#27272a" />
      <Cylinder at={[0, (0.07 + seat) / 2, 0]} radius={0.03} height={seat - 0.07} color="#71717a" />
      <Block at={[0, seat, 0]} size={[width * 0.78, 0.08, depth * 0.78]} color={color} />
      <Block
        at={[0, (seat + height) / 2 + 0.05, -depth * 0.33]}
        size={[width * 0.72, height - seat - 0.1, 0.06]}
        color={color}
      />
    </group>
  );
}

export function Ottoman({ width, depth, height, color }: ModelProps) {
  return (
    <group>
      <FourLegs width={width} depth={depth} height={0.05} inset={0.05} color="#3f3a36" />
      <Block at={[0, (0.05 + height) / 2, 0]} size={[width, height - 0.05, depth]} color={color} />
    </group>
  );
}
