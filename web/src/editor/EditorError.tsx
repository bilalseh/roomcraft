import { isRouteErrorResponse, Link, useRevalidator, useRouteError } from "react-router";
import { SignInButton } from "../components/SignInButton";

export function EditorError() {
  const error = useRouteError();
  const { revalidate } = useRevalidator();
  const status = isRouteErrorResponse(error) ? error.status : null;

  if (status === 401) {
    return (
      <Message title="Sign in to open this room">
        <p className="mt-4 text-stone-600">Rooms belong to the account that created them.</p>
        <div className="mt-8">
          <SignInButton
            onSignedIn={() => {
              void revalidate();
            }}
          />
        </div>
      </Message>
    );
  }

  return (
    <Message title={status === 404 ? "We couldn't find that room" : "The editor hit a problem"}>
      <p className="mt-4 text-stone-600">
        {status === 404
          ? "It may have been deleted, or it belongs to another account."
          : "Reloading the page usually fixes it."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/projects" className="btn btn-primary">
          Go to my rooms
        </Link>
        <Link to="/demo" className="btn btn-secondary">
          Open the demo room
        </Link>
      </div>
    </Message>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="alert" className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}
