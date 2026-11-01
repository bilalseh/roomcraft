import { Controller, useFormContext, useWatch } from "react-hook-form";
import { usePreferences } from "../../app/preferences";
import { LengthInput } from "../../components/LengthInput";
import { RoomPlan } from "../../components/RoomPlan";
import type { WizardValues } from "../wizardSchema";

const FIELDS = [
  { name: "width", label: "Width (west to east)" },
  { name: "depth", label: "Depth (north to south)" },
  { name: "height", label: "Ceiling height" },
] as const;

export function SizeStep() {
  const { control } = useFormContext<WizardValues>();
  const units = usePreferences((state) => state.units);
  const [width, depth, openings] = useWatch({ control, name: ["width", "depth", "openings"] });

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
      <div className="space-y-5">
        {FIELDS.map((field) => (
          <Controller
            key={field.name}
            control={control}
            name={field.name}
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <LengthInput
                id={field.name}
                label={field.label}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                units={units}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
        <p className="text-sm text-stone-500">Measure inside the walls.</p>
      </div>
      <RoomPlan room={{ width, depth, openings }} units={units} className="w-full" />
    </div>
  );
}
