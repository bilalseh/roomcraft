import type { Suggestion } from "@roomcraft/shared";
import { useRef, useState } from "react";
import { useApiHealth } from "../../app/useApiHealth";
import { AssistantError, askAssistant } from "../../data/assistant";
import { applyOperations } from "../../domain/operations";
import { useEditor, useEditorStore } from "../state/useEditor";
import { SuggestionCard } from "./SuggestionCard";

const EXAMPLES = [
  "Make this feel bigger",
  "Add a reading corner under $400",
  "Arrange for 6 people to watch TV",
];

interface Exchange {
  id: number;
  prompt: string;
  status: "pending" | "done" | "error";
  suggestions: Suggestion[];
  thumbnails: (string | null)[];
  error?: string;
}

const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

/** Chat with the layout assistant. Its ideas are previewed in 3D before anything changes. */
export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const store = useEditorStore();
  const health = useApiHealth();
  const preview = useEditor((state) => state.preview);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [prompt, setPrompt] = useState("");
  const [layouts, setLayouts] = useState<1 | 3>(1);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState<{ exchange: number; index: number } | null>(null);
  const nextId = useRef(0);

  // Applying or discarding elsewhere (a button, Escape, undo) ends the preview here too.
  if (!preview && previewing) setPreviewing(null);

  const online = health.state === "online";
  const busy = exchanges.some((exchange) => exchange.status === "pending");

  const update = (id: number, change: Partial<Exchange>) => {
    setExchanges((list) =>
      list.map((exchange) => (exchange.id === id ? { ...exchange, ...change } : exchange)),
    );
  };

  const layoutFor = (suggestion: Suggestion) =>
    applyOperations(store.getState().history.present, suggestion.operations).layout;

  // Shows each option in the scene long enough to photograph it, then restores the room.
  const photograph = async (suggestions: Suggestion[]) => {
    const images: (string | null)[] = [];
    for (const suggestion of suggestions) {
      store.getState().showPreview(layoutFor(suggestion));
      await nextFrame();
      await nextFrame();
      images.push(store.getState().captureThumbnail?.() ?? null);
    }
    store.getState().discardPreview();
    return images;
  };

  const ask = async (text: string) => {
    const id = nextId.current++;
    const options = layouts;
    setPrompt("");
    setExchanges((list) => [
      ...list,
      { id, prompt: text, status: "pending", suggestions: [], thumbnails: [] },
    ]);
    const { room, furniture, materials } = store.getState().history.present;
    try {
      const response = await askAssistant({ prompt: text, room, furniture, materials, options });
      setRemaining(response.remainingToday);
      const thumbnails =
        response.suggestions.length > 1 ? await photograph(response.suggestions) : [];
      update(id, { status: "done", suggestions: response.suggestions, thumbnails });
    } catch (error) {
      const message = error instanceof AssistantError ? error.message : "Something went wrong.";
      update(id, { status: "error", error: message });
    }
  };

  const show = (exchange: number, index: number, suggestion: Suggestion) => {
    store.getState().showPreview(layoutFor(suggestion));
    setPreviewing({ exchange, index });
  };

  const send = () => {
    const text = prompt.trim();
    if (text && online && !busy) void ask(text);
  };

  return (
    <section aria-label="Layout assistant" className="flex h-full flex-col bg-stone-50">
      <header className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3">
        <div>
          <h2 className="font-semibold">Layout assistant</h2>
          <p className="text-xs text-stone-600">
            Its ideas are checked against your walls, doors and budget, and you preview them before
            anything changes.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the assistant"
          className="rounded-md px-2 text-xl leading-none text-stone-500 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          ×
        </button>
      </header>

      {!online && (
        <p
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"
        >
          {health.state === "offline"
            ? "The assistant cannot be reached right now. Please try again later."
            : "Waking up the assistant… The free server sleeps when idle and takes about a minute to start."}
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {exchanges.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-stone-600">Try asking:</p>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={!online || busy}
                onClick={() => void ask(example)}
                className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm hover:border-violet-400 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:opacity-50"
              >
                “{example}”
              </button>
            ))}
          </div>
        )}
        {exchanges.map((exchange) => (
          <div key={exchange.id} className="space-y-2">
            <p className="ml-8 rounded-lg bg-teal-700 px-3 py-2 text-sm text-white">
              {exchange.prompt}
            </p>
            {exchange.status === "pending" && <p className="text-sm text-stone-500">Thinking…</p>}
            {exchange.status === "error" && (
              <p role="alert" className="text-sm text-red-700">
                {exchange.error}
              </p>
            )}
            {exchange.suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                label={exchange.suggestions.length > 1 ? `Option ${index + 1}` : undefined}
                thumbnail={exchange.thumbnails[index]}
                previewing={previewing?.exchange === exchange.id && previewing.index === index}
                onPreview={() => {
                  show(exchange.id, index, suggestion);
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <form
        className="space-y-2 border-t border-stone-200 bg-white p-3"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label htmlFor="assistant-prompt" className="sr-only">
          Ask the assistant
        </label>
        <textarea
          id="assistant-prompt"
          rows={2}
          maxLength={500}
          value={prompt}
          placeholder="Ask for a change, like “Add a reading corner under $400”"
          onChange={(event) => {
            setPrompt(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-teal-700"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              checked={layouts === 3}
              onChange={(event) => {
                setLayouts(event.target.checked ? 3 : 1);
              }}
            />
            Show 3 layouts
          </label>
          <button
            type="submit"
            disabled={!online || busy || prompt.trim() === ""}
            className="btn h-9 btn-primary px-4 text-sm"
          >
            {busy ? "Thinking…" : "Ask"}
          </button>
        </div>
        {remaining !== null && (
          <p className="text-xs text-stone-500">
            {remaining} {remaining === 1 ? "request" : "requests"} left today
          </p>
        )}
      </form>
    </section>
  );
}
