import { useState } from "react";
import { fromFeetAndInches, toFeetAndInches, type Units } from "../domain/units";
import { FieldError } from "./FieldError";

interface LengthInputProps {
  id: string;
  label: string;
  /** Metres; NaN while the field is empty or unreadable. */
  value: number;
  onChange: (metres: number) => void;
  onBlur: () => void;
  units: Units;
  error?: string | undefined;
}

/** A length field that shows metres, or feet and inches, and always reports metres. */
export function LengthInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  units,
  error,
}: LengthInputProps) {
  const errorId = `${id}-error`;
  const shared = {
    onBlur,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };
  // In imperial, an empty part counts as zero: "12 ft" with no inches is a whole length.
  const parts = Number.isNaN(value) ? { feet: 0, inches: 0 } : toFeetAndInches(value);

  return (
    <div>
      <span id={`${id}-label`} className="mb-1 block text-sm font-medium text-stone-800">
        {label}
      </span>
      {units === "metric" ? (
        <Suffixed suffix="m">
          <NumberText
            id={id}
            aria-labelledby={`${id}-label`}
            number={value}
            format={(metres) => String(Number(metres.toFixed(2)))}
            onNumber={onChange}
            {...shared}
          />
        </Suffixed>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Suffixed suffix="ft">
            <NumberText
              id={id}
              aria-label={`${label}, feet`}
              number={parts.feet}
              format={String}
              onNumber={(feet) => {
                onChange(fromFeetAndInches({ ...parts, feet: Number.isNaN(feet) ? 0 : feet }));
              }}
              {...shared}
            />
          </Suffixed>
          <Suffixed suffix="in">
            <NumberText
              id={`${id}-inches`}
              aria-label={`${label}, inches`}
              number={parts.inches}
              format={String}
              onNumber={(inches) => {
                onChange(
                  fromFeetAndInches({ ...parts, inches: Number.isNaN(inches) ? 0 : inches }),
                );
              }}
              {...shared}
            />
          </Suffixed>
        </div>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function Suffixed({ suffix, children }: { suffix: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-500">
        {suffix}
      </span>
    </div>
  );
}

interface NumberTextProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  number: number;
  format: (number: number) => string;
  onNumber: (number: number) => void;
}

const parse = (text: string) => (text.trim() === "" ? NaN : Number(text));

/**
 * Keeps the text the user typed ("3." or "3.40" mid-edit) while it still reads as
 * the current number, and replaces it when the number changes from outside.
 */
function NumberText({ number, format, onNumber, ...props }: NumberTextProps) {
  const show = (n: number) => (Number.isNaN(n) ? "" : format(n));
  const [text, setText] = useState(() => show(number));
  if (show(parse(text)) !== show(number)) setText(show(number));

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 pr-10 tabular-nums focus-visible:outline-2 focus-visible:outline-teal-700 aria-invalid:border-red-600"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onNumber(parse(event.target.value));
      }}
    />
  );
}
