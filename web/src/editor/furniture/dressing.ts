import { MEDIA_CABINET } from "./models/storage";

/** Small decor (Poly Haven, CC0) in web/public/models, shown at its real size. */
export type PropName = "vase-tall" | "vase-round" | "vase-jug" | "succulent" | "bowl" | "books";

export interface PropPlacement {
  name: PropName;
  /** Where its base stands, from the piece's centre on the floor, in the piece's own axes. */
  at: [x: number, y: number, z: number];
  /** Quarter turns about the vertical axis. */
  turns?: number;
}

interface PieceSize {
  width: number;
  depth: number;
  height: number;
}

/** The bookshelf model's boards, as shares of its height. */
const BOARDS = [0.062, 0.299, 0.535, 0.772, 1] as const;

/**
 * What stands on each piece, so a room looks lived in. Only decoration: it is not
 * in the catalog, the budget or the shopping list.
 */
export const DRESSING: Readonly<Partial<Record<string, (size: PieceSize) => PropPlacement[]>>> = {
  "coffee-table": ({ width, height }) => [
    { name: "bowl", at: [-width * 0.2, height, 0.02] },
    { name: "succulent", at: [width * 0.22, height, -0.05] },
  ],
  "side-table": ({ height }) => [{ name: "vase-jug", at: [0.04, height, -0.03] }],
  "dining-table": ({ width, height }) => [
    { name: "bowl", at: [-width * 0.08, height, 0] },
    { name: "vase-tall", at: [width * 0.14, height, -0.04] },
  ],
  bookshelf: ({ width, height }) => {
    const board = (index: 0 | 1 | 2 | 3) => BOARDS[index] * height;
    return [
      { name: "books", at: [-width * 0.13, board(0), 0] },
      { name: "books", at: [width * 0.13, board(1), 0] },
      { name: "vase-round", at: [-width * 0.3, board(1), 0] },
      { name: "succulent", at: [width * 0.28, board(2), 0] },
      { name: "books", at: [-width * 0.13, board(2), 0] },
      { name: "vase-jug", at: [-width * 0.28, board(3), 0] },
    ];
  },
  "media-unit": ({ width }) => [{ name: "succulent", at: [width * 0.44, MEDIA_CABINET, 0.1] }],
  dresser: ({ width, height }) => [
    { name: "vase-round", at: [-width * 0.32, height, 0] },
    { name: "succulent", at: [width * 0.3, height, 0.02] },
  ],
  nightstand: ({ height }) => [{ name: "succulent", at: [0.07, height, 0.02] }],
  desk: ({ width, height }) => [{ name: "succulent", at: [width * 0.4, height, -0.18] }],
  "wall-shelf": ({ width }) => [{ name: "vase-jug", at: [width * 0.3, 0.03, 0] }],
};
