import { TriangleAlert } from "lucide-react";

type Props = { message: string; onRetry: () => void };

function QueryError({ message, onRetry }: Props) {
  return (
    <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-6 py-10 text-center">
      <TriangleAlert size={32} strokeWidth={1.5} className="mx-auto text-red-500" />
      <p className="mt-3 text-sm font-medium text-slate-800">We couldn't load this.</p>
      <p className="mt-1 text-xs text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Try again
      </button>
    </div>
  );
}

export default QueryError;
