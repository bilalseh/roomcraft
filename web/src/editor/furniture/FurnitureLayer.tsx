import { catalogItem } from "../../domain/catalog";
import { useClearanceIssues } from "../state/clearance";
import { useEditor } from "../state/useEditor";
import { FurnitureItem, RemovedGhost } from "./FurnitureItem";
import { LegInstances } from "./parts";

export function FurnitureLayer() {
  const layout = useEditor((state) => state.preview?.layout ?? state.history.present);
  const preview = useEditor((state) => state.preview);
  const { furniture, room } = layout;
  const night = useEditor((state) => state.lighting === "night");
  // A photo shows the room only: no warning or suggestion outlines.
  const photographing = useEditor((state) => state.photo?.status === "rendering");
  const issues = useClearanceIssues();
  const warned = new Set(photographing ? [] : issues.map((issue) => issue.itemId));

  return (
    <LegInstances separate={photographing}>
      {furniture.map((placement) => {
        const item = catalogItem(placement.itemId);
        return item ? (
          <FurnitureItem
            key={placement.id}
            placement={placement}
            item={item}
            room={room}
            lit={night}
            warned={warned.has(placement.id)}
            suggested={
              !photographing &&
              preview !== null &&
              (preview.added.has(placement.id) || preview.changed.has(placement.id))
            }
          />
        ) : null;
      })}
      {!photographing &&
        preview?.removed.map((placement) => {
          const item = catalogItem(placement.itemId);
          return item ? (
            <RemovedGhost key={placement.id} placement={placement} item={item} />
          ) : null;
        })}
    </LegInstances>
  );
}
