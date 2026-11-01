import { useEffect } from "react";
import { useEditor } from "../state/useEditor";

const VISIBLE_MS = 4000;

/** Explains why an action was refused, then fades away. */
export function NoticeToast() {
  const notice = useEditor((state) => state.notice);
  const dismiss = useEditor((state) => state.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [notice, dismiss]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none">
      {notice && (
        <p
          key={notice.key}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
