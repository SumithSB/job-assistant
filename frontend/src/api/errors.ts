export type ParsedApiError = {
  message: string;
  duplicateJobId?: string;
};

/**
 * Message and optional duplicate job id from a failed API body.
 *
 * FastAPI wraps failures as `{ error, detail }`. `detail` is a string, or an
 * object such as `{ message, error, job_id }` when ingest hits a duplicate.
 * `fallback` is kept when the body has no usable message (usually `statusText`).
 */
export function parseApiErrorBody(body: unknown, fallback: string): ParsedApiError {
  if (!body || typeof body !== "object") {
    return { message: fallback };
  }
  const record = body as { error?: unknown; detail?: unknown };
  const detail = record.detail;
  if (typeof detail === "string") {
    return { message: detail };
  }
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const o = detail as Record<string, unknown>;
    let message = fallback;
    if (typeof o.message === "string") message = o.message;
    else if (typeof o.error === "string") message = String(o.error);
    if (typeof o.job_id === "string") {
      return { message, duplicateJobId: o.job_id };
    }
    return { message };
  }
  if (record.error) {
    return { message: String(record.error) };
  }
  return { message: fallback };
}
