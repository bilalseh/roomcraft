import { useFormContext, useWatch } from "react-hook-form";
import { usePreferences } from "../../app/preferences";
import { FieldError } from "../../components/FieldError";
import { RoomPlan } from "../../components/RoomPlan";
import { formatUsd } from "../../domain/money";
import { formatDimensions, formatLength } from "../../domain/units";
import { ROOM_TYPE_LABELS, STYLE_LABELS } from "../../project/labels";
import { STEPS, type StepId, type WizardValues } from "../wizardSchema";

export function ReviewStep({ onEdit }: { onEdit: (step: StepId) => void }) {
  const { control, register, formState } = useFormContext<WizardValues>();
  const units = usePreferences((state) => state.units);
  const [type, style, width, depth, height, budget, openings] = useWatch({
    control,
    name: ["type", "style", "width", "depth", "height", "budget", "openings"],
  });
  const doors = openings.filter((opening) => opening.kind === "door").length;
  const windows = openings.length - doors;
  const nameError = formState.errors.name?.message;

  const rows: { step: StepId; value: string }[] = [
    { step: "type", value: type ? ROOM_TYPE_LABELS[type].label : "Not chosen" },
    {
      step: "size",
      value: `${formatDimensions(width, depth, units)}, ${formatLength(height, units)} ceiling`,
    },
    { step: "openings", value: `${plural(doors, "door")}, ${plural(windows, "window")}` },
    { step: "style", value: style ? STYLE_LABELS[style].label : "Not chosen" },
    { step: "budget", value: formatUsd(budget) },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-stone-800">
            Room name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="off"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "name-error" : undefined}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-teal-700 aria-invalid:border-red-600"
            {...register("name")}
          />
          <FieldError id="name-error" message={nameError} />
        </div>
        <dl className="divide-y divide-stone-200 rounded-xl border border-stone-300 bg-white">
          {rows.map((row) => (
            <div key={row.step} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <dt className="text-sm text-stone-500">{titleOf(row.step)}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
              <button
                type="button"
                onClick={() => {
                  onEdit(row.step);
                }}
                aria-label={`Change ${titleOf(row.step).toLowerCase()}`}
                className="rounded-md px-2 py-1 text-sm font-medium text-teal-800 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                Change
              </button>
            </div>
          ))}
        </dl>
      </div>
      <RoomPlan room={{ width, depth, openings }} units={units} className="w-full" />
    </div>
  );
}

function titleOf(step: StepId): string {
  return STEPS.find((candidate) => candidate.id === step)?.title ?? step;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
