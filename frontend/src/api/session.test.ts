import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldClearSession } from "./session.ts";

describe("shouldClearSession", () => {
  it("clears when an authenticated API call is rejected", () => {
    assert.equal(shouldClearSession(401, true, "/api/v1/jobs"), true);
    assert.equal(shouldClearSession(401, true, "/api/v1/me/profile"), true);
    assert.equal(shouldClearSession(401, true, "/api/v1/jobs/abc?x=1"), true);
  });

  it("keeps the session on credential failures and other statuses", () => {
    assert.equal(shouldClearSession(401, true, "/api/v1/auth/login"), false);
    assert.equal(shouldClearSession(401, true, "/api/v1/auth/register"), false);
    assert.equal(shouldClearSession(401, false, "/api/v1/jobs"), false);
    assert.equal(shouldClearSession(403, true, "/api/v1/jobs"), false);
    assert.equal(shouldClearSession(400, true, "/api/v1/jobs"), false);
  });
});
