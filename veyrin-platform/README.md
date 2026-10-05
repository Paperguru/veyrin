# Veyrin — AI Career Preparation Platform

A production-oriented Next.js starter for Veyrin: AI Engineer, GenAI, Agentic AI, ML and Data Science interview preparation plus courses, Python coding practice and video learning.

## Stack
- Next.js 16.3.8 + App Router
- React 19
- TypeScript
- Supabase Auth / Postgres / RLS-ready schema
- OpenAI Responses API for the admin AI content studio
- YouTube IFrame embeds
- Plain CSS design system (easy to customize)

Next.js 16.3.8 is the current patched Active LTS referenced in the September 2026 security release. Supabase's current Next.js guidance uses `@supabase/ssr` and cookie-based auth. The admin AI generator uses the Responses API, not the retired Assistants API. See the official docs in the project notes/source links.

## Run locally
1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `supabase/schema.sql` in Supabase SQL Editor.
4. Set `ADMIN_EMAIL` to your admin login email.
5. Add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` for AI generation.
6. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Admin
Go to `/admin/login` and sign in with the configured admin email. The control center provides product creation, price editing, publishing, manual material drafts, interview-question creation and the AI studio. The AI studio can generate:
- interview question sets
- course lessons
- Python coding sets
- revision notes
- mock interview structures

Generated material is saved as a reviewable draft. Product and price changes are written server-side using the Supabase service role key; that key is never exposed to the browser.

## Payments
The UI is prepared for paid courses, but payment processing is intentionally not hard-coded into this first zip. Add Razorpay after the catalog and enrollment schema are verified. Never expose the Razorpay secret key in the browser.

## Video
YouTube videos can be embedded by URL. The `videos` page contains a placeholder. Replace it with your channel videos or connect the admin video library to Supabase. YouTube's official IFrame API supports embedded playback and playlists.

## Production hardening before launch
- Add a proper admin role/claims strategy instead of relying only on `ADMIN_EMAIL`.
- Add server-side admin CRUD using Supabase service role in protected route handlers.
- Add payment verification/webhooks.
- Add protected course content and enrollment checks.
- Add rate limiting to the AI endpoint.
- Add a secure code-execution sandbox for Python questions; never execute learner code directly in the Next.js server.
- Add analytics, email verification, password reset and legal pages.
- Replace example.com in `app/robots.ts` and `app/sitemap.ts` with the real Veyrin domain.
