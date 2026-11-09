import type { CatalogItem } from "@roomcraft/shared";
import { Suspense } from "react";
import { Decor } from "./Decor";
import { ModelBoundary } from "./ModelBoundary";
import { MODELS } from "./models";
import { ScannedModel } from "./ScannedModel";
import { SCANS } from "./scans";

interface ItemModelProps {
  item: CatalogItem;
  color: string;
  /** Night lighting: lamps are on. */
  lit: boolean;
}

/**
 * A catalog piece and the decor on it. Pieces with a model file show the simple
 * shapes while it loads, and keep them if it cannot be loaded.
 */
export function ItemModel({ item, color, lit }: ItemModelProps) {
  const Shapes = MODELS[item.model];
  const size = { width: item.width, depth: item.depth, height: item.height };
  const shapes = <Shapes {...size} color={color} lit={lit} />;
  const scan = SCANS[item.id];

  return (
    <>
      {scan ? (
        <ModelBoundary fallback={shapes}>
          <Suspense fallback={shapes}>
            <ScannedModel scan={scan} {...size} color={color} lit={lit} />
          </Suspense>
        </ModelBoundary>
      ) : (
        shapes
      )}
      <Decor itemId={item.id} {...size} />
    </>
  );
}
