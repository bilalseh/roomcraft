import type { FloorMaterial } from "@roomcraft/shared";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { shade } from "./furniture/color";

/** Metres of floor that one copy of each texture covers. */
export const TEXTURE_METRES: Record<FloorMaterial, number> = { wood: 1.2, tile: 1.2, carpet: 1 };
export const FLOOR_ROUGHNESS: Record<FloorMaterial, number> = { wood: 0.65, tile: 0.35, carpet: 1 };

const PIXELS = 512;

/** A tiling floor texture drawn on a canvas, in the floor's colour. */
export function createFloorTexture(material: FloorMaterial, color: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = PIXELS;
  canvas.height = PIXELS;
  const context = canvas.getContext("2d");
  if (context) {
    // Seeded, so the same floor looks the same every time it is drawn.
    const random = seededRandom(Number.parseInt(color.slice(1), 16) + material.length);
    DRAW[material](context, color, random);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

type Draw = (context: CanvasRenderingContext2D, color: string, random: () => number) => void;

const DRAW: Record<FloorMaterial, Draw> = {
  // Eight rows of planks with staggered joints, per-plank tone and fine grain.
  wood: (context, color, random) => {
    const rows = 8;
    const row = PIXELS / rows;
    for (let index = 0; index < rows; index++) {
      const y = index * row;
      let x = -random() * PIXELS * 0.6;
      while (x < PIXELS) {
        const length = PIXELS * (0.45 + random() * 0.5);
        context.fillStyle = shade(color, 0.92 + random() * 0.16);
        fillWrapped(context, x, y, length, row);
        context.strokeStyle = shade(color, 0.86);
        context.lineWidth = 1;
        for (let grain = 0; grain < 5; grain++) {
          const gy = y + 4 + random() * (row - 8);
          context.beginPath();
          context.moveTo(Math.max(x, 0), gy);
          context.lineTo(Math.min(x + length, PIXELS), gy + (random() - 0.5) * 4);
          context.stroke();
        }
        context.fillStyle = shade(color, 0.7);
        fillWrapped(context, x + length - 2, y, 2, row);
        x += length;
      }
      context.fillStyle = shade(color, 0.72);
      context.fillRect(0, y, PIXELS, 2);
    }
  },
  // Two by two tiles of 60 cm with grout lines and a slight tone per tile.
  tile: (context, color, random) => {
    const tile = PIXELS / 2;
    for (let tx = 0; tx < 2; tx++) {
      for (let ty = 0; ty < 2; ty++) {
        context.fillStyle = shade(color, 0.96 + random() * 0.08);
        context.fillRect(tx * tile, ty * tile, tile, tile);
      }
    }
    context.fillStyle = shade(color, 0.78);
    for (const line of [0, tile]) {
      context.fillRect(line, 0, 3, PIXELS);
      context.fillRect(0, line, PIXELS, 3);
    }
  },
  // A soft speckle of lighter and darker fibres.
  carpet: (context, color, random) => {
    context.fillStyle = color;
    context.fillRect(0, 0, PIXELS, PIXELS);
    for (let speck = 0; speck < 9000; speck++) {
      context.fillStyle = shade(color, 0.85 + random() * 0.3);
      context.fillRect(random() * PIXELS, random() * PIXELS, 1.5, 1.5);
    }
  },
};

/** Fills a rectangle, wrapping horizontally so the texture tiles without seams. */
function fillWrapped(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  context.fillRect(x, y, w, h);
  if (x < 0) context.fillRect(x + PIXELS, y, w, h);
  if (x + w > PIXELS) context.fillRect(x - PIXELS, y, w, h);
}

/** Mulberry32: a small, fast pseudo-random generator. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
