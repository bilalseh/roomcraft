import { useId } from "react";
import type { Swatch } from "../domain/materials";

interface SwatchPickerProps {
  legend: string;
  swatches: Swatch[];
  value: string | null;
  onChange: (color: string) => void;
}

/** A row of colour swatches as a radio group; each swatch is named for screen readers. */
export function SwatchPicker({ legend, swatches, value, onChange }: SwatchPickerProps) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-stone-800">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => (
          <label key={swatch.color} title={swatch.name} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={swatch.color}
              checked={value === swatch.color}
              onChange={() => {
                onChange(swatch.color);
              }}
              aria-label={swatch.name}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="block size-8 rounded-full border border-stone-300 shadow-inner peer-checked:ring-2 peer-checked:ring-teal-700 peer-checked:ring-offset-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal-700"
              style={{ backgroundColor: swatch.color }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
