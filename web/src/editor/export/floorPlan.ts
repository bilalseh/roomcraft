import type { jsPDF } from "jspdf";
import { catalogItem } from "../../domain/catalog";
import { doorSwing } from "../../domain/clearance";
import type { Layout } from "../../domain/layout";
import { corners, footprint } from "../../domain/placement";
import { formatLength, type Units } from "../../domain/units";
import { pointOnWall, WALL_THICKNESS, wallFrame, type Vec2 } from "../../domain/walls";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const LABEL_SIZE = 6;
const LINE_HEIGHT = 2.6;

/**
 * Names a piece in the middle of its footprint, on two lines if it must, and
 * leaves it unnamed when the name would spill over its edges.
 */
function label(doc: jsPDF, name: string, [cx, cy]: Vec2, shape: Vec2[], scale: number) {
  const xs = shape.map(([x]) => x);
  const zs = shape.map(([, z]) => z);
  const width = (Math.max(...xs) - Math.min(...xs)) * scale - 1.5;
  const height = (Math.max(...zs) - Math.min(...zs)) * scale - 1;
  doc.setFontSize(LABEL_SIZE);
  // jsPDF types this as any; it is an array of lines.
  const split: unknown = doc.splitTextToSize(name, width);
  const lines = Array.isArray(split)
    ? split.filter((line): line is string => typeof line === "string")
    : [name];
  const fits =
    lines.length * LINE_HEIGHT <= height && lines.every((line) => doc.getTextWidth(line) <= width);
  if (!fits) return;
  doc.setTextColor("#292524");
  doc.text(lines, cx, cy - ((lines.length - 1) * LINE_HEIGHT) / 2, {
    align: "center",
    baseline: "middle",
    lineHeightFactor: LINE_HEIGHT / (LABEL_SIZE * 0.3528),
  });
}

/** Room in metres around the plan, for the dimension labels. */
const MARGIN = 0.8;
const LAYER_ORDER = { rug: 0, floor: 1, wall: 2, ceiling: 3 } as const;

/**
 * Draws a measured, top-down plan of the room into `box` (millimetres on the page):
 * walls, doors with their swings, windows, and every piece of furniture, labelled.
 */
export function drawFloorPlan(doc: jsPDF, layout: Layout, units: Units, box: Box): void {
  const { room } = layout;
  const scale = Math.min(
    box.width / (room.width + 2 * MARGIN),
    box.height / (room.depth + 2 * MARGIN),
  );
  const left = box.x + (box.width - room.width * scale) / 2;
  const top = box.y + (box.height - room.depth * scale) / 2;
  const at = ([x, z]: Vec2): Vec2 => [left + x * scale, top + z * scale];
  const polygon = (points: Vec2[], style: "F" | "S" | "FD") => {
    const [first, ...rest] = points.map(at);
    if (!first) return;
    const steps = rest.map(([x, y], index) => {
      const [px, py] = index === 0 ? first : (rest[index - 1] ?? first);
      return [x - px, y - py];
    });
    doc.lines(steps, first[0], first[1], [1, 1], style, true);
  };
  const t = WALL_THICKNESS;

  // Walls as a thick dark band, then the floor inside it.
  doc.setFillColor("#44403c");
  doc.rect(
    left - t * scale,
    top - t * scale,
    (room.width + 2 * t) * scale,
    (room.depth + 2 * t) * scale,
    "F",
  );
  doc.setFillColor("#ffffff");
  doc.rect(left, top, room.width * scale, room.depth * scale, "F");

  for (const opening of room.openings) {
    const frame = wallFrame(room, opening.wall);
    const start = opening.offset;
    const end = opening.offset + opening.width;
    doc.setFillColor("#ffffff");
    polygon(
      [
        pointOnWall(frame, start, -t),
        pointOnWall(frame, end, -t),
        pointOnWall(frame, end, 0),
        pointOnWall(frame, start, 0),
      ],
      "F",
    );
    doc.setDrawColor("#44403c");
    doc.setLineWidth(0.25);
    if (opening.kind === "window") {
      const [x1, y1] = at(pointOnWall(frame, start, -t / 2));
      const [x2, y2] = at(pointOnWall(frame, end, -t / 2));
      doc.line(x1, y1, x2, y2);
    } else {
      const [hinge, ...arc] = doorSwing(room, opening);
      const leaf = arc.at(-1);
      if (hinge && leaf) {
        const [hx, hy] = at(hinge);
        const [lx, ly] = at(leaf);
        doc.line(hx, hy, lx, ly);
      }
      doc.setLineDashPattern([0.8, 0.6], 0);
      const points = arc.map(at);
      points.slice(1).forEach(([x, y], index) => {
        const [px, py] = points[index] ?? [x, y];
        doc.line(px, py, x, y);
      });
      doc.setLineDashPattern([], 0);
    }
  }

  const pieces = layout.furniture
    .flatMap((placement) => {
      const item = catalogItem(placement.itemId);
      return item && item.layer !== "ceiling" ? [{ placement, item }] : [];
    })
    .sort((a, b) => LAYER_ORDER[a.item.layer] - LAYER_ORDER[b.item.layer]);

  doc.setLineWidth(0.2);
  for (const { placement, item } of pieces) {
    const shape = corners(footprint(placement, item));
    doc.setFillColor(
      item.layer === "rug" ? "#efe9df" : item.layer === "wall" ? "#a8a29e" : "#e7e5e4",
    );
    doc.setDrawColor(item.layer === "rug" ? "#d6cfc4" : "#57534e");
    polygon(shape, "FD");
    if (item.layer === "floor") label(doc, item.name, at([placement.x, placement.z]), shape, scale);
  }

  // Overall dimensions outside the walls.
  doc.setFontSize(8);
  doc.setTextColor("#57534e");
  doc.setDrawColor("#a8a29e");
  const above = top - (t + 0.35) * scale;
  doc.line(left, above, left + room.width * scale, above);
  doc.text(formatLength(room.width, units), left + (room.width * scale) / 2, above - 1.5, {
    align: "center",
  });
  const beside = left - (t + 0.35) * scale;
  doc.line(beside, top, beside, top + room.depth * scale);
  doc.text(formatLength(room.depth, units), beside - 1.5, top + (room.depth * scale) / 2, {
    align: "center",
    angle: 90,
  });
}
