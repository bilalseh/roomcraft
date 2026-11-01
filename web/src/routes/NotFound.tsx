import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 text-stone-600">This page does not exist, or the link is out of date.</p>
      <Link to="/" className="mt-8 btn btn-primary">
        Back to the home page
      </Link>
    </div>
  );
}
