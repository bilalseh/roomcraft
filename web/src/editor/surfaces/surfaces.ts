import { useEffect, useSyncExternalStore } from "react";
import {
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  type Color,
  type Texture,
} from "three";
import carpetNormal from "./textures/carpet/normal.jpg";
import carpetRoughness from "./textures/carpet/roughness.jpg";
import fabricNormal from "./textures/fabric/normal.jpg";
import fabricRoughness from "./textures/fabric/roughness.jpg";
import plasterNormal from "./textures/plaster/normal.jpg";
import plasterRoughness from "./textures/plaster/roughness.jpg";
import tileColor from "./textures/tile-floor/color.jpg";
import tileNormal from "./textures/tile-floor/normal.jpg";
import tileRoughness from "./textures/tile-floor/roughness.jpg";
import woodFloorColor from "./textures/wood-floor/color.jpg";
import woodFloorNormal from "./textures/wood-floor/normal.jpg";
import woodFloorRoughness from "./textures/wood-floor/roughness.jpg";
import woodColor from "./textures/wood/color.jpg";
import woodNormal from "./textures/wood/normal.jpg";
import woodRoughness from "./textures/wood/roughness.jpg";

export type SurfaceName = "wood" | "fabric" | "plaster" | "wood-floor" | "tile-floor" | "carpet";

/**
 * Colour maps are grey, normalised to an average of 190/255, which is about 0.51 in
 * linear light. Materials divide their colour by it, as far as white allows, to keep
 * the average they were given.
 */
export const COLOR_MAP_MEAN = 0.51;

/**
 * The material colour that tints a grey colour map to `color` on average: brightened
 * by the map's average, but never past white, or a light piece would lose its grain
 * to the tone mapping.
 */
export function colorMapTint(color: Color): Color {
  const brightest = Math.max(color.r, color.g, color.b, 0.001);
  return color.clone().multiplyScalar(Math.min(1 / COLOR_MAP_MEAN, 1 / brightest));
}

interface SurfaceSource {
  /** Grey, so the material's colour tints it; surfaces without one keep the colour flat. */
  color?: string;
  normal: string;
  roughness: string;
  /** How many metres one copy of the texture covers in the real world. */
  metres: number;
  normalScale: number;
}

/** CC0 texture sets from Poly Haven (see the README in ./textures). */
const SOURCES: Record<SurfaceName, SurfaceSource> = {
  "wood-floor": {
    color: woodFloorColor,
    normal: woodFloorNormal,
    roughness: woodFloorRoughness,
    metres: 1.7,
    normalScale: 0.8,
  },
  "tile-floor": {
    color: tileColor,
    normal: tileNormal,
    roughness: tileRoughness,
    metres: 1.5,
    normalScale: 1,
  },
  carpet: { normal: carpetNormal, roughness: carpetRoughness, metres: 0.6, normalScale: 1 },
  plaster: { normal: plasterNormal, roughness: plasterRoughness, metres: 2, normalScale: 0.4 },
  fabric: { normal: fabricNormal, roughness: fabricRoughness, metres: 0.28, normalScale: 0.6 },
  wood: {
    color: woodColor,
    normal: woodNormal,
    roughness: woodRoughness,
    metres: 1.83,
    normalScale: 0.5,
  },
};

export interface SurfaceMaps {
  map: Texture | null;
  normalMap: Texture;
  roughnessMap: Texture;
  normalScale: Vector2;
}

// Loaded once per surface and shared by every material that uses it. Geometry carries
// UVs in metres (see projectUvs), so each texture repeats at its real-world size.
const loaded = new Map<SurfaceName, SurfaceMaps>();
const loading = new Set<SurfaceName>();
const listeners = new Set<() => void>();
const loader = new TextureLoader();

async function load(name: SurfaceName): Promise<void> {
  if (loaded.has(name) || loading.has(name)) return;
  loading.add(name);
  const source = SOURCES[name];
  const texture = async (url: string, color: boolean) => {
    const result = await loader.loadAsync(url);
    result.wrapS = RepeatWrapping;
    result.wrapT = RepeatWrapping;
    result.repeat.setScalar(1 / source.metres);
    result.anisotropy = 8;
    if (color) result.colorSpace = SRGBColorSpace;
    return result;
  };
  try {
    const [map, normalMap, roughnessMap] = await Promise.all([
      source.color ? texture(source.color, true) : null,
      texture(source.normal, false),
      texture(source.roughness, false),
    ]);
    const normalScale = new Vector2(source.normalScale, source.normalScale);
    loaded.set(name, { map, normalMap, roughnessMap, normalScale });
    for (const listener of listeners) listener();
  } catch (error) {
    // The surface stays a plain colour, which still looks fine.
    console.warn(`Could not load the ${name} textures`, error);
  } finally {
    loading.delete(name);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The textures for a surface once they have loaded; null meanwhile, or for no surface. */
export function useSurface(name: SurfaceName | undefined): SurfaceMaps | null {
  const maps = useSyncExternalStore(subscribe, () => (name ? (loaded.get(name) ?? null) : null));
  useEffect(() => {
    if (name) void load(name);
  }, [name]);
  return maps;
}
