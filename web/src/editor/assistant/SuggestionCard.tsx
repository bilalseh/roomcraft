import type { Suggestion } from "@roomcraft/shared";
import { useEditor } from "../state/useEditor";
import { describeOperation, explainRejection, pieceNames } from "./describe";

interface SuggestionCardProps {
  suggestion: Suggestion;
  /** "Option 2" when the assistant offered several layouts. */
  label?: string | undefined;
  thumbnail?: string | null | undefined;
  previewing: boolean;
  onPreview: () => void;
}

/** One suggested layout: what it does and why, with preview, apply and discard. */
export function SuggestionCard(props: SuggestionCardProps) {
  const { suggestion, label, thumbnail, previewing, onPreview } = props;
  const layout = useEditor((state) => state.history.present);
  const accept = useEditor((state) => state.acceptPreview);
  const discard = useEditor((state) => state.discardPreview);
  const names = pieceNames(layout, suggestion.operations);
  const empty = suggestion.operations.length === 0;

  return (
    <article
      aria-label={label ?? "Suggestion"}
      className={`rounded-lg border bg-white p-3 text-sm ${previewing ? "border-violet-500 ring-1 ring-violet-500" : "border-stone-200"}`}
    >
      {thumbnail && (
        <img src={thumbnail} alt="" className="mb-2 aspect-[8/5] w-full rounded object-cover" />
      )}
      {label && (
        <p className="text-xs font-medium tracking-wide text-violet-700 uppercase">{label}</p>
      )}
      <p className="text-stone-800">{suggestion.summary}</p>
      {!empty && (
        <ol className="mt-2 space-y-1.5">
          {suggestion.operations.map((operation, index) => (
            <li key={index}>
              <span className="font-medium">{describeOperation(operation, names)}</span>
              <span className="text-stone-600">: {operation.reason}</span>
            </li>
          ))}
        </ol>
      )}
      {suggestion.rejected.length > 0 && (
        <details className="mt-2 text-stone-600">
          <summary className="cursor-pointer text-xs">
            {suggestion.rejected.length}{" "}
            {suggestion.rejected.length === 1 ? "idea was" : "ideas were"} left out
          </summary>
          <ul className="mt-1 space-y-1 text-xs">
            {suggestion.rejected.map((rejected, index) => (
              <li key={index}>{explainRejection(rejected, names)}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {previewing ? (
          <>
            <button type="button" onClick={accept} className="btn h-9 btn-primary px-3 text-sm">
              Apply
            </button>
            <button type="button" onClick={discard} className="btn h-9 btn-secondary px-3 text-sm">
              Discard
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onPreview}
            disabled={empty}
            className="btn h-9 btn-secondary px-3 text-sm disabled:opacity-40"
          >
            Preview in 3D
          </button>
        )}
      </div>
    </article>
  );
}
