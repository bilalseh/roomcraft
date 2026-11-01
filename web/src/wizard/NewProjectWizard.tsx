import { toNestErrors } from "@hookform/resolvers";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, type FieldError, type Resolver } from "react-hook-form";
import { useNavigate } from "react-router";
import { usePreferences } from "../app/preferences";
import { UnitsToggle } from "../components/UnitsToggle";
import { createProject } from "../domain/project";
import type { Units } from "../domain/units";
import { saveProject } from "../project/localProjects";
import { BudgetStep } from "./steps/BudgetStep";
import { OpeningsStep } from "./steps/OpeningsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { SizeStep } from "./steps/SizeStep";
import { RoomTypeStep, StyleStep } from "./steps/TypeAndStyleSteps";
import {
  DEFAULT_VALUES,
  STEP_FIELDS,
  STEPS,
  stepSchema,
  type StepId,
  type WizardValues,
} from "./wizardSchema";

interface ResolverContext {
  step: StepId;
  units: Units;
}

// Validates against the current step's schema, in the units the person is reading.
const resolver: Resolver<WizardValues, ResolverContext> = (values, context, options) => {
  const { step, units } = context ?? { step: "review", units: "metric" };
  const result = stepSchema(step, units).safeParse(values);
  if (result.success) return { values, errors: {} };

  const errors: Record<string, FieldError> = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join(".")] ??= { type: issue.code, message: issue.message };
  }
  return { values: {}, errors: toNestErrors(errors, options) };
};

export function NewProjectWizard() {
  const navigate = useNavigate();
  const units = usePreferences((state) => state.units);
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex] ?? STEPS[0];
  const isLast = stepIndex === STEPS.length - 1;

  const form = useForm<WizardValues, ResolverContext>({
    defaultValues: DEFAULT_VALUES,
    resolver,
    context: { step: step.id, units },
    mode: "onTouched",
  });

  // Move focus to the new question so keyboard and screen reader users start there.
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [stepIndex]);

  // Messages mention lengths, so re-check visible errors in the new units.
  useEffect(() => {
    const invalid = Object.keys(form.formState.errors) as (keyof WizardValues)[];
    if (invalid.length > 0) void form.trigger(invalid);
    // Only a units change should re-run this, not every new error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  const goTo = (id: StepId) => {
    setStepIndex(STEPS.findIndex((candidate) => candidate.id === id));
  };

  const next = async () => {
    if (await form.trigger(STEP_FIELDS[step.id], { shouldFocus: true })) {
      setStepIndex((index) => index + 1);
    }
  };

  const create = (values: WizardValues) => {
    if (values.type === "" || values.style === "") return;
    const { name, type, style, ...room } = values;
    const project = createProject(crypto.randomUUID(), name, { ...room, type, style }, new Date());
    saveProject(project);
    void navigate(`/p/${project.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Step {stepIndex + 1} of {STEPS.length} · {step.title}
        </p>
        <UnitsToggle />
      </div>
      <div
        role="progressbar"
        aria-label="Room setup progress"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={stepIndex + 1}
        aria-valuetext={`Step ${stepIndex + 1} of ${STEPS.length}: ${step.title}`}
        className="mb-10 h-1.5 overflow-hidden rounded-full bg-stone-200"
      >
        <div
          className="h-full rounded-full bg-teal-700 transition-[width] motion-reduce:transition-none"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (isLast) void form.handleSubmit(create)(event);
            else void next();
          }}
        >
          <h1
            ref={heading}
            tabIndex={-1}
            className="mb-8 text-3xl font-semibold tracking-tight focus:outline-none"
          >
            {step.question}
          </h1>

          {step.id === "type" && <RoomTypeStep />}
          {step.id === "size" && <SizeStep />}
          {step.id === "openings" && <OpeningsStep />}
          {step.id === "style" && <StyleStep />}
          {step.id === "budget" && <BudgetStep />}
          {step.id === "review" && <ReviewStep onEdit={goTo} />}

          <div className="mt-10 flex items-center justify-between border-t border-stone-200 pt-6">
            {stepIndex > 0 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStepIndex((index) => index - 1);
                }}
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" className="btn btn-primary">
              {isLast ? "Create room" : "Next"}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
