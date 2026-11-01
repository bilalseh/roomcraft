import { Color } from "three";

/** A lighter or darker version of a colour: below 1 darkens, above 1 lightens. */
export function shade(color: string, factor: number): string {
  return `#${new Color(color).multiplyScalar(factor).getHexString()}`;
}
