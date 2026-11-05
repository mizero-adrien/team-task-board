type Props = {
  title: string;
  owner: string;
  description: string;
  routes: string[];
};

function PlaceholderPage({ title, owner, description, routes }: Props) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Coming soon</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-5">
        <p className="text-sm text-slate-700">
          Being built by <span className="font-semibold">{owner}</span>. Replace this file with the
          real page.
        </p>
        <p className="mt-4 text-xs font-medium text-slate-500">
          API routes this page will use (docs/api.md):
        </p>
        <ul className="mt-2 space-y-1">
          {routes.map((route) => (
            <li key={route}>
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{route}</code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default PlaceholderPage;
