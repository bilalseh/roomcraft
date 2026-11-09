import { accent, shade } from "../color";
import { Block, FourLegs, type ModelProps } from "../parts";
import { BedThrow, Cushion } from "./textiles";

const FRAME_TOP = 0.32;
const MATTRESS = 0.2;
const HEADBOARD = 0.08;

/**
 * A bed frame, mattress, pillows and a duvet in the item's colour, against a
 * headboard, with a cushion in front of the pillows and a throw across the foot.
 */
export function Bed({ width, depth, height, color }: ModelProps) {
  const pillows = width > 1.2 ? 2 : 1;
  const pillowWidth = (width - 0.2) / pillows - 0.06;
  const mattressTop = FRAME_TOP + MATTRESS;
  const wood = shade(color, 0.55);

  return (
    <group>
      <FourLegs width={width} depth={depth} height={0.08} inset={0.06} color={wood} />
      <Block
        at={[0, (0.08 + FRAME_TOP) / 2, 0]}
        size={[width, FRAME_TOP - 0.08, depth]}
        color={wood}
        surface="wood"
      />
      <Block
        at={[0, FRAME_TOP + MATTRESS / 2, HEADBOARD / 2]}
        size={[width - 0.06, MATTRESS, depth - HEADBOARD - 0.04]}
        color="#f5f3ef"
        roughness={0.95}
        surface="fabric"
        radius={0.05}
      />
      <Block
        at={[0, mattressTop + 0.03, depth / 2 - depth * 0.33]}
        size={[width - 0.02, 0.06, depth * 0.64]}
        color={color}
        roughness={0.95}
        surface="fabric"
        radius={0.025}
      />
      {Array.from({ length: pillows }, (_, index) => (
        <Block
          key={index}
          at={[
            -width / 2 + 0.1 + (pillowWidth + 0.06) * (index + 0.5) + 0.03,
            mattressTop + 0.06,
            -depth / 2 + 0.3,
          ]}
          size={[pillowWidth, 0.12, 0.34]}
          color="#ffffff"
          roughness={0.95}
          surface="fabric"
          radius={0.055}
        />
      ))}
      <Cushion
        at={[0, mattressTop + 0.06 + 0.2, -depth / 2 + 0.55]}
        size={[Math.min(0.5, width * 0.4), 0.36, 0.12]}
        color={accent(color)}
        lean={0.3}
      />
      <BedThrow width={width} z={depth / 2 - 0.35} top={mattressTop + 0.06} color={accent(color)} />
      <Block
        at={[0, height / 2, -depth / 2 + HEADBOARD / 2]}
        size={[width, height, HEADBOARD]}
        color={wood}
        surface="wood"
        radius={0.02}
      />
    </group>
  );
}
