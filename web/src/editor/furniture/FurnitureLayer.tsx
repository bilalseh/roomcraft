import { catalogItem } from "../../domain/catalog";
import { useClearanceIssues } from "../state/clearance";
import { useEditor } from "../state/useEditor";
import { FurnitureItem } from "./FurnitureItem";
import { LegInstances } from "./parts";

export function FurnitureLayer() {
  const furniture = useEditor((state) => state.history.present.furniture);
  const room = useEditor((state) => state.history.present.room);
  const night = useEditor((state) => state.lighting === "night");
  const warned = new Set(useClearanceIssues().map((issue) => issue.itemId));

  return (
    <LegInstances>
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
          />
        ) : null;
      })}
    </LegInstances>
  );
}
