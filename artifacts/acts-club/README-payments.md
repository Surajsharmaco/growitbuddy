# ACTS membership payments

ACTS charges ₹99 one time (9900 paise, INR). A captured payment creates a member record with payment status `successful` and review status `pending_review`. It never approves membership or creates member-login access.

## Setup

1. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` securely to the API server environment. Use Test Mode credentials for testing; never include the key secret or webhook secret in a Vite build.
2. Run `pnpm --filter @workspace/db run migrate:acts` against the intended app database. The migration only creates the two ACTS tables. Do not run a full schema push against the production database.
3. Enable automatic payment capture in the Razorpay dashboard.
4. Configure a public HTTPS webhook pointing to the API server's `/api/acts/membership/webhook`, subscribing to `payment.captured` and `order.paid`. Its configured signing secret must match `RAZORPAY_WEBHOOK_SECRET`.
5. For the Vercel + Render deployment, provide `VITE_API_URL` to the ACTS build using the existing Render API base (including `/api`). The GrowitBuddy packaging script inherits this environment variable. In Replit, the generated client uses the managed `/api` route.
6. Deploy the backend/migration and frontend together only after release approval. Adding secrets in Replit alone does not configure the separate Render production environment.

## Safety and recovery

- A browser payment callback is not proof of payment. The server verifies its HMAC against the stored order, then checks amount, currency, order binding and capture state with Razorpay.
- Signed webhooks and authenticated status checks recover a closed browser or failed verification request.
- Checkout recovery tokens are random, stored hashed on the server, and kept in browser session storage without personal details. They authenticate only the corresponding application/status, not admin access.
- Pending form data is kept in a checkout draft so webhook recovery can work. A paid-member record is saved transactionally only after capture.
- Retrying resumes the same order. Row locking and unique order/payment constraints prevent duplicate member records across callbacks/webhook deliveries.
- The form does not collect email and must not promise email confirmation. Failed or unconfigured payments must never show success.
- Test all conditional fields, ₹99 amount, cancellation, failure, delayed capture, duplicate delivery and persisted `pending_review` before enabling Live Mode.