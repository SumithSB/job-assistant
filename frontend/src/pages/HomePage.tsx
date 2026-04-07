import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import type { ApplicationRow, JobDetail } from "@/api/types";
import { fitOverallScore, parseRoadmapPlan } from "@/components/job/jobDetailViews";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/authStore";

const PIPELINE_STATUSES = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "accepted",
] as const;

type TabId = "overview" | "profile" | "analyze" | "library";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "analyze", label: "Analyze" },
  { id: "library", label: "Library" },
];

function jobHasInsights(job: JobDetail): boolean {
  if (fitOverallScore(job.fit_assessment) != null) return true;
  const p = parseRoadmapPlan(job.roadmap?.plan ?? null);
  return Boolean(p && (p.skills.length || p.interviewPrep.length || p.risks.length));
}

function getExtractionSummary(job: JobDetail): string | null {
  const e = job.extracted;
  if (!e || typeof e !== "object") return null;
  const s = (e as { summary?: unknown }).summary;
  return typeof s === "string" && s.trim() ? s.slice(0, 280) + (s.length > 280 ? "…" : "") : null;
}

function statusLabel(s: string): string {
  return s.replace(/_/g, " ");
}

export default function HomePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const [tab, setTab] = useState<TabId>("overview");
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [profile, setProfile] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [duplicateIngestJobId, setDuplicateIngestJobId] = useState<string | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(() => new Set());

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.applications.list(),
  });

  const { data: prof } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.profile.get(),
  });

  useEffect(() => {
    if (prof) setProfile(prof.master_resume_text);
  }, [prof]);

  const profileBaseline = prof?.master_resume_text ?? "";
  const profileDirty = profile !== profileBaseline;
  const profileReady = profileBaseline.trim().length >= 80;

  const appByJobId = useMemo(() => {
    const m = new Map<string, ApplicationRow>();
    applications?.forEach((a) => m.set(a.jobId, a));
    return m;
  }, [applications]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    PIPELINE_STATUSES.forEach((s) => {
      c[s] = 0;
    });
    applications?.forEach((a) => {
      if (a.status in c) c[a.status] += 1;
    });
    return c;
  }, [applications]);

  const filteredJobs = useMemo(() => {
    if (!jobs?.length) return [];
    const q = libraryQuery.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.sourceUrl?.toLowerCase().includes(q) ?? false),
    );
  }, [jobs, libraryQuery]);

  const jobsWithoutApp = useMemo(
    () => (jobs ?? []).filter((j) => !appByJobId.has(j.id)).length,
    [jobs, appByJobId],
  );

  const saveProfile = useMutation({
    mutationFn: () => api.profile.update(profile),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setMsg("Profile saved. Re-run analysis on a job to refresh fit scores if needed.");
    },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : "Save failed"),
  });

  const ingest = useMutation({
    mutationFn: () =>
      api.jobs.ingest({
        url: url.trim() || undefined,
        pasted_text: pasted.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setDuplicateIngestJobId(null);
      setMsg("Posting analyzed. Open Job library or click the new card to see fit & outputs.");
      setUrl("");
      setPasted("");
      setTab("library");
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409 && e.duplicateJobId) {
        setDuplicateIngestJobId(e.duplicateJobId);
        setMsg(e.message);
        return;
      }
      setDuplicateIngestJobId(null);
      setMsg(e instanceof ApiError ? e.message : "Ingest failed");
    },
  });

  const track = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      api.jobs.track(jobId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      setMsg("Application updated.");
    },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : "Could not add to pipeline"),
  });

  const deleteJob = useMutation({
    mutationFn: (jobId: string) => api.jobs.delete(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["applications"] });
      setMsg("Job removed from library.");
    },
    onError: (e) => setMsg(e instanceof ApiError ? e.message : "Could not delete job"),
  });

  const toggleExpanded = (id: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeInPipeline = useMemo(
    () =>
      PIPELINE_STATUSES.filter((s) => !["rejected", "accepted"].includes(s)).reduce(
        (n, s) => n + (statusCounts[s] ?? 0),
        0,
      ),
    [statusCounts],
  );

  const appTotal = applications?.length ?? 0;

  const pipelineNonzero = useMemo(
    () =>
      PIPELINE_STATUSES.map((s) => {
        const count = statusCounts[s] ?? 0;
        return {
          s,
          count,
          pct: appTotal > 0 ? Math.round((count / appTotal) * 100) : 0,
        };
      }).filter((r) => r.count > 0),
    [statusCounts, appTotal],
  );

  const insightJobs = useMemo(() => {
    if (!jobs?.length) return [];
    const tagged = jobs.map((j, i) => ({ j, i }));
    const filtered = tagged.filter(({ j }) => jobHasInsights(j));
    filtered.sort((a, b) => {
      const at = appByJobId.has(a.j.id) ? 0 : 1;
      const bt = appByJobId.has(b.j.id) ? 0 : 1;
      if (at !== bt) return at - bt;
      return a.i - b.i;
    });
    return filtered.map((x) => x.j);
  }, [jobs, appByJobId]);

  return (
    <AppShell>
      {msg ? (
        <div
          className="fixed right-4 top-4 z-50 flex max-w-md items-start gap-3 rounded-xl border border-amber-900/50 bg-slate-950/95 px-4 py-3 text-sm text-amber-100/95 shadow-xl backdrop-blur-md"
          role="status"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <span>{msg}</span>
            {duplicateIngestJobId ? (
              <div>
                <Link
                  to={`/jobs/${duplicateIngestJobId}`}
                  className="font-medium text-amber-300 underline-offset-2 hover:underline"
                >
                  Open existing job →
                </Link>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="flex-shrink-0 rounded p-0.5 text-amber-500/80 hover:bg-amber-950/50 hover:text-amber-300"
            aria-label="Dismiss message"
            onClick={() => {
              setMsg(null);
              setDuplicateIngestJobId(null);
            }}
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-800/90 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Profile → analyze → library & pipeline in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/applications"
              className="rounded-lg bg-amber-900/35 px-4 py-2 text-sm font-medium text-amber-100 ring-1 ring-amber-800/50 transition hover:bg-amber-900/50"
            >
              Applications
            </Link>
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
              onClick={() => setToken(null)}
            >
              Log out
            </button>
          </div>
        </header>

        <div
          className="mb-6 flex flex-wrap gap-1 rounded-xl bg-slate-900/60 p-1 ring-1 ring-slate-800/80"
          role="tablist"
          aria-label="Dashboard sections"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`min-w-[5.5rem] flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition sm:flex-none sm:px-4 ${
                  active
                    ? "bg-slate-800 text-amber-100 shadow-sm ring-1 ring-amber-700/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/35 p-5 shadow-lg shadow-black/20 sm:p-7">
          <section
            id="panel-overview"
            role="tabpanel"
            aria-labelledby="tab-overview"
            hidden={tab !== "overview"}
            className={tab === "overview" ? "space-y-8" : "hidden"}
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setTab("library")}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-left transition hover:border-slate-600"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  In library
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-slate-50">
                  {jobsLoading ? "—" : jobs?.length ?? 0}
                </p>
              </button>
              <button
                type="button"
                onClick={() => navigate("/applications")}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-left transition hover:border-slate-600"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Applications
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-slate-50">
                  {appsLoading ? "—" : appTotal}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">{activeInPipeline} active stages</p>
              </button>
              <button
                type="button"
                onClick={() => setTab("library")}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-left transition hover:border-slate-600"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Not tracked
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-amber-200/90">
                  {jobsLoading ? "—" : jobsWithoutApp}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTab("profile")}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-left transition hover:border-slate-600"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Profile
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-slate-50">
                  {profileReady ? "Ready" : "Needs text"}
                </p>
              </button>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-slate-100">Fit & prep</h2>
                <button
                  type="button"
                  onClick={() => setTab("analyze")}
                  className="text-xs font-medium text-amber-500/90 hover:underline"
                >
                  New analysis
                </button>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                Rubric scores and prep roadmaps from analyzed postings. Open a job for full detail.
              </p>
              {!jobs?.length || jobsLoading ? (
                <p className="text-sm text-slate-600">
                  {jobsLoading ? "Loading library…" : "No jobs yet — run Analyze with a posting URL or paste."}
                </p>
              ) : insightJobs.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Nothing analyzed yet. Completed ingests add fit scores and a prep roadmap here.
                </p>
              ) : (
                <>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {insightJobs.slice(0, 4).map((job) => {
                      const score = fitOverallScore(job.fit_assessment);
                      const rm = parseRoadmapPlan(job.roadmap?.plan ?? null);
                      const topSkill = rm?.skills[0]?.skill;
                      const prepHint = topSkill
                        ? `Prep focus: ${topSkill}`
                        : rm?.interviewPrep[0]?.topic
                          ? `Interview: ${rm.interviewPrep[0].topic}`
                          : rm?.risks[0]
                            ? `Risk: ${rm.risks[0].slice(0, 72)}${rm.risks[0].length > 72 ? "…" : ""}`
                            : null;
                      const tracked = appByJobId.has(job.id);
                      return (
                        <li key={job.id}>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="block rounded-xl border border-slate-800/90 bg-slate-950/40 p-4 transition hover:border-amber-900/40 hover:bg-slate-950/70"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-display text-sm font-semibold text-slate-100">{job.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{job.company}</p>
                              </div>
                              <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1.5">
                                {score != null ? (
                                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] tabular-nums text-teal-300">
                                    Fit {score}%
                                  </span>
                                ) : null}
                                {rm && (rm.skills.length || rm.interviewPrep.length) ? (
                                  <span className="rounded-md border border-amber-900/35 bg-amber-950/20 px-2 py-0.5 text-[11px] text-amber-200/85">
                                    Roadmap
                                  </span>
                                ) : null}
                                {tracked ? (
                                  <span className="rounded-md border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                                    Tracked
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {prepHint ? (
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{prepHint}</p>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {insightJobs.length > 4 ? (
                    <button
                      type="button"
                      onClick={() => setTab("library")}
                      className="mt-4 text-xs font-medium text-amber-500/90 hover:underline"
                    >
                      View all {insightJobs.length} analyzed in Library →
                    </button>
                  ) : null}
                </>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-slate-100">Pipeline mix</h2>
                  <Link to="/applications" className="text-xs font-medium text-amber-500/90 hover:underline">
                    Open board
                  </Link>
                </div>
                <p className="mb-4 text-xs text-slate-500">
                  {appTotal
                    ? "Stages with at least one application."
                    : "Track a role from Library to see stages here."}
                </p>
                {pipelineNonzero.length ? (
                  <ul className="space-y-2.5">
                    {pipelineNonzero.map((row) => (
                      <li key={row.s} className="flex items-center gap-3 text-sm">
                        <span className="w-24 flex-shrink-0 capitalize text-slate-400">
                          {statusLabel(row.s)}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-amber-600/80"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs tabular-nums text-slate-500">
                          {row.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">No pipeline entries yet.</p>
                )}
              </div>

              <div className="rounded-xl border border-amber-950/30 bg-amber-950/10 p-5">
                <h2 className="font-display text-base font-semibold text-amber-100/90">Next steps</h2>
                <ol className="mt-3 list-decimal space-y-2.5 pl-4 text-sm leading-snug text-slate-300">
                  {!profileReady && (
                    <li>
                      <button
                        type="button"
                        className="text-amber-400/95 underline-offset-2 hover:underline"
                        onClick={() => setTab("profile")}
                      >
                        Add master resume
                      </button>{" "}
                      for meaningful fit scores.
                    </li>
                  )}
                  {!(jobs?.length) && (
                    <li>
                      <button
                        type="button"
                        className="text-amber-400/95 underline-offset-2 hover:underline"
                        onClick={() => setTab("analyze")}
                      >
                        Analyze first posting
                      </button>
                      .
                    </li>
                  )}
                  {jobsWithoutApp > 0 && (
                    <li>
                      <button
                        type="button"
                        className="text-amber-400/95 underline-offset-2 hover:underline"
                        onClick={() => setTab("library")}
                      >
                        Track {jobsWithoutApp} job{jobsWithoutApp !== 1 ? "s" : ""}
                      </button>{" "}
                      in pipeline.
                    </li>
                  )}
                  {profileReady && (jobs?.length ?? 0) > 0 && jobsWithoutApp === 0 && (
                    <li className="text-slate-500">You&apos;re caught up. Add more roles or tune stages.</li>
                  )}
                </ol>
              </div>
            </div>
          </section>

          <section
            id="panel-profile"
            role="tabpanel"
            aria-labelledby="tab-profile"
            hidden={tab !== "profile"}
            className={tab === "profile" ? "space-y-4" : "hidden"}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-100">Master resume</h2>
                <p className="text-sm text-slate-500">
                  Single source for tailored variants and fit evidence.
                </p>
              </div>
              {profileDirty ? (
                <span className="rounded-full bg-amber-950/50 px-2.5 py-1 text-xs text-amber-200/90">
                  Unsaved
                </span>
              ) : null}
            </div>
            <textarea
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              rows={14}
              className="ui-input min-h-[220px] font-mono text-[13px] leading-relaxed"
              placeholder="Paste your baseline resume…"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending || !profileDirty}
                className="ui-btn-primary"
              >
                {saveProfile.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setProfile(profileBaseline)}
                disabled={!profileDirty}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-900 disabled:opacity-40"
              >
                Discard
              </button>
            </div>
          </section>

          <section
            id="panel-analyze"
            role="tabpanel"
            aria-labelledby="tab-analyze"
            hidden={tab !== "analyze"}
            className={tab === "analyze" ? "space-y-6" : "hidden"}
          >
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-100">Analyze posting</h2>
              <p className="mt-1 text-sm text-slate-500">URL or paste — at least one required.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="space-y-3 lg:col-span-3">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="ui-input"
                  placeholder="Job URL"
                />
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={10}
                  className="ui-input min-h-[160px]"
                  placeholder="Or paste full job description"
                />
                <button
                  type="button"
                  disabled={ingest.isPending || (!url.trim() && !pasted.trim())}
                  onClick={() => ingest.mutate()}
                  className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
                >
                  {ingest.isPending ? "Running…" : "Run analysis"}
                </button>
                {!profileReady ? (
                  <p className="text-xs text-amber-600/85">Better fits if Profile tab has real resume text.</p>
                ) : null}
              </div>
              <aside className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-sm text-slate-400 lg:col-span-2">
                <p className="font-medium text-slate-300">You get</p>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed">
                  <li>Structured role + requirements</li>
                  <li>Fit vs profile</li>
                  <li>Resume variant & roadmap</li>
                </ul>
                <p className="mt-4 text-xs text-slate-600">Success opens Library tab.</p>
              </aside>
            </div>
          </section>

          <section
            id="panel-library"
            role="tabpanel"
            aria-labelledby="tab-library"
            hidden={tab !== "library"}
            className={tab === "library" ? "space-y-4" : "hidden"}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-100">Job library</h2>
                <p className="text-xs text-slate-500">
                  Same posting shows once. Remove deletes saved analysis & pipeline link.
                </p>
              </div>
              <input
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder="Search title, company, URL…"
                className="ui-input max-w-full sm:max-w-xs"
                type="search"
              />
            </div>

            <ul className="divide-y divide-slate-800/90 rounded-xl border border-slate-800/90 bg-slate-900/25">
              {filteredJobs.map((j) => {
                const score = fitOverallScore(j.fit_assessment);
                const summary = getExtractionSummary(j);
                const app = appByJobId.get(j.id);
                const open = expandedJobs.has(j.id);
                return (
                  <li key={j.id} data-testid="job-row" className="p-4 first:rounded-t-xl last:rounded-b-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            to={`/jobs/${j.id}`}
                            className="font-display text-[15px] font-semibold text-slate-100 hover:text-amber-200"
                          >
                            {j.title}
                          </Link>
                          {score != null ? (
                            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] tabular-nums text-teal-300">
                              Fit {score}%
                            </span>
                          ) : null}
                          {app ? (
                            <span className="rounded-md border border-amber-900/40 bg-amber-950/25 px-1.5 py-0.5 text-[11px] capitalize text-amber-200/85">
                              {statusLabel(app.status)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">{j.company}</p>
                      </div>

                      <div className="flex flex-shrink-0 flex-col gap-2 sm:items-end">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Link
                            to={`/jobs/${j.id}`}
                            className="rounded-lg bg-amber-800/70 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                          >
                            Open
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(j.id)}
                            className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            aria-expanded={open}
                          >
                            {open ? "Less" : "Preview"}
                          </button>
                          {!app ? (
                            <button
                              type="button"
                              disabled={track.isPending}
                              onClick={() => track.mutate({ jobId: j.id, status: "wishlist" })}
                              className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                            >
                              Track
                            </button>
                          ) : (
                            <select
                              value={app.status}
                              onChange={(e) =>
                                track.mutate({ jobId: j.id, status: e.target.value })
                              }
                              className="rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-2 pr-6 text-xs text-slate-200"
                              aria-label="Pipeline status"
                            >
                              {PIPELINE_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {statusLabel(s)}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            disabled={deleteJob.isPending}
                            className="rounded-lg px-2 py-1.5 text-xs text-red-400/90 hover:bg-red-950/30"
                            onClick={() => {
                              if (
                                typeof window !== "undefined" &&
                                !window.confirm(
                                  "Remove this job and its pipeline link? This cannot be undone.",
                                )
                              ) {
                                return;
                              }
                              deleteJob.mutate(j.id);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    {open ? (
                      <div className="mt-3 border-t border-slate-800/80 pt-3 text-sm text-slate-400">
                        {summary ? <p>{summary}</p> : <p className="italic text-slate-600">No summary.</p>}
                        {j.sourceUrl ? (
                          <a
                            href={j.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-amber-500/90 hover:underline"
                          >
                            Source →
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {!jobsLoading && !filteredJobs.length ? (
              <p className="py-10 text-center text-sm text-slate-500">
                {libraryQuery ? "No matches." : "Nothing here yet — use Analyze."}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
