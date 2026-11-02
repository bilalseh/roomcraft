import type { FloorMaterial } from "@roomcraft/shared";
import { SwatchPicker } from "../../components/SwatchPicker";
import { FLOOR_MATERIALS, FLOOR_SWATCHES, WALL_SWATCHES } from "../../domain/materials";
import { useEditor } from "../state/useEditor";

const FLOOR_LABELS: Record<FloorMaterial, string> = {
  wood: "Wood",
  tile: "Tile",
  carpet: "Carpet",
};

/** Floor material and colour, and wall paint. Every change can be undone. */
export function FinishesPanel() {
  const materials = useEditor((state) => state.history.present.materials);
  const setMaterials = useEditor((state) => state.setMaterials);

  // A new material starts in its first colour, unless the current colour also suits it.
  const chooseFloor = (floor: FloorMaterial) => {
    const swatches = FLOOR_SWATCHES[floor];
    const keeps = swatches.some((swatch) => swatch.color === materials.floorColor);
    setMaterials({
      floor,
      floorColor: keeps ? materials.floorColor : (swatches[0]?.color ?? materials.floorColor),
    });
  };

  return (
    <div className="space-y-6 p-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-800">Floor</legend>
        <div className="grid grid-cols-3 gap-2">
          {FLOOR_MATERIALS.map((floor) => (
            <label key={floor} className="cursor-pointer">
              <input
                type="radio"
                name="floor-material"
                value={floor}
                checked={materials.floor === floor}
                onChange={() => {
                  chooseFloor(floor);
                }}
                className="peer sr-only"
              />
              <span className="block rounded-lg border border-stone-300 bg-white px-3 py-2 text-center text-sm peer-checked:border-teal-700 peer-checked:bg-teal-50 peer-checked:font-medium peer-checked:text-teal-900 peer-focus-visible:outline-2 peer-focus-visible:outline-teal-700">
                {FLOOR_LABELS[floor]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <SwatchPicker
        legend="Floor colour"
        swatches={FLOOR_SWATCHES[materials.floor]}
        value={materials.floorColor}
        onChange={(floorColor) => {
          setMaterials({ floorColor });
        }}
      />
      <SwatchPicker
        legend="Wall paint"
        swatches={WALL_SWATCHES}
        value={materials.wallColor}
        onChange={(wallColor) => {
          setMaterials({ wallColor });
        }}
      />
    </div>
  );
}
