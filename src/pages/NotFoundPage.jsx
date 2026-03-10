import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h1 className="text-3xl font-black text-slate-900">404</h1>
      <p className="mt-1 text-slate-600">This page does not exist.</p>
      <Link
        to="/"
        className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Go Home
      </Link>
    </section>
  );
}
