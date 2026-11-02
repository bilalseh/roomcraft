import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { SignInButton } from "../components/SignInButton";
import { signOut, useAccount, watchAccount } from "../data/auth";

const LINK =
  "rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-teal-700 aria-[current=page]:text-teal-800";

/** "My rooms" and who is signed in. Guests are invited to keep their rooms with Google. */
export function AccountMenu() {
  const { status, account } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    watchAccount();
  }, []);

  if (status === "loading") return null;
  if (!account) {
    return <SignInButton label="Sign in" className={LINK} />;
  }

  return (
    <>
      <NavLink to="/projects" className={LINK}>
        My rooms
      </NavLink>
      {account.anonymous ? (
        <SignInButton label="Save with Google" className={LINK} />
      ) : (
        <button
          type="button"
          className={LINK}
          title={account.email ?? undefined}
          onClick={() => {
            void signOut().then(() => navigate("/"));
          }}
        >
          Sign out{account.name ? ` (${account.name.split(" ")[0] ?? account.name})` : ""}
        </button>
      )}
    </>
  );
}
