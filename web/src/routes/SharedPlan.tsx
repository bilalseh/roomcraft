import { Link } from "react-router";

export function SharedPlan() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Shared plan</h1>
      <p className="mt-4 text-stone-600">
        Shared plans open here as a read-only 3D view, no account needed.
      </p>
      <Link to="/new" className="mt-8 btn btn-primary">
        Plan your own room
      </Link>
    </div>
  );
}
