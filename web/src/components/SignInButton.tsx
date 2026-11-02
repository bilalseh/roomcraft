import { useState } from "react";
import { signInWithGoogle } from "../data/auth";

/** Signs in with Google; a cancelled popup is not an error worth showing. */
export function SignInButton({
  label = "Sign in with Google",
  className = "btn btn-primary",
  onSignedIn,
}: {
  label?: string;
  className?: string;
  onSignedIn?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await signInWithGoogle();
      onSignedIn?.();
    } catch (error) {
      const cancelled =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error.code === "auth/popup-closed-by-user" ||
          error.code === "auth/cancelled-popup-request");
      setFailed(!cancelled);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={className} disabled={busy} onClick={() => void signIn()}>
        {busy ? "Signing in…" : label}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Signing in did not work. Please try again.
        </p>
      )}
    </>
  );
}
