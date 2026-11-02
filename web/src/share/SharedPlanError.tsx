import { Link } from "react-router";

export function SharedPlanError() {
  return (
    <div role="alert" className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">This shared plan is not available</h1>
      <p className="mt-4 text-stone-600">
        The link may be mistyped, or its owner stopped sharing it.
      </p>
      <Link to="/new" className="mt-8 btn btn-primary">
        Plan your own room
      </Link>
    </div>
  );
}
