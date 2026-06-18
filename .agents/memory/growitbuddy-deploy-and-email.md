---
name: GrowitBuddy Resend lead-email enablement
description: Why the lead-notification email doesn't deliver in prod and the simplest non-technical fix.
---

# Lead-notification email (Resend)
- Code path is correct and resilient: `forms.ts sendEmail()` reads `RESEND_API_KEY`; if unset it logs a clear error and skips sending (no crash). `resend` pkg is in deps and imports fine.
- Sender `FROM = EMAIL_FROM || "GrowitBuddy <onboarding@resend.dev>"`. **The shared `onboarding@resend.dev` sender only delivers to the email that OWNS the Resend account** — that is why mail "doesn't work" even when a key is set under a mismatched account.
- Simplest enablement for the non-technical owner (no domain verification):
  1. Sign up at resend.com **using the destination Gmail** (`cs.growitbuddy@gmail.com`).
  2. Create an API key.
  3. Add `RESEND_API_KEY` in **Render → Environment** (prod env lives in Render, NOT Replit — Replit is dev-only). Render auto-redeploys.
- For a branded sender / to email other addresses: verify a domain in Resend, set `EMAIL_FROM` in Render.

**Why it matters:** prod runs on Render+Vercel+Neon and deploys from GitHub `main`; any prod secret (incl. `RESEND_API_KEY`) must be set in Render, not requested via Replit secrets.

# Admin Backup/Migration feature needs GITHUB_TOKEN on Render
- The super-admin "Backup / Migration" page (`GET /api/admin/backup`) fetches the repo zipball from GitHub and requires `GITHUB_TOKEN`. If unset it returns "GITHUB_TOKEN not set — backup needs it to fetch the source code from GitHub." (code is correct, no bug).
- Dev (Replit) has ALL secrets (GITHUB_TOKEN, ADMIN_PASSWORD, DATABASE_URL, SESSION_SECRET) so the feature works in the dev preview; the live error means **Render is missing GITHUB_TOKEN**. Fix = add `GITHUB_TOKEN` in Render → Environment (same value the user can copy from Replit Secrets), redeploy. `GITHUB_REPO`/`GITHUB_BRANCH` have defaults (`Surajsharmaco/growitbuddy`/`main`).
- **Why:** same Render-prod-env rule as Resend — any prod-only env var the feature needs must be set in Render, not Replit.

**Safety net:** every form submission is saved to the `leads` table and shows in the admin Leads/CRM section regardless of email status — email is only the notification channel, leads are never lost if it's off.
