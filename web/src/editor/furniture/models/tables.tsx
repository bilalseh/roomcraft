import { shade } from "../color";
import { Block, FourLegs, type ModelProps } from "../parts";

const TOP = 0.04;

export function Table({ width, depth, height, color }: ModelProps) {
  return (
    <group>
      <FourLegs width={width} depth={depth} height={height - TOP} color={shade(color, 0.75)} />
      <Block
        at={[0, height - TOP / 2, 0]}
        size={[width, TOP, depth]}
        color={color}
        roughness={0.6}
      />
    </group>
  );
}

/** A table with a drawer unit under the right-hand side of the top. */
export function Desk({ width, depth, height, color }: ModelProps) {
  const drawer = Math.min(0.42, width * 0.3);
  return (
    <group>
      <Table width={width} depth={depth} height={height} color={color} />
      <Block
        at={[width / 2 - drawer / 2 - 0.04, height - TOP - 0.08, 0]}
        size={[drawer, 0.16, depth - 0.08]}
        color={shade(color, 0.92)}
      />
    </group>
  );
}
