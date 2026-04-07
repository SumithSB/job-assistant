import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

type AuthenticatedNavProps = {
  showBack?: boolean;
  onBack?: () => void;
};

export function AuthenticatedNav({ showBack, onBack }: AuthenticatedNavProps) {
  const setToken = useAuthStore((s) => s.setToken);

  return (
    <header className="mb-10 flex flex-col gap-4 border-b border-amber-950/40 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mr-1 rounded-lg px-2 py-1.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
          >
            ← Back
          </button>
        ) : null}
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-slate-100 sm:text-xl"
        >
          Job assistant
        </Link>
        <span className="hidden text-slate-700 sm:inline" aria-hidden>
          ·
        </span>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Primary">
          <Link
            to="/"
            className="rounded-lg px-3 py-1.5 text-slate-400 transition hover:bg-slate-900/80 hover:text-amber-200/95"
          >
            Dashboard
          </Link>
          <Link
            to="/applications"
            className="rounded-lg px-3 py-1.5 text-slate-400 transition hover:bg-slate-900/80 hover:text-amber-200/95"
          >
            Applications
          </Link>
        </nav>
      </div>
      <button
        type="button"
        onClick={() => setToken(null)}
        className="self-start rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-300 sm:self-auto"
      >
        Log out
      </button>
    </header>
  );
}
