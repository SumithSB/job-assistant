import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { api, ApiError } from "@/api/client";
import type { ApplicationRow } from "@/api/types";
import { AppShell } from "@/components/layout/AppShell";
import { AuthenticatedNav } from "@/components/layout/AuthenticatedNav";

const STATUSES = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "accepted",
] as const;

function statusLabel(s: string): string {
  return s.replace(/_/g, " ");
}

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.applications.list(),
  });

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

  const jobById = useMemo(() => {
    const m = new Map<string, { title: string; company: string }>();
    jobs?.forEach((j) => m.set(j.id, { title: j.title, company: j.company }));
    return m;
  }, [jobs]);

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.applications.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      setMsg("Updated.");
    },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.applications.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      setMsg("Application removed.");
    },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : "Delete failed"),
  });

  return (
    <AppShell>
      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AuthenticatedNav />

        <div className="mb-8">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-amber-600/90">
            Pipeline
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-slate-50">
            Applications
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Move each role through your funnel. Open a job for fit scores, resume variant, and prep
            roadmap.
          </p>
        </div>

        {msg ? (
          <div
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90"
            role="status"
          >
            <span>{msg}</span>
            <button
              type="button"
              className="flex-shrink-0 rounded text-amber-500/80 hover:text-amber-300"
              aria-label="Dismiss"
              onClick={() => setMsg(null)}
            >
              ×
            </button>
          </div>
        ) : null}

        <ul className="space-y-4">
          {rows?.map((a: ApplicationRow) => {
            const meta = jobById.get(a.jobId);
            return (
              <li
                key={a.id}
                data-testid="application-row"
                data-status={a.status}
                className="ui-card border-slate-800/90 p-5 transition hover:border-slate-700"
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      to={`/jobs/${a.jobId}`}
                      className="font-display text-lg font-semibold text-slate-50 underline-offset-2 hover:text-amber-200/95 hover:underline"
                    >
                      {meta ? `${meta.title}` : `Job ${a.jobId.slice(0, 8)}…`}
                    </Link>
                    {meta ? (
                      <p className="text-sm text-slate-500">{meta.company}</p>
                    ) : (
                      <p className="text-xs text-slate-600">Detail page has full title if synced.</p>
                    )}
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-amber-900/45 bg-amber-950/35 px-3 py-1 text-xs font-medium capitalize text-amber-200/90">
                    {statusLabel(a.status)}
                  </span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <label className="ui-label mb-2 block">Status</label>
                    <select
                      value={a.status}
                      onChange={(e) => update.mutate({ id: a.id, status: e.target.value })}
                      className="ui-input max-w-md py-2.5"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="ui-pill border-red-900/50 text-red-300/95 hover:border-red-700/60 hover:bg-red-950/40"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (
                        typeof window !== "undefined" &&
                        !window.confirm(
                          "Remove this application from your pipeline? The saved job and analysis stay in your library.",
                        )
                      ) {
                        return;
                      }
                      remove.mutate(a.id);
                    }}
                  >
                    Remove from pipeline
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {!rows?.length ? (
          <p className="rounded-2xl border border-dashed border-slate-800 py-14 text-center text-sm text-slate-500">
            No applications yet. From the dashboard, add jobs to your pipeline or track from a job
            detail page.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
