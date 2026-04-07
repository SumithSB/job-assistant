/** Defensive parsers + presentational blocks for job detail (LLM extraction / fit / roadmap shapes). */

import type { ReactNode } from "react";

import type { JobDetail } from "@/api/types";

function pickStr(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim();
}

function pickStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function pickRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

export function fitOverallScore(fit: Record<string, unknown> | null | undefined): number | null {
  if (!fit) return null;
  const s = fit.overall_score;
  return typeof s === "number" && Number.isFinite(s) ? s : null;
}

export type ParsedFitDimension = {
  id: string;
  label: string;
  score: number;
  weight: number;
  evidence: string[];
};

export function parseFitDimensions(fit: Record<string, unknown> | null | undefined): ParsedFitDimension[] {
  const raw = fit?.dimensions;
  if (!Array.isArray(raw)) return [];
  const out: ParsedFitDimension[] = [];
  for (const item of raw) {
    const o = pickRecord(item);
    if (!o) continue;
    const label = pickStr(o.label) ?? pickStr(o.id) ?? "Dimension";
    const id = pickStr(o.id) ?? label;
    const score = typeof o.score === "number" ? Math.min(100, Math.max(0, o.score)) : 0;
    const weight = typeof o.weight === "number" ? o.weight : 0;
    out.push({ id, label, score, weight, evidence: pickStrArray(o.evidence) });
  }
  return out;
}

export type ParsedGap = { skill: string; severity: string; source: string };

export function parseGaps(fit: Record<string, unknown> | null | undefined): ParsedGap[] {
  const raw = fit?.gaps;
  if (!Array.isArray(raw)) return [];
  const out: ParsedGap[] = [];
  for (const item of raw) {
    const o = pickRecord(item);
    if (!o) continue;
    const skill = pickStr(o.skill);
    if (!skill) continue;
    out.push({
      skill,
      severity: pickStr(o.severity) ?? "medium",
      source: pickStr(o.source) ?? "",
    });
  }
  return out;
}

const extractionKeys = {
  summary: "summary",
  location: "location",
  employment_type: "employment_type",
  seniority: "seniority",
  responsibilities: "responsibilities",
  requirements_must_have: "requirements_must_have",
  requirements_nice_to_have: "requirements_nice_to_have",
  tech_stack: "tech_stack",
  domain_keywords: "domain_keywords",
  education: "education",
  posting_language: "posting_language",
} as const;

export function postingMeta(extracted: Record<string, unknown> | null | undefined) {
  if (!extracted) return null;
  return {
    summary: pickStr(extracted[extractionKeys.summary]),
    location: pickStr(extracted[extractionKeys.location]),
    employmentType: pickStr(extracted[extractionKeys.employment_type]),
    seniority: pickStr(extracted[extractionKeys.seniority]),
    responsibilities: pickStrArray(extracted[extractionKeys.responsibilities]),
    mustHave: pickStrArray(extracted[extractionKeys.requirements_must_have]),
    niceToHave: pickStrArray(extracted[extractionKeys.requirements_nice_to_have]),
    techStack: pickStrArray(extracted[extractionKeys.tech_stack]),
    domainKeywords: pickStrArray(extracted[extractionKeys.domain_keywords]),
    education: pickStrArray(extracted[extractionKeys.education]),
    postingLanguage: pickStr(extracted[extractionKeys.posting_language]),
    compensation: pickRecord(extracted.compensation),
  };
}

function compensationLine(c: Record<string, unknown> | null): string | null {
  if (!c) return null;
  const text = pickStr(c.text);
  if (text) return text;
  const min = typeof c.min === "number" ? c.min : null;
  const max = typeof c.max === "number" ? c.max : null;
  const cur = pickStr(c.currency);
  if (min != null && max != null) return `${min}–${max}${cur ? ` ${cur}` : ""}`;
  if (min != null) return `${min}+${cur ? ` ${cur}` : ""}`;
  return null;
}

export type RoadmapSkill = { skill: string; rationale: string; milestones: unknown };

export function parseRoadmapPlan(plan: Record<string, unknown> | null | undefined) {
  if (!plan) return null;
  const horizon =
    typeof plan.horizon_weeks === "number" ? plan.horizon_weeks : typeof plan.horizonWeeks === "number"
      ? plan.horizonWeeks
      : 4;
  const risks = pickStrArray(plan.risks);
  const priorityRaw = plan.priority_skills ?? plan.prioritySkills;
  const skills: RoadmapSkill[] = [];
  if (Array.isArray(priorityRaw)) {
    for (const item of priorityRaw) {
      const o = pickRecord(item);
      if (!o) continue;
      const skill = pickStr(o.skill) ?? pickStr(o.name) ?? "Skill";
      const rationale = pickStr(o.rationale) ?? pickStr(o.reason) ?? "";
      skills.push({ skill, rationale, milestones: o.milestones });
    }
  }
  const prepRaw = plan.interview_prep ?? plan.interviewPrep;
  const interviewPrep: { topic: string; depth: string }[] = [];
  if (Array.isArray(prepRaw)) {
    for (const item of prepRaw) {
      const o = pickRecord(item);
      if (!o) continue;
      const topic = pickStr(o.topic) ?? pickStr(o.name) ?? "Topic";
      const depth = pickStr(o.depth) ?? "";
      interviewPrep.push({ topic, depth });
    }
  }
  return { horizonWeeks: horizon, risks, skills, interviewPrep };
}

function severityClass(sev: string): string {
  const s = sev.toLowerCase();
  if (s === "high")
    return "border-red-800/60 bg-red-950/35 text-red-200";
  if (s === "low") return "border-slate-700 bg-slate-900/60 text-slate-400";
  return "border-amber-900/50 bg-amber-950/30 text-amber-200/90";
}

function Subheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500 first:mt-0">
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm italic text-slate-600">None listed.</p>;
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300">
      {items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 48)}`}>{t}</li>
      ))}
    </ul>
  );
}

export function PostingOverviewSection({ job }: { job: JobDetail }) {
  const meta = postingMeta(job.extracted);

  if (!meta) {
    return (
      <section className="ui-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-slate-100">Role overview</h2>
        <p className="mt-2 text-sm text-slate-500">
          No structured extraction stored for this job. Title and company above come from the ingest
          pipeline; re-run analysis if this looks empty.
        </p>
      </section>
    );
  }

  const compLine = meta.compensation ? compensationLine(meta.compensation) : null;
  const hasBody =
    Boolean(meta.summary) ||
    Boolean(meta.location) ||
    meta.mustHave.length > 0 ||
    meta.responsibilities.length > 0 ||
    meta.techStack.length > 0 ||
    meta.niceToHave.length > 0 ||
    meta.domainKeywords.length > 0 ||
    meta.education.length > 0 ||
    Boolean(compLine);

  if (!hasBody) {
    return (
      <section className="ui-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-slate-100">Role overview</h2>
        <p className="mt-2 text-sm text-slate-500">
          Extraction is empty for this job. Try running analysis again with clearer posting text.
        </p>
      </section>
    );
  }

  return (
    <section className="ui-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-slate-100">Role overview</h2>
      <p className="mt-1 text-xs text-slate-500">Parsed from the posting (extraction).</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {meta.location ? (
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300">
            {meta.location}
          </span>
        ) : null}
        {meta.employmentType ? (
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300">
            {meta.employmentType}
          </span>
        ) : null}
        {meta.seniority ? (
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300">
            {meta.seniority}
          </span>
        ) : null}
        {meta.postingLanguage ? (
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-400">
            Lang: {meta.postingLanguage}
          </span>
        ) : null}
        {compLine ? (
          <span className="rounded-full border border-teal-900/50 bg-teal-950/30 px-2.5 py-1 text-teal-200/90">
            {compLine}
          </span>
        ) : null}
      </div>

      {meta.summary ? (
        <>
          <Subheading>Summary</Subheading>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{meta.summary}</p>
        </>
      ) : null}

      {meta.techStack.length ? (
        <>
          <Subheading>Tech stack</Subheading>
          <div className="mt-2 flex flex-wrap gap-2">
            {meta.techStack.map((t, i) => (
              <span
                key={`${i}-${t}`}
                className="rounded-md border border-slate-700/80 bg-slate-950/50 px-2 py-0.5 text-xs text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {meta.domainKeywords.length ? (
        <>
          <Subheading>Domain</Subheading>
          <div className="mt-2 flex flex-wrap gap-2">
            {meta.domainKeywords.map((t, i) => (
              <span
                key={`${i}-${t}`}
                className="rounded-md border border-slate-800 bg-slate-900/40 px-2 py-0.5 text-xs text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {meta.responsibilities.length ? (
        <>
          <Subheading>Responsibilities</Subheading>
          <BulletList items={meta.responsibilities} />
        </>
      ) : null}

      {meta.mustHave.length ? (
        <>
          <Subheading>Must-have requirements</Subheading>
          <BulletList items={meta.mustHave} />
        </>
      ) : null}

      {meta.niceToHave.length ? (
        <>
          <Subheading>Nice-to-have</Subheading>
          <BulletList items={meta.niceToHave} />
        </>
      ) : null}

      {meta.education.length ? (
        <>
          <Subheading>Education</Subheading>
          <BulletList items={meta.education} />
        </>
      ) : null}
    </section>
  );
}

export function FitAssessmentSection({ fit }: { fit: Record<string, unknown> | null | undefined }) {
  const overall = fitOverallScore(fit ?? null);
  const dimensions = parseFitDimensions(fit ?? null);
  const gaps = parseGaps(fit ?? null);
  const strengths = pickStrArray(fit?.strengths);

  if (!fit || (overall == null && !dimensions.length && !gaps.length && !strengths.length)) {
    return (
      <section className="ui-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-slate-100">Fit vs your profile</h2>
        <p className="mt-2 text-sm text-slate-500">No fit assessment stored yet.</p>
      </section>
    );
  }

  return (
    <section className="ui-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-slate-100">Fit vs your profile</h2>
      <p className="mt-1 text-xs text-slate-500">Scored dimensions and evidence from the model.</p>

      {overall != null ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-slate-300">Overall</span>
            <span className="tabular-nums text-teal-300">{overall}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-700 to-emerald-500 transition-[width]"
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>
      ) : null}

      {strengths.length ? (
        <>
          <Subheading>Strengths</Subheading>
          <ul className="mt-2 flex flex-wrap gap-2">
            {strengths.map((s, i) => (
              <li
                key={`${i}-${s.slice(0, 40)}`}
                className="rounded-lg border border-emerald-900/40 bg-emerald-950/25 px-3 py-1 text-sm text-emerald-200/95"
              >
                {s}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {dimensions.length ? (
        <>
          <Subheading>Dimensions</Subheading>
          <ul className="mt-3 space-y-4">
            {dimensions.map((d, i) => (
              <li
                key={`${d.id}-${i}`}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-200">{d.label}</span>
                  <span className="text-sm tabular-nums text-slate-400">
                    {d.score}%
                    {d.weight > 0 ? (
                      <span className="text-slate-600"> · weight {Math.round(d.weight * 100)}%</span>
                    ) : null}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                {d.evidence.length ? (
                  <ul className="mt-3 space-y-1 text-xs leading-relaxed text-slate-400">
                    {d.evidence.map((e, j) => (
                      <li key={`${j}-${e.slice(0, 48)}`} className="border-l border-slate-700 pl-2">
                        {e}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {gaps.length ? (
        <>
          <Subheading>Gaps to close</Subheading>
          <ul className="mt-3 space-y-2">
            {gaps.map((g, i) => (
              <li
                key={`${i}-${g.skill}`}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${severityClass(g.severity)}`}
              >
                <span className="font-medium">{g.skill}</span>
                <span className="text-xs capitalize opacity-90">{g.severity}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

export function RoadmapSection({ plan }: { plan: Record<string, unknown> | null | undefined }) {
  const parsed = parseRoadmapPlan(plan ?? null);

  if (
    !parsed ||
    (!parsed.skills.length && !parsed.interviewPrep.length && !parsed.risks.length)
  ) {
    return (
      <section className="ui-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-slate-100">Prep roadmap</h2>
        <p className="mt-2 text-sm text-slate-500">No roadmap stored yet.</p>
      </section>
    );
  }

  return (
    <section className="ui-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-slate-100">Prep roadmap</h2>
        <span className="rounded-full border border-amber-900/40 bg-amber-950/30 px-3 py-0.5 text-xs text-amber-200/95">
          ~{parsed.horizonWeeks} week horizon
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">Priorities and interview focus suggested from the gap analysis.</p>

      {parsed.skills.length ? (
        <>
          <Subheading>Priority skills</Subheading>
          <ul className="mt-3 space-y-3">
            {parsed.skills.map((s, i) => {
              const m = s.milestones;
              const milestoneNote =
                Array.isArray(m) && m.length
                  ? `${m.length} milestone(s)`
                  : m && typeof m === "object"
                    ? "See milestones in raw plan"
                    : null;
              return (
                <li key={`${i}-${s.skill}`} className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                  <p className="font-medium text-slate-200">{s.skill}</p>
                  {s.rationale ? (
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.rationale}</p>
                  ) : null}
                  {milestoneNote ? (
                    <p className="mt-2 text-xs text-slate-600">{milestoneNote}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {parsed.interviewPrep.length ? (
        <>
          <Subheading>Interview prep</Subheading>
          <ul className="mt-3 space-y-2">
            {parsed.interviewPrep.map((p, i) => (
              <li
                key={`${i}-${p.topic}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">{p.topic}</span>
                {p.depth ? (
                  <span className="text-xs text-slate-500">Depth: {p.depth}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {parsed.risks.length ? (
        <>
          <Subheading>Risks</Subheading>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-400">
            {parsed.risks.map((r, i) => (
              <li key={`${i}-${r.slice(0, 40)}`} className="flex gap-2">
                <span className="text-amber-600/80" aria-hidden>
                  ·
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

export function ResumeVariantSection({ content }: { content: string | null | undefined }) {
  const text = content?.trim();
  return (
    <section className="ui-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-slate-100">Tailored resume</h2>
      <p className="mt-1 text-xs text-slate-500">Plain text variant aligned to this posting.</p>
      {text ? (
        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
          {text}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No resume variant saved.</p>
      )}
    </section>
  );
}

export function RawPostingCollapse({ cleanText }: { cleanText: string }) {
  if (!cleanText.trim()) return null;
  return (
    <details className="ui-card overflow-hidden border-slate-800/80 p-0 sm:p-0">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-400 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-slate-600 underline-offset-2 hover:text-slate-300">
          Full extracted posting text
        </span>
        <span className="ml-2 text-xs font-normal text-slate-600">(reference)</span>
      </summary>
      <div className="max-h-96 overflow-auto border-t border-slate-800/80 px-5 py-4 text-xs leading-relaxed text-slate-500">
        {cleanText}
      </div>
    </details>
  );
}
