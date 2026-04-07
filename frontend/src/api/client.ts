import type { ApiErrorBody } from "./types";

const base = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public duplicateJobId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    let duplicateJobId: string | undefined;
    try {
      const body = (await res.json()) as ApiErrorBody;
      const d = body.detail;
      if (typeof d === "string") {
        msg = d;
      } else if (d && typeof d === "object" && !Array.isArray(d)) {
        const o = d as Record<string, unknown>;
        if (typeof o.message === "string") msg = o.message;
        else if (typeof o.error === "string") msg = String(o.error);
        if (typeof o.job_id === "string") duplicateJobId = o.job_id;
      } else if (body.error) {
        msg = String(body.error);
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg, duplicateJobId);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      apiRequest<{ access_token: string; token_type: string }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      apiRequest<{ access_token: string; token_type: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  profile: {
    get: () => apiRequest<import("./types").Profile>("/api/v1/me/profile"),
    update: (master_resume_text: string) =>
      apiRequest<import("./types").Profile>("/api/v1/me/profile", {
        method: "PUT",
        body: JSON.stringify({ master_resume_text }),
      }),
  },
  jobs: {
    ingest: (body: { url?: string; pasted_text?: string }) =>
      apiRequest<import("./types").JobDetail>("/api/v1/jobs/ingest", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    list: () => apiRequest<import("./types").JobDetail[]>("/api/v1/jobs"),
    get: (id: string) => apiRequest<import("./types").JobDetail>(`/api/v1/jobs/${id}`),
    delete: (id: string) =>
      apiRequest<void>(`/api/v1/jobs/${id}`, {
        method: "DELETE",
      }),
    track: (id: string, status: string) =>
      apiRequest<{ id: string; job_id: string; status: string }>(`/api/v1/jobs/${id}/track`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
  },
  applications: {
    list: () => apiRequest<import("./types").ApplicationRow[]>("/api/v1/applications"),
    update: (id: string, body: { status?: string; notes?: string | null }) =>
      apiRequest<import("./types").ApplicationRow>(`/api/v1/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      apiRequest<void>(`/api/v1/applications/${id}`, {
        method: "DELETE",
      }),
  },
};
