import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { AuthenticatedNav } from "@/components/layout/AuthenticatedNav";
import {
  FitAssessmentSection,
  PostingOverviewSection,
  RawPostingCollapse,
  ResumeVariantSection,
  RoadmapSection,
  fitOverallScore,
} from "@/components/job/jobDetailViews";

const TRACK_PRESETS = ["wishlist", "applied", "phone_screen", "interview"] as const;

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const { data: job, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.jobs.get(id!),
    enabled: Boolean(id),
  });

  const track = useMutation({
    mutationFn: (status: string) => api.jobs.track(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      setMsg("Saved to your pipeline.");
    },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : "Track failed"),
  });

  if (error) {
    return (
      <AppShell>
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <AuthenticatedNav showBack onBack={() => nav(-1)} />
          <div className="ui-card border-red-900/40 bg-red-950/20 p-6">
            <p className="text-red-200/90">
              {error instanceof ApiError ? error.message : "Something went wrong"}
            </p>
            <Link to="/" className="ui-link mt-4 inline-block">
              Back to dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <AuthenticatedNav showBack onBack={() => nav(-1)} />
          <p className="text-slate-500">Loading…</p>
        </div>
      </AppShell>
    );
  }

  const fit = job.fit_assessment as Record<string, unknown> | null;
  const score = fitOverallScore(fit);
  const roadmapPlan = job.roadmap?.plan ?? null;

  return (
    <AppShell>
      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AuthenticatedNav showBack onBack={() => nav(-1)} />

        <header className="mb-8 border-b border-amber-950/30 pb-6">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-amber-600/90">
            Job detail
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              {job.title}
            </h1>
            {score != null ? (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium tabular-nums text-teal-300">
                Fit {score}%
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-slate-400">{job.company}</p>
          {job.sourceUrl ? (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-amber-400/95 hover:text-amber-300 hover:underline"
            >
              Open original posting →
            </a>
          ) : null}
        </header>

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

        <section className="mb-8">
          <h2 className="ui-label mb-3 uppercase tracking-wide text-slate-500">Pipeline</h2>
          <p className="mb-3 text-sm text-slate-500">
            Set or update how this job appears on your applications board.
          </p>
          <div className="flex flex-wrap gap-2">
            {TRACK_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                data-testid="track-status"
                data-status={s}
                onClick={() => track.mutate(s)}
                disabled={track.isPending}
                className="ui-pill capitalize"
              >
                Track: {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <PostingOverviewSection job={job} />
          <FitAssessmentSection fit={fit} />
          <ResumeVariantSection content={job.resume_variant?.content} />
          <RoadmapSection plan={roadmapPlan} />
          <RawPostingCollapse cleanText={job.clean_text} />
        </div>
      </div>
    </AppShell>
  );
}
