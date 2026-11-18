import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compensationLine,
  fitOverallScore,
  getExtractionSummary,
  parseFitDimensions,
  parseGaps,
  parseRoadmapPlan,
  pickStrArray,
  postingMeta,
} from "./jobDetailParse.ts";

describe("pickStrArray", () => {
  it("trims entries and drops blanks and non-strings", () => {
    assert.deepEqual(pickStrArray([" Python ", "  ", "", 1, null, "SQL"]), ["Python", "SQL"]);
    assert.deepEqual(pickStrArray("nope"), []);
    assert.deepEqual(pickStrArray(undefined), []);
  });
});

describe("fitOverallScore", () => {
  it("returns a finite overall score, including zero", () => {
    assert.equal(fitOverallScore({ overall_score: 72 }), 72);
    assert.equal(fitOverallScore({ overall_score: 0 }), 0);
  });

  it("ignores missing, non-numeric, and non-finite scores", () => {
    assert.equal(fitOverallScore(null), null);
    assert.equal(fitOverallScore(undefined), null);
    assert.equal(fitOverallScore({}), null);
    assert.equal(fitOverallScore({ overall_score: "72" }), null);
    assert.equal(fitOverallScore({ overall_score: Number.NaN }), null);
    assert.equal(fitOverallScore({ overall_score: Number.POSITIVE_INFINITY }), null);
  });

  it("clamps finite scores onto the 0-100 bar scale", () => {
    assert.equal(fitOverallScore({ overall_score: 140 }), 100);
    assert.equal(fitOverallScore({ overall_score: -8 }), 0);
    assert.equal(fitOverallScore({ overall_score: 72.5 }), 72.5);
  });
});

describe("parseFitDimensions", () => {
  it("parses a scored dimension and drops blank evidence", () => {
    const dims = parseFitDimensions({
      dimensions: [
        {
          id: "stack_overlap",
          label: "Stack overlap",
          score: 80,
          weight: 0.3,
          evidence: ["Python listed", "  ", 12],
        },
      ],
    });
    assert.deepEqual(dims, [
      {
        id: "stack_overlap",
        label: "Stack overlap",
        score: 80,
        weight: 0.3,
        evidence: ["Python listed"],
      },
    ]);
  });

  it("clamps scores, falls back labels, and skips junk rows", () => {
    const dims = parseFitDimensions({
      dimensions: [
        { score: 140, weight: "high" },
        { id: "must_have", score: -4, weight: 0.35 },
        "nope",
        null,
      ],
    });
    assert.equal(dims.length, 2);
    assert.equal(dims[0]?.label, "Dimension");
    assert.equal(dims[0]?.id, "Dimension");
    assert.equal(dims[0]?.score, 100);
    assert.equal(dims[0]?.weight, 0);
    assert.equal(dims[1]?.id, "must_have");
    assert.equal(dims[1]?.label, "must_have");
    assert.equal(dims[1]?.score, 0);
    assert.deepEqual(parseFitDimensions(null), []);
    assert.deepEqual(parseFitDimensions({ dimensions: "nope" }), []);
  });

  it("treats non-finite scores as zero and clamps weights to 0-1", () => {
    const dims = parseFitDimensions({
      dimensions: [
        { id: "bad", label: "Bad", score: Number.NaN, weight: Number.POSITIVE_INFINITY },
        { id: "heavy", label: "Heavy", score: 40, weight: 2.5 },
        { id: "neg", label: "Neg", score: 10, weight: -0.2 },
      ],
    });
    assert.equal(dims[0]?.score, 0);
    assert.equal(dims[0]?.weight, 0);
    assert.equal(dims[1]?.score, 40);
    assert.equal(dims[1]?.weight, 1);
    assert.equal(dims[2]?.weight, 0);
  });
});

describe("parseGaps", () => {
  it("keeps skill gaps and defaults severity", () => {
    assert.deepEqual(
      parseGaps({
        gaps: [
          { skill: " Kubernetes ", severity: "low", source: "requirements_must_have" },
          { skill: "GraphQL" },
          { severity: "high" },
          "nope",
        ],
      }),
      [
        { skill: "Kubernetes", severity: "low", source: "requirements_must_have" },
        { skill: "GraphQL", severity: "medium", source: "" },
      ],
    );
    assert.deepEqual(parseGaps({}), []);
  });
});

describe("postingMeta", () => {
  it("maps extraction fields and drops blank list entries", () => {
    const meta = postingMeta({
      summary: "  Build APIs. ",
      location: "Remote",
      employment_type: "full-time",
      seniority: "",
      responsibilities: ["Ship features", ""],
      requirements_must_have: ["Python"],
      requirements_nice_to_have: [],
      tech_stack: ["python", "  "],
      domain_keywords: ["fintech"],
      education: ["BS"],
      posting_language: "en",
      compensation: { text: "£80k" },
    });
    assert.ok(meta);
    assert.equal(meta.summary, "Build APIs.");
    assert.equal(meta.location, "Remote");
    assert.equal(meta.employmentType, "full-time");
    assert.equal(meta.seniority, null);
    assert.deepEqual(meta.responsibilities, ["Ship features"]);
    assert.deepEqual(meta.mustHave, ["Python"]);
    assert.deepEqual(meta.techStack, ["python"]);
    assert.deepEqual(meta.domainKeywords, ["fintech"]);
    assert.deepEqual(meta.education, ["BS"]);
    assert.equal(meta.postingLanguage, "en");
    assert.deepEqual(meta.compensation, { text: "£80k" });
    assert.equal(postingMeta(null), null);
    assert.equal(postingMeta(undefined), null);
  });
});

describe("compensationLine", () => {
  it("prefers text, then a range, then a minimum", () => {
    assert.equal(compensationLine(null), null);
    assert.equal(compensationLine({ text: " £80–90k ", min: 1, max: 2 }), "£80–90k");
    assert.equal(compensationLine({ min: 80000, max: 90000, currency: "GBP" }), "80000–90000 GBP");
    assert.equal(compensationLine({ min: 0, currency: "USD" }), "0+ USD");
    assert.equal(compensationLine({ max: 90000, currency: "GBP" }), null);
    assert.equal(compensationLine({}), null);
  });
});

describe("parseRoadmapPlan", () => {
  it("reads snake_case plans from the pipeline schema", () => {
    const plan = parseRoadmapPlan({
      horizon_weeks: 4,
      priority_skills: [
        {
          skill: "Deepen PostgreSQL",
          rationale: "Frequently listed",
          milestones: [{ week: 1 }],
        },
      ],
      interview_prep: [{ topic: "System design", depth: "mid" }],
      risks: ["Mock roadmap", ""],
    });
    assert.ok(plan);
    assert.equal(plan.horizonWeeks, 4);
    assert.deepEqual(plan.skills, [
      {
        skill: "Deepen PostgreSQL",
        rationale: "Frequently listed",
        milestones: [{ week: 1 }],
      },
    ]);
    assert.deepEqual(plan.interviewPrep, [{ topic: "System design", depth: "mid" }]);
    assert.deepEqual(plan.risks, ["Mock roadmap"]);
  });

  it("accepts camelCase aliases and defaults an empty plan", () => {
    const plan = parseRoadmapPlan({
      horizonWeeks: 6,
      prioritySkills: [{ name: "SQL", reason: "Gaps" }, "skip"],
      interviewPrep: [{ name: "Behavioral" }],
    });
    assert.ok(plan);
    assert.equal(plan.horizonWeeks, 6);
    assert.deepEqual(plan.skills, [{ skill: "SQL", rationale: "Gaps", milestones: undefined }]);
    assert.deepEqual(plan.interviewPrep, [{ topic: "Behavioral", depth: "" }]);
    assert.deepEqual(parseRoadmapPlan({})?.horizonWeeks, 4);
    assert.equal(parseRoadmapPlan(null), null);
  });
});

describe("getExtractionSummary", () => {
  it("returns short summaries and ellipsizes past 280 characters", () => {
    assert.equal(getExtractionSummary({ extracted: null }), null);
    assert.equal(getExtractionSummary({ extracted: { summary: "  " } }), null);
    assert.equal(getExtractionSummary({ extracted: { summary: 12 } }), null);
    assert.equal(getExtractionSummary({ extracted: { summary: "  Ship APIs. " } }), "  Ship APIs. ");

    const exact = "a".repeat(280);
    assert.equal(getExtractionSummary({ extracted: { summary: exact } }), exact);

    const long = "b".repeat(281);
    const shown = getExtractionSummary({ extracted: { summary: long } });
    assert.equal(shown, `${"b".repeat(280)}…`);
  });
});
