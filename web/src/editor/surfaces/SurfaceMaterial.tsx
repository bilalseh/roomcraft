import { useMemo } from "react";
import { Color } from "three";
import { COLOR_MAP_MEAN, useSurface, type SurfaceName } from "./surfaces";

interface SurfaceMaterialProps {
  surface?: SurfaceName | undefined;
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

/** Linear luminance above which a wood finish reads as paint rather than stain. */
const PALE = 0.5;

/**
 * A standard material, textured once its surface has loaded. The texture's
 * roughness is scaled by `roughness`, and its grey colour map tinted by `color`.
 */
export function SurfaceMaterial(props: SurfaceMaterialProps) {
  const { surface, color, roughness = 0.8, metalness = 0, ...glow } = props;
  const maps = useSurface(surface);
  const base = useMemo(() => new Color(color), [color]);
  // Pale wood is painted: it keeps the grain's relief but not its colour.
  const painted = surface === "wood" && 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b > PALE;
  const colorMap = painted ? null : (maps?.map ?? null);

  const tint = useMemo(() => {
    if (!colorMap) return base;
    // Brightened by the colour map's average, so the piece keeps the colour chosen, but never
    // past white: a light floor would lose its grain to the tone mapping.
    const brightest = Math.max(base.r, base.g, base.b, 0.001);
    return base.clone().multiplyScalar(Math.min(1 / COLOR_MAP_MEAN, 1 / brightest));
  }, [base, colorMap]);

  // A new material when the textures arrive: three compiles a different shader for them.
  return (
    <meshStandardMaterial
      key={maps ? "textured" : "plain"}
      color={tint}
      roughness={roughness}
      metalness={metalness}
      {...glow}
      {...(maps ? { ...maps, map: colorMap } : {})}
    />
  );
}
