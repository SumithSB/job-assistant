import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <AppShell>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-14 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-amber-600/90">
              Job assistant
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          <div className="ui-card border-amber-950/25 bg-slate-900/55 p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
