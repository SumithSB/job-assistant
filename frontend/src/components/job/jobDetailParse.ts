/** Defensive parsers for LLM extraction, fit, and roadmap JSON. */

function pickStr(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim();
}

export function pickStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (t) out.push(t);
  }
  return out;
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

export function compensationLine(c: Record<string, unknown> | null): string | null {
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

/** Library-card blurb from extraction.summary, capped so long model text does not blow the row. */
export function getExtractionSummary(job: {
  extracted: Record<string, unknown> | null;
}): string | null {
  const e = job.extracted;
  if (!e || typeof e !== "object") return null;
  const s = (e as { summary?: unknown }).summary;
  return typeof s === "string" && s.trim() ? s.slice(0, 280) + (s.length > 280 ? "…" : "") : null;
}
