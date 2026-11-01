import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { FieldError } from "../components/FieldError";
import type { WizardValues } from "./wizardSchema";

export interface Choice<T extends string> {
  value: T;
  label: string;
  description: string;
  visual?: ReactNode;
}

interface ChoiceCardsProps<T extends string> {
  name: "type" | "style";
  legend: string;
  choices: Choice<T>[];
  onChoose?: (value: T) => void;
}

/** A radio group laid out as cards. Arrow keys move between options, as in any radio group. */
export function ChoiceCards<T extends string>({
  name,
  legend,
  choices,
  onChoose,
}: ChoiceCardsProps<T>) {
  const { register, formState } = useFormContext<WizardValues>();
  const field = register(name);
  const error = formState.errors[name]?.message;
  const errorId = `${name}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className="flex cursor-pointer gap-4 rounded-xl border border-stone-300 bg-white p-4 hover:border-stone-400 has-checked:border-teal-700 has-checked:ring-1 has-checked:ring-teal-700 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-700"
          >
            <input
              type="radio"
              value={choice.value}
              className="sr-only"
              {...field}
              onChange={(event) => {
                void field.onChange(event);
                onChoose?.(choice.value);
              }}
            />
            {choice.visual}
            <span>
              <span className="block font-medium">{choice.label}</span>
              <span className="mt-1 block text-sm text-stone-600">{choice.description}</span>
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
