import { shade } from "../color";
import { Block, FourLegs, type ModelProps } from "../parts";

const FOOT = 0.08;
const PANEL = 0.015;
const BOOK_COLORS = ["#7a2e3a", "#2f4858", "#c2a878", "#3f6b4f", "#d9d2c3", "#8b5d3d"];

/** Chests of drawers and nightstands: a carcass on short legs with drawer fronts. */
export function Cabinet({ width, depth, height, color }: ModelProps) {
  const rows = height > 0.7 ? 3 : 2;
  const body = height - FOOT;
  const row = body / rows;
  return (
    <group>
      <FourLegs width={width} depth={depth} height={FOOT} inset={0.05} color={shade(color, 0.6)} />
      <Block
        at={[0, FOOT + body / 2, 0]}
        size={[width, body, depth]}
        color={color}
        surface="wood"
      />
      {Array.from({ length: rows }, (_, index) => (
        <Block
          key={index}
          at={[0, FOOT + row * (index + 0.5), depth / 2 + PANEL / 2]}
          size={[width - 0.04, row - 0.025, PANEL]}
          color={shade(color, 1.06)}
          surface="wood"
        />
      ))}
    </group>
  );
}

export function Wardrobe({ width, depth, height, color }: ModelProps) {
  const body = height - 0.05;
  return (
    <group>
      <Block
        at={[0, 0.05 + body / 2, 0]}
        size={[width, body, depth]}
        color={color}
        surface="wood"
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block
            at={[(side * width) / 4, 0.05 + body / 2, depth / 2 + PANEL / 2]}
            size={[width / 2 - 0.02, body - 0.04, PANEL]}
            color={shade(color, 1.04)}
            surface="wood"
          />
          <Block
            at={[side * 0.04, 0.05 + body / 2, depth / 2 + PANEL + 0.01]}
            size={[0.015, 0.3, 0.02]}
            color="#6b6259"
            metalness={0.6}
          />
        </group>
      ))}
    </group>
  );
}

/** An open bookshelf, with a row of books on all but the top shelf. */
export function Bookshelf({ width, depth, height, color }: ModelProps) {
  const side = 0.025;
  const shelves = Math.max(3, Math.round(height / 0.38));
  const gap = (height - side) / shelves;
  return (
    <group>
      {[-1, 1].map((s) => (
        <Block
          key={s}
          at={[s * (width / 2 - side / 2), height / 2, 0]}
          size={[side, height, depth]}
          color={color}
          surface="wood"
        />
      ))}
      <Block
        at={[0, height / 2, -depth / 2 + 0.005]}
        size={[width, height, 0.01]}
        color={shade(color, 0.9)}
        surface="wood"
      />
      {Array.from({ length: shelves + 1 }, (_, index) => (
        <Block
          key={index}
          at={[0, side / 2 + gap * index, 0]}
          size={[width - 2 * side, side, depth]}
          color={color}
          surface="wood"
        />
      ))}
      {Array.from({ length: shelves - 1 }, (_, shelf) => (
        <Books
          key={shelf}
          shelf={shelf}
          y={side + gap * shelf}
          width={width - 2 * side - 0.1}
          depth={depth}
        />
      ))}
    </group>
  );
}

function Books({
  shelf,
  y,
  width,
  depth,
}: {
  shelf: number;
  y: number;
  width: number;
  depth: number;
}) {
  const count = Math.floor(width / 0.05);
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        // Deterministic variety, so the shelf looks the same on every render.
        const height = 0.2 + ((index * 7 + shelf * 3) % 5) * 0.025;
        const color = BOOK_COLORS[(index + shelf * 2) % BOOK_COLORS.length] ?? "#8b5d3d";
        return (
          <Block
            key={index}
            at={[-width / 2 + 0.025 + index * 0.05, y + height / 2, 0]}
            size={[0.04, height, depth * 0.7]}
            color={color}
          />
        );
      })}
    </group>
  );
}

/** A low media unit with a television standing on it. */
export function MediaUnit({ width, depth, height, color }: ModelProps) {
  const unit = 0.45;
  const screen = Math.min(height - unit - 0.12, width * 0.48);
  return (
    <group>
      <FourLegs width={width} depth={depth} height={0.06} inset={0.05} color="#27272a" />
      <Block
        at={[0, 0.06 + unit / 2, 0]}
        size={[width, unit, depth]}
        color={color}
        surface="wood"
      />
      <Block at={[0, 0.06 + unit + 0.03, 0]} size={[0.25, 0.06, 0.18]} color="#18181b" />
      <Block
        at={[0, height - screen / 2, 0]}
        size={[width * 0.86, screen, 0.04]}
        color="#111113"
        roughness={0.25}
      />
    </group>
  );
}

/** A plank on the wall, with a few books leaning on it. */
export function WallShelf({ width, depth, color }: ModelProps) {
  return (
    <group>
      <Block at={[0, 0.015, 0]} size={[width, 0.03, depth]} color={color} surface="wood" />
      <Books shelf={1} y={0.03} width={width * 0.45} depth={depth} />
    </group>
  );
}
