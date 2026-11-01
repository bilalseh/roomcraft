import { Block, Cylinder, type ModelProps } from "../parts";

const RUG = 0.01;

export function Rug({ width, depth, color }: ModelProps) {
  return <Block at={[0, RUG / 2, 0]} size={[width, RUG, depth]} color={color} roughness={1} />;
}

export function RoundRug({ width, color }: ModelProps) {
  return (
    <Cylinder at={[0, RUG / 2, 0]} radius={width / 2} height={RUG} color={color} roughness={1} />
  );
}

/** A terracotta pot with leafy clumps in the item's colour. */
export function Plant({ width, height, color }: ModelProps) {
  const pot = height * 0.26;
  const leaves: [x: number, y: number, z: number, radius: number][] = [
    [0, pot + height * 0.22, 0, width * 0.42],
    [width * 0.12, pot + height * 0.45, -width * 0.06, width * 0.36],
    [-width * 0.1, pot + height * 0.6, width * 0.08, width * 0.3],
  ];
  return (
    <group>
      <Cylinder
        at={[0, pot / 2, 0]}
        radius={width * 0.3}
        topRadius={width * 0.36}
        height={pot}
        color="#b5653e"
      />
      {leaves.map(([x, y, z, radius]) => (
        <mesh key={`${x},${y}`} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** A dark frame around a print in the item's colour. */
export function WallArt({ width, depth, height, color }: ModelProps) {
  return (
    <group>
      <Block at={[0, height / 2, 0]} size={[width, height, depth]} color="#2b2b2b" />
      <Block
        at={[0, height / 2, depth / 2 + 0.002]}
        size={[width - 0.08, height - 0.08, 0.004]}
        color={color}
        roughness={0.9}
      />
    </group>
  );
}

export function Mirror({ width, depth, height, color }: ModelProps) {
  return (
    <group>
      <Block at={[0, height / 2, 0]} size={[width, height, depth]} color={color} />
      <Block
        at={[0, height / 2, depth / 2 + 0.002]}
        size={[width - 0.06, height - 0.06, 0.004]}
        color="#dfe7ea"
        roughness={0.05}
        metalness={1}
      />
    </group>
  );
}
