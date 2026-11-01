import type { CatalogItem, Category } from "@roomcraft/shared";
import catalogJson from "@roomcraft/shared/catalog/catalog.json";
import { z } from "zod";
import { ROOM_TYPES } from "./room";

export const CATEGORIES = [
  "seating",
  "tables",
  "storage",
  "beds",
  "lighting",
  "decor",
] as const satisfies readonly Category[];

const LAYERS = ["floor", "rug", "wall", "ceiling"] as const;
const MODELS = [
  "sofa",
  "armchair",
  "chair",
  "office_chair",
  "ottoman",
  "table",
  "desk",
  "bed",
  "cabinet",
  "wardrobe",
  "bookshelf",
  "media_unit",
  "floor_lamp",
  "pendant",
  "rug",
  "round_rug",
  "plant",
  "wall_art",
  "mirror",
  "wall_shelf",
] as const;

const catalogItemSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1).max(60),
  category: z.enum(CATEGORIES),
  model: z.enum(MODELS),
  layer: z.enum(LAYERS),
  width: z.number().positive(),
  depth: z.number().positive(),
  height: z.number().positive(),
  elevation: z.number().min(0).exactOptional(),
  price: z.strictObject({ min: z.number().min(0), max: z.number().min(0) }),
  color: z.string().regex(/^#[0-9a-f]{6}$/),
  rooms: z.array(z.enum(ROOM_TYPES)).min(1),
}) satisfies z.ZodType<CatalogItem>;

/** The furniture catalog from shared/catalog, checked once when the module loads. */
export const CATALOG: readonly CatalogItem[] = z.array(catalogItemSchema).parse(catalogJson);

const byId = new Map(CATALOG.map((item) => [item.id, item]));

export function catalogItem(id: string): CatalogItem | undefined {
  return byId.get(id);
}
