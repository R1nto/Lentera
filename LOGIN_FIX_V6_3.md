# LENTERA V6.3 — Login dashboard redirect fix

- `POST /api/auth/login` now writes the Supabase Auth cookies on its **actual JSON response**, instead of relying on implicit response propagation.
- Middleware checks a verified Auth user ID before reading their role with a **server-only Supabase service client**. This avoids `42501` from user-role permissions during the redirect decision.
- Login uses a full navigation to send the fresh browser cookies to the dashboard.
- No SQL migration is required for this patch. Database role profiles still must exist, with `role = kepala_sekolah` for principals.

## Test
1. Keep `.env.local` in the project root (do not add it to version control). Rotate any previously exposed keys.
2. `npm ci && npm run dev`
3. Log in as Kepala Sekolah, then check `/kepala-sekolah`.
4. If the issue persists, check terminal logs for `Middleware role lookup failed` or the browser Network response for `/api/auth/login` and its Set-Cookie headers. Never paste cookies or credentials into chat.

A code inspection is not a successful end-to-end Supabase login test.
