export type Units = "metric" | "imperial";

const METRES_PER_INCH = 0.0254;

export interface FeetAndInches {
  feet: number;
  inches: number;
}

/** Rounds to the nearest inch, as a tape measure would read it. */
export function toFeetAndInches(metres: number): FeetAndInches {
  const totalInches = Math.round(metres / METRES_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function fromFeetAndInches({ feet, inches }: FeetAndInches): number {
  return (feet * 12 + inches) * METRES_PER_INCH;
}

/** "3.45 m" or "80 cm" in metric; "11 ft 4 in" in imperial. */
export function formatLength(metres: number, units: Units): string {
  if (units === "imperial") {
    const { feet, inches } = toFeetAndInches(metres);
    if (feet === 0) return `${inches} in`;
    return inches === 0 ? `${feet} ft` : `${feet} ft ${inches} in`;
  }
  if (metres < 1) return `${Math.round(metres * 100)} cm`;
  return `${Number(metres.toFixed(2))} m`;
}

/**
 * "4.5 × 3.6 m", or "210 × 90 cm" when either side is under a metre, so both
 * numbers share a unit; "14 ft 9 in × 11 ft 10 in" in imperial.
 */
export function formatDimensions(width: number, depth: number, units: Units): string {
  if (units === "imperial") return `${formatLength(width, units)} × ${formatLength(depth, units)}`;
  if (Math.min(width, depth) < 1) {
    return `${Math.round(width * 100)} × ${Math.round(depth * 100)} cm`;
  }
  return `${Number(width.toFixed(2))} × ${Number(depth.toFixed(2))} m`;
}
