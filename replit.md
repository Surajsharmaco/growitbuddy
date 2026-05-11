# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: GrowitBuddy

A premium content authority & marketing website with full admin panel, blog, influencer directory, and lead capture.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4
- **Animations**: Framer Motion + Three.js / R3F

## Artifacts

- **`artifacts/growitbuddy`** — Main website frontend (React + Vite), served at `/`
- **`artifacts/api-server`** — Express API server, served at `/api`
- **`artifacts/mockup-sandbox`** — Design prototyping sandbox, served at `/__mockup`

## API Routes

- `GET  /api/healthz` — health check
- `GET  /api/admin/public/content/:section` — public content by section
- `POST /api/admin/login` — super-admin login
- `POST /api/admin/team/login` — team member login
- `GET  /api/admin/verify` — verify token
- `POST /api/admin/logout` — logout
- `GET/POST/PUT/DELETE /api/admin/content/:section` — CMS content management
- `GET/POST/PUT/DELETE /api/admin/influencers` — influencer management
- `GET /api/admin/leads` — view form submissions
- `GET/POST/PUT/DELETE /api/admin/certificates` — certificates
- `GET/POST/PUT/DELETE /api/admin/team` — team members
- `POST /api/admin/upload` — image upload
- `GET /api/admin/media` — media library
- `GET /api/admin/logos/public` — public logos fetch (Work page)
- `GET/POST/PUT/DELETE /api/admin/logos` — logo management (admin)
- `POST /api/forms/contact` — contact form
- `POST /api/forms/creators` — creator onboarding
- `POST /api/forms/page-owner` — page owner application
- `POST /api/forms/freelancers` — freelancer application
- `POST /api/forms/full-time` — full-time job application
- `POST /api/forms/internship` — internship application
- `POST /api/forms/newsletter` — newsletter signup
- `POST /api/admin/ai-seo` — AI SEO analysis

## Database Schema

- `site_content` — CMS content (section → JSON data)
- `leads` — form submissions
- `certificates` — issued certificates
- `team_members` — admin team accounts
- `client_logos` — logos shown on Work page (id, image_url, alt_text, sort_order)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit DB)
- `ADMIN_PASSWORD` — super-admin password for admin panel login
- `PORT` — API server port (set by workflow, default 8080)
- `RESEND_API_KEY` — (optional) for email notifications on form submissions
- `NOTIFY_EMAIL` — (optional) email to receive form notification emails
- `UPLOADS_DIR` — (optional) custom directory for uploaded images

## Design System

**Premium editorial / consulting-level** light theme. No purple, no bright colors, no gradients.

### CSS Variables (`artifacts/growitbuddy/src/index.css`)
- `--gb-bg`: #F8F8F6 (warm white primary background)
- `--gb-bg2`: #EFEFEA (warm off-white secondary sections)
- `--gb-card`: #FFFFFF — border: #E5E5E0 — 10px radius
- `--gb-text`: #0A0A0A / `--gb-text2`: #5F5F5F / `--gb-muted`: #8A8A8A
- `--gb-authority`: #1E293B (ink blue — active states, headings, links)
- `--gb-accent`: #8B3A1A (burnt rust — CTA buttons, used selectively)
- `--gb-accent-hover`: #A34722
- `--gb-gold`: #C2A878 (soft gold micro-accent — icons, separators)

### Component Classes
- `gb-btn` — burnt rust button (6px radius, white text)
- `gb-btn-outline` — ink blue outline button
- `gb-card`, `gb-badge`, `gb-input`, `gb-eyebrow`, `gb-gold-underline`

### Design Rules
- Footer: ink blue `#1E293B` bg — authority contrast element
- `.accent-creator` override: deep rust-red `#7C2D12`
- Active nav pills: burnt rust bg with white text
- Hero: "Content without distribution is invisible." | CTAs: "Get your growth breakdown" / "See how it works"

## Website Pages (correct routes)

- `/` — Home (hero, stats, services, framework, testimonials)
- `/services` — Services overview
- `/work` — Portfolio / case studies
- `/framework` — Methodology
- `/insights` — Blog / insights listing
- `/insights/:slug` — Blog post detail
- `/creators` — Creator onboarding (NetworkApplyForm)
- `/freelancers` — Freelancer applications
- `/full-time` — Full-time jobs
- `/internship` — Internship applications
- `/influencers` — Influencer directory
- `/influencers/:slug` — Influencer profile
- `/distribution` — Distribution network
- `/join` — Network join (choose path)
- `/join/page-owner` — Page owner application
- `/authority-audit` — Free authority audit tool
- `/resources` — Resources page
- `/about` — About page
- `/contact` — Contact page
- `/verify` — Certificate verification
- `/verify/:id` — Specific certificate
- `/creator-school` — Creator School onboarding hub (VSL, guidelines, assets, submission, FAQ)
- `/admin` — Admin panel (password protected)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
