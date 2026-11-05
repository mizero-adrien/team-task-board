import { Link } from "react-router";

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">That address doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Go home
      </Link>
    </section>
  );
}

export default NotFoundPage;
