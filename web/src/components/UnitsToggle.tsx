import { usePreferences } from "../app/preferences";
import type { Units } from "../domain/units";

const OPTIONS: { value: Units; label: string }[] = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

export function UnitsToggle() {
  const units = usePreferences((state) => state.units);
  const setUnits = usePreferences((state) => state.setUnits);

  return (
    <fieldset className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 text-sm">
      <legend className="sr-only">Units</legend>
      {OPTIONS.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input
            type="radio"
            name="units"
            value={option.value}
            checked={units === option.value}
            onChange={() => {
              setUnits(option.value);
            }}
            className="peer sr-only"
          />
          <span className="block rounded-md px-3 py-1 text-stone-600 peer-checked:bg-teal-700 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-teal-700">
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
