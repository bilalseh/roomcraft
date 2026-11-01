import { useFormContext } from "react-hook-form";
import { FieldError } from "../../components/FieldError";
import { formatUsd } from "../../domain/money";
import type { WizardValues } from "../wizardSchema";

const PRESETS = [1500, 3000, 6000, 10000];

/** The field holds a number by default and text once edited; "3,500" reads as 3500. */
function toAmount(value: number | string): number {
  if (typeof value === "number") return value;
  return value.trim() === "" ? NaN : Number(value.replaceAll(",", ""));
}

export function BudgetStep() {
  const { register, setValue, formState } = useFormContext<WizardValues>();
  const error = formState.errors.budget?.message;

  return (
    <div className="max-w-md space-y-5">
      <div>
        <label htmlFor="budget" className="mb-1 block text-sm font-medium text-stone-800">
          Furniture budget (USD)
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-500">
            $
          </span>
          <input
            id="budget"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "budget-error budget-hint" : "budget-hint"}
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pr-3 pl-7 tabular-nums focus-visible:outline-2 focus-visible:outline-teal-700 aria-invalid:border-red-600"
            {...register("budget", { setValueAs: toAmount })}
          />
        </div>
        <FieldError id="budget-error" message={error} />
        <p id="budget-hint" className="mt-2 text-sm text-stone-500">
          A running total keeps you on track as you furnish the room.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Common budgets">
        {PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700"
            onClick={() => {
              setValue("budget", amount, { shouldValidate: true, shouldDirty: true });
            }}
          >
            {formatUsd(amount)}
          </button>
        ))}
      </div>
    </div>
  );
}
