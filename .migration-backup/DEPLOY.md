# Deployment Guide — Koyeb + Neon + Vercel (Free)

## Overview

| Service | Purpose | Cost |
|---|---|---|
| **Neon** | PostgreSQL database | Free forever |
| **Koyeb** | Express API server | Free, always-on |
| **Vercel** | React frontend | Free, global CDN |

Do these steps in order: Neon first (you need the DB URL for Koyeb).

---

## Step 1 — Neon (Database)

1. Go to **https://neon.tech** and create a free account
2. Create a new project — name it `growitbuddy`
3. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Run the database migration against Neon (one-time setup):
   ```bash
   DATABASE_URL="your-neon-connection-string" pnpm --filter @workspace/db run push
   ```
   This creates all the tables in your Neon database.

---

## Step 2 — Koyeb (API Server)

1. Go to **https://app.koyeb.com** and create a free account
2. Click **"Create App"** → **"GitHub"**
3. Connect your GitHub repo
4. Configure the service:
   - **Branch:** `main`
   - **Build command:** `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build`
   - **Run command:** `node --enable-source-maps artifacts/api-server/dist/index.mjs`
   - **Port:** `8080`
5. Add these **Environment Variables** in the Koyeb dashboard:

   | Variable | Value |
   |---|---|
   | `PORT` | `8080` |
   | `DATABASE_URL` | your Neon connection string |
   | `SESSION_SECRET` | a long random string (e.g. 64 random chars) |
   | `ADMIN_PASSWORD` | your admin password |
   | `PORTFOLIO_PASSWORD` | your portfolio password |
   | `ALLOWED_ORIGINS` | your Vercel URL (add after Step 3, e.g. `https://growitbuddy.vercel.app`) |
   | `NODE_ENV` | `production` |

6. Deploy — Koyeb will give you a URL like `https://growitbuddy-xxx.koyeb.app`
7. Note this URL — you need it for Step 3

---

## Step 3 — Vercel (Frontend)

1. Go to **https://vercel.com** and create a free account
2. Click **"Add New Project"** → import your GitHub repo
3. Vercel will auto-detect the `vercel.json` config at the root
4. Add these **Environment Variables** in the Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-koyeb-app.koyeb.app/api` |

5. Deploy — Vercel will give you a URL like `https://growitbuddy.vercel.app`
6. Go back to **Koyeb** and update `ALLOWED_ORIGINS` to your Vercel URL

---

## Step 4 — Final Check

Visit your Vercel URL:
- Home page loads ✅
- `/admin` redirects to login ✅
- Login with your `ADMIN_PASSWORD` works ✅
- Form submissions work ✅

---

## Image Uploads — Important Note

Uploaded images (via the Media Library in the admin panel) are stored on Koyeb's server disk. **They will be lost when Koyeb redeploys your app.**

To avoid this, use **image URLs** instead of file uploads in the admin panel — paste a URL from Unsplash, Cloudinary, or any image host. The URL field works in all image pickers and is permanent.

If you need persistent file uploads in the future, the app can be updated to use Cloudinary (free tier available).

---

## Environment Variable Summary

### Koyeb (API Server)
```
PORT=8080
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
SESSION_SECRET=<64-char random string>
ADMIN_PASSWORD=<your password>
PORTFOLIO_PASSWORD=<your password>
ALLOWED_ORIGINS=https://your-app.vercel.app
NODE_ENV=production
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-koyeb-app.koyeb.app/api
```
