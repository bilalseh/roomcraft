import { useMemo } from "react";
import { Color, type Side } from "three";
import { colorMapTint, useSurface, type SurfaceName } from "./surfaces";

interface SurfaceMaterialProps {
  surface?: SurfaceName | undefined;
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: Side;
}

/** Linear luminance above which a wood finish reads as paint rather than stain. */
const PALE = 0.5;
/** Fabric catches a soft rim of light at grazing angles; wood has a thin satin lacquer. */
const FABRIC_SHEEN = { sheen: 0.5, sheenRoughness: 0.75 };
const LACQUER = { clearcoat: 0.12, clearcoatRoughness: 0.4 };

/**
 * A physical material, textured once its surface has loaded. The texture's
 * roughness is scaled by `roughness`, and its grey colour map tinted by `color`.
 */
export function SurfaceMaterial(props: SurfaceMaterialProps) {
  const { surface, color, roughness = 0.8, metalness = 0, ...rest } = props;
  const maps = useSurface(surface);
  const base = useMemo(() => new Color(color), [color]);
  // Pale wood is painted: it keeps the grain's relief but not its colour.
  const painted = surface === "wood" && 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b > PALE;
  const colorMap = painted ? null : (maps?.map ?? null);
  const tint = useMemo(() => (colorMap ? colorMapTint(base) : base), [base, colorMap]);
  const sheenColor = useMemo(() => base.clone().lerp(new Color("#ffffff"), 0.35), [base]);
  const finish =
    surface === "fabric" ? { ...FABRIC_SHEEN, sheenColor } : surface === "wood" ? LACQUER : {};

  // A new material when the textures arrive: three compiles a different shader for them.
  return (
    <meshPhysicalMaterial
      key={maps ? "textured" : "plain"}
      color={tint}
      roughness={roughness}
      metalness={metalness}
      {...finish}
      {...rest}
      {...(maps ? { ...maps, map: colorMap } : {})}
    />
  );
}
