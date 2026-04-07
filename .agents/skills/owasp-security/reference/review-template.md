# Security Review Sign-off Template

Copy, fill in, and return to architect:

```
Security Review — [Feature Name] — [Date]
Reviewer: security-agent

Endpoints reviewed:
  - [METHOD /path]

Files reviewed:
  - [file path]

OWASP Checks:
  A01 Access Control:    PASS | FAIL | N/A
  A02 Crypto:            PASS | FAIL | N/A
  A03 Injection:         PASS | FAIL | N/A
  A04 Insecure Design:   PASS | FAIL | N/A
  A05 Misconfiguration:  PASS | FAIL | N/A
  A06 Components:        PASS | FAIL | N/A
  A07 Auth:              PASS | FAIL | N/A
  A08 Integrity:         PASS | FAIL | N/A
  A09 Logging:           PASS | FAIL | N/A
  A10 SSRF:              PASS | FAIL | N/A

Blockers (must fix before merge):
  [file.py:line] — [vulnerability] — [recommended fix]

Recommendations (non-blocking):
  [suggestion]

Verdict: APPROVED | BLOCKED
```
