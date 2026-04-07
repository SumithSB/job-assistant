import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Global backdrop + stacking context so every route shares the same atmosphere as the dashboard.
 */
export function AppShell({ children, className = "" }: AppShellProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(180,120,60,0.12),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_50%,rgba(52,100,95,0.08),transparent)]"
      />
      {children}
    </div>
  );
}
