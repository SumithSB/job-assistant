# OWASP Top 10 — FastAPI/React Checklist

## A01 – Broken Access Control
- [ ] Every user-data endpoint filters by `current_user.id`
- [ ] No IDOR: lookups use `WHERE id=? AND user_id=?`, never just `WHERE id=?`
- [ ] Admin routes protected by separate `require_admin` dependency
- [ ] CORS origin restricted (not `allow_origins=["*"]`)

## A02 – Cryptographic Failures
- [ ] JWT signed HS256+; secret ≥ 32 bytes from env var
- [ ] Passwords hashed with `bcrypt` (cost ≥ 12) via passlib
- [ ] `DATABASE_URL`, `JWT_SECRET`, and LLM/API credentials not in source code or logs
- [ ] `Secure` + `HttpOnly` + `SameSite=Lax` on refresh token cookies

## A03 – Injection
- [ ] No f-strings in `text()` SQL calls
- [ ] No `eval()`, `exec()`, `subprocess` with user-controlled strings
- [ ] File upload paths use `pathlib.Path(...).resolve()` and are restricted to upload dir

## A04 – Insecure Design
- [ ] Rate limiting on `/auth/login`, `/auth/register` (≤ 5 req/min per IP)
- [ ] Login/forgot-password return identical message regardless of email existence
- [ ] Job URL imports validate scheme (`https://` only) + block RFC 1918 ranges

## A05 – Security Misconfiguration
- [ ] `DEBUG=False` in prod; stack traces never returned in API responses
- [ ] `.env` files gitignored; `.env.example` has placeholder values only
- [ ] Security headers set: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- [ ] `pip audit` clean (no HIGH/CRITICAL CVEs)

## A06 – Vulnerable Components
- [ ] `npm audit --audit-level=high` clean
- [ ] Docker base image is `python:3.11-slim`, not `latest`

## A07 – Auth Failures
- [ ] `access_token` expires 24h; `refresh_token` expires 30 days
- [ ] Refresh tokens stored as `httponly` cookies, not localStorage
- [ ] Token revocation on logout (invalidate in DB)
- [ ] JWT `sub` claim is UUID, not sequential integer

## A08 – Data Integrity Failures
- [ ] No `pickle.loads()` on untrusted data
- [ ] File uploads validate MIME type server-side; max 5MB enforced

## A09 – Logging Failures
- [ ] Auth failures logged without PII (`email_hash` not raw email)
- [ ] No passwords, tokens, or resume content in log lines

## A10 – SSRF
- [ ] User-supplied URLs (job import, link preview) validate scheme + block private ranges
- [ ] Gmail/Calendar MCP calls routed through service layer, not raw user URLs
