import { catalogItem } from "../../domain/catalog";
import { useEditor } from "../state/useEditor";
import { FurnitureItem } from "./FurnitureItem";
import { LegInstances } from "./parts";

export function FurnitureLayer() {
  const furniture = useEditor((state) => state.history.present.furniture);
  const room = useEditor((state) => state.history.present.room);

  return (
    <LegInstances>
      {furniture.map((placement) => {
        const item = catalogItem(placement.itemId);
        return item ? (
          <FurnitureItem key={placement.id} placement={placement} item={item} room={room} />
        ) : null;
      })}
    </LegInstances>
  );
}
