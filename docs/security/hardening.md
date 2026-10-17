# 🛡️ Security Hardening & Multi-Tenant Architecture

Security is built into every layer of MasteryOS, adhering to OWASP recommendations and zero-trust engineering standards.

---

## 1. Multi-Tenant Query Isolation

- Every database query strictly filters by the authenticated user's ID (`WHERE user_id = $1`).
- **Cross-Entity Ownership Checks**: When a task is assigned to a `category_id`, `goal_id`, or `course_id`, the backend validates that the referenced entity belongs to the requesting user before committing the transaction.

---

## 2. Authentication & Session Hardening

- **Passwords**: Hashed with `bcryptjs` using 12 salt rounds.
- **httpOnly Cookies**: JWTs are transmitted strictly via `httpOnly`, `Secure`, `SameSite=Lax` cookies, completely immune to JavaScript XSS retrieval.
- **Anti-CSRF**: Double Submit Cookie protection requiring client `X-XSRF-TOKEN` headers on all mutating verbs.
- **Token Versioning**: An integer `token_version` on the user record immediately invalidates all active sessions upon password reset.
- **Generic Auth Failures**: Both non-existent accounts and wrong passwords return an identical generic error message to defeat user enumeration scans.

---

## 3. Rate Limiting & DoS Defense

Integrated `express-rate-limit` safeguards endpoints:
- **Auth Routes (`/api/auth/*`)**: 10 requests / 15 minutes per IP.
- **File Uploads (`/api/upload`)**: 20 requests / 15 minutes per IP.
- **General API Routes (`/api/*`)**: 300 requests / 15 minutes per IP.

---

## 4. Strict Zod Validation & Schema Whitelisting

- All request bodies, route parameters, and query strings are parsed through strict Zod schemas.
- Route parameters require valid UUIDv4 strings.
- Sort and order fields are whitelisted against an explicit set of allowable database columns.

---

## 5. Magic-Byte File Upload Inspection

- Uploaded files are inspected by byte signatures (magic numbers), ignoring untrusted client MIME headers.
- **Allowed Formats**: `image/png`, `image/jpeg`, `image/webp`, and `application/pdf`.
- **SVG Disallowed**: SVG uploads are rejected to eliminate embedded stored XSS scripts.
- **Randomized Storage Names**: Stored with random UUID filenames inside a non-executable volume mount.
