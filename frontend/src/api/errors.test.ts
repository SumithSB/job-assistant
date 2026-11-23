import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseApiErrorBody } from "./errors.ts";

describe("parseApiErrorBody", () => {
  it("uses a string detail and ignores the wrapper error field", () => {
    assert.deepEqual(
      parseApiErrorBody({ error: "request_error", detail: "Job not found" }, "Not Found"),
      { message: "Job not found" },
    );
    assert.deepEqual(parseApiErrorBody({ error: "request_error", detail: "" }, "Not Found"), {
      message: "",
    });
  });

  it("reads the duplicate-ingest message and job id", () => {
    assert.deepEqual(
      parseApiErrorBody(
        {
          error: "request_error",
          detail: {
            error: "duplicate_job",
            job_id: "6b1c0c3e-1c2a-4a0e-9c1a-0a0a0a0a0a0a",
            match: "url",
            message: "This job posting is already in your library.",
          },
        },
        "Conflict",
      ),
      {
        message: "This job posting is already in your library.",
        duplicateJobId: "6b1c0c3e-1c2a-4a0e-9c1a-0a0a0a0a0a0a",
      },
    );
  });

  it("falls back to detail.error and still keeps a string job id", () => {
    assert.deepEqual(
      parseApiErrorBody(
        { error: "request_error", detail: { error: "duplicate_job", job_id: "job-1" } },
        "Conflict",
      ),
      { message: "duplicate_job", duplicateJobId: "job-1" },
    );
    assert.deepEqual(
      parseApiErrorBody({ detail: { job_id: "job-2", message: 12 } }, "Conflict"),
      { message: "Conflict", duplicateJobId: "job-2" },
    );
  });

  it("keeps the fallback when the body has no usable message", () => {
    assert.deepEqual(parseApiErrorBody(null, "Bad Gateway"), { message: "Bad Gateway" });
    assert.deepEqual(parseApiErrorBody("nope", "Bad Gateway"), { message: "Bad Gateway" });
    assert.deepEqual(
      parseApiErrorBody({ detail: [{ msg: "field required" }] }, "Unprocessable Entity"),
      { message: "Unprocessable Entity" },
    );
    assert.deepEqual(parseApiErrorBody({ detail: { job_id: 12, message: 12 } }, "Conflict"), {
      message: "Conflict",
    });
    assert.deepEqual(parseApiErrorBody({}, "Bad Request"), { message: "Bad Request" });
  });

  it("uses the top-level error when detail is missing", () => {
    assert.deepEqual(parseApiErrorBody({ error: "request_error" }, "Bad Request"), {
      message: "request_error",
    });
  });
});
