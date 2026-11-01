import { Controller, useFormContext, useWatch } from "react-hook-form";
import { usePreferences } from "../../app/preferences";
import { LengthInput } from "../../components/LengthInput";
import { WALLS } from "../../domain/room";
import { OPENING_KIND_LABELS, WALL_LABELS, WALL_START_CORNERS } from "../../project/labels";
import type { WizardValues } from "../wizardSchema";

type LengthField = "offset" | "width" | "height" | "sill";

interface OpeningCardProps {
  index: number;
  /** 1 for the first door, 2 for the second, and so on. */
  ordinal: number;
  onRemove: () => void;
}

export function OpeningCard({ index, ordinal, onRemove }: OpeningCardProps) {
  const { control, register } = useFormContext<WizardValues>();
  const units = usePreferences((state) => state.units);
  const opening = useWatch({ control, name: `openings.${index}` });
  const title = `${OPENING_KIND_LABELS[opening.kind]} ${ordinal}`;
  const id = (field: string) => `opening-${opening.id}-${field}`;

  const lengths: { field: LengthField; label: string }[] = [
    { field: "offset", label: `From the ${WALL_START_CORNERS[opening.wall]}` },
    { field: "width", label: "Width" },
    { field: "height", label: "Height" },
    ...(opening.kind === "window" ? [{ field: "sill" as const, label: "Sill height" }] : []),
  ];

  return (
    <section aria-label={title} className="rounded-xl border border-stone-300 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-medium">{title}</h2>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title.toLowerCase()}`}
          className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Remove
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id("wall")} className="mb-1 block text-sm font-medium text-stone-800">
            Wall
          </label>
          <select
            id={id("wall")}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-teal-700"
            {...register(`openings.${index}.wall`)}
          >
            {WALLS.map((wall) => (
              <option key={wall} value={wall}>
                {WALL_LABELS[wall]}
              </option>
            ))}
          </select>
        </div>
        {lengths.map(({ field, label }) => (
          <Controller
            key={field}
            control={control}
            name={`openings.${index}.${field}`}
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <LengthInput
                id={id(field)}
                label={label}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                units={units}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
      </div>
    </section>
  );
}
