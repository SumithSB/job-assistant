import { useAuthStore } from "@/store/authStore";
import { parseApiErrorBody } from "./errors";
import { shouldClearSession } from "./session";

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
  const sentAuthorization = Boolean(token);
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(sentAuthorization ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    if (shouldClearSession(res.status, sentAuthorization, path)) {
      useAuthStore.getState().setToken(null);
    }
    let message = res.statusText;
    let duplicateJobId: string | undefined;
    try {
      const parsed = parseApiErrorBody(await res.json(), res.statusText);
      message = parsed.message;
      duplicateJobId = parsed.duplicateJobId;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message, duplicateJobId);
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
