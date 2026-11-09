import { Color } from "three";

/** A lighter or darker version of a colour: below 1 darkens, above 1 lightens. */
export function shade(color: string, factor: number): string {
  return `#${new Color(color).multiplyScalar(factor).getHexString()}`;
}

/** Cushions and throws: a muted colour across the colour wheel, so it stands out from the piece. */
export function accent(color: string): string {
  const { h, s } = new Color(color).getHSL({ h: 0, s: 0, l: 0 });
  // Greys have no hue to oppose: they get a warm terracotta.
  const hue = s < 0.08 ? 0.05 : (h + 0.5) % 1;
  return `#${new Color().setHSL(hue, 0.38, 0.5).getHexString()}`;
}

/** Undyed wool and linen, for a second cushion and throws. */
export const OATMEAL = "#e4d9c6";
