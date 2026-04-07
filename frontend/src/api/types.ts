export type ApiErrorBody = {
  error: string;
  detail: string | unknown;
};

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Profile {
  user_id: string;
  master_resume_text: string;
  structured_skills: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
}

export interface JobDetail {
  id: string;
  sourceUrl: string | null;
  title: string;
  company: string;
  clean_text: string;
  extracted: Record<string, unknown> | null;
  fit_assessment: Record<string, unknown> | null;
  extraction_version: number;
  resume_variant: {
    id: string;
    content: string;
    profile_version_used: number;
  } | null;
  roadmap: {
    id: string;
    plan: Record<string, unknown>;
  } | null;
}

export interface ApplicationRow {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string | null;
  notes: string | null;
}
