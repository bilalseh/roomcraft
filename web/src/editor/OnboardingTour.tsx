import { useEffect, useId, useRef, useState } from "react";

const STEPS = [
  {
    target: "catalog",
    title: "Add furniture",
    text: "Pick pieces from the catalog. Each one lands in a free spot, at its real size.",
  },
  {
    target: "scene",
    title: "Arrange the room",
    text: "Drag pieces across the floor. Press R to turn one, the arrow keys to nudge it and Delete to remove it. Ctrl+Z undoes anything.",
  },
  {
    target: "assistant",
    title: "Ask the assistant",
    text: "Describe what you want, like “a reading corner under $400”. You preview its ideas in 3D before anything changes.",
  },
  {
    target: "budget",
    title: "Stay on budget",
    text: "The meter tracks the price range against your budget. The shopping list downloads as CSV or a PDF plan.",
  },
] as const;

const SEEN_KEY = "roomcraft:tour-seen";

function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "yes";
  } catch {
    return false;
  }
}

function rememberTour(): void {
  try {
    localStorage.setItem(SEEN_KEY, "yes");
  } catch {
    // Without storage the tour may show again next time; nothing breaks.
  }
}

/**
 * A short first-visit tour. It points at the real controls (marked with
 * data-tour) without blocking them, and is not shown again in this browser.
 */
export function OnboardingTour() {
  const [step, setStep] = useState<number | null>(() => (hasSeenTour() ? null : 0));
  const card = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const current = step === null ? null : STEPS[step];

  const finish = () => {
    rememberTour();
    setStep(null);
  };

  // Outline the control the step is about, and bring focus to the tour.
  useEffect(() => {
    if (!current) return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    target?.setAttribute("data-tour-active", "true");
    card.current?.focus();
    return () => {
      target?.removeAttribute("data-tour-active");
    };
  }, [current]);

  if (step === null || !current) return null;
  const last = step === STEPS.length - 1;

  return (
    <div
      ref={card}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") finish();
      }}
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm rounded-xl border border-violet-200 bg-white p-4 shadow-2xl focus:outline-none sm:right-6 sm:left-auto"
    >
      <p className="text-xs font-medium text-violet-700">
        Getting started · {step + 1} of {STEPS.length}
      </p>
      <h2 id={titleId} className="mt-1 font-semibold">
        {current.title}
      </h2>
      <p className="mt-1 text-sm text-stone-600">{current.text}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={finish}
          className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Skip the tour
        </button>
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setStep(step - 1);
              }}
              className="btn h-9 btn-secondary px-3 text-sm"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (last) finish();
              else setStep(step + 1);
            }}
            className="btn h-9 btn-primary px-3 text-sm"
          >
            {last ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
