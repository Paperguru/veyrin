# Veyrin AI Career Platform

Next.js 16 + Supabase career/learning platform with protected interview products and Razorpay payments.

## Run locally

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and configure Supabase, Razorpay, admin email and OpenAI values.

## Supabase setup

Run the base schema first:

```text
supabase/schema.sql
```

Then run these migrations in Supabase SQL Editor:

```text
supabase/migrations/20261005_payment_orders.sql
supabase/migrations/20261005_genai_bank_seed.sql
```

The second migration ensures the ₹199 **GenAI Engineer Interview Question Bank — India** has real questions in `public.questions`.

## Purchase flow

1. User clicks Buy on a course.
2. If not signed in, Veyrin sends the user to `/login?next=<course>`.
3. After sign-in, the user is returned to the exact course they started from.
4. Razorpay creates the order server-side.
5. Browser callback and server-side Razorpay status polling can confirm payment.
6. A verified/captured payment creates an active row in `public.enrollments`.
7. The purchased course page changes from **Buy** to **Open**.
8. The dashboard and `/profile` show purchased courses.

## Admin

Use the normal `/login`. If the authenticated email matches `ADMIN_EMAIL`, Veyrin sends the user to `/admin` and shows the Admin navigation option.

## GenAI interview bank

Protected route:

```text
/interview/genai-india
```

The ₹199 product slug is:

```text
genai-engineer-interview-bank-india
```

## Learning content update — 2026-10-07

This version keeps the existing Veyrin UI, authentication, course catalog, Razorpay payment flow, GenAI ₹199 product, AI Studio and branding, while adding:

- **Admin → Add material:** upload PDF/document material as Free or Paid, publish/unpublish, link paid access to a course, and optionally attach a paid upgrade to free material.
- **Interview Material section:** published material appears on the home page and `/materials`.
- **Sequential interview practice:** admin can paste `Q1... / A1...` pairs. Veyrin detects each pair and creates individual questions. The user writes an answer, submits it, sees the expected answer, and continues. There is no score.
- **Course files:** add PowerPoint files and video URLs or direct video files to courses. Paid course assets are protected behind enrollment.
- **Advertisement:** admin can create a compact right-side website advertisement with title, text, destination link and optional image.
- **Browser tab logo:** Veyrin favicon is included as `app/icon.svg`.
- **Secure storage:** learning/course files are stored in a private Supabase Storage bucket and served with short-lived signed URLs. Advertisement images use a public bucket.

### Supabase setup

Run `supabase/migrations/20261007_learning_content_system.sql` in the existing Veyrin/PaperGuru Supabase project after the earlier Veyrin migrations. It creates the new tables/columns and storage buckets.

No new environment variables are required. Keep the existing Supabase, Razorpay and OpenAI environment variables.

### Question paste format

```text
Q1. What is Agentic AI?
A1. An agentic system uses a model, state and tools to decide and execute actions toward a goal.

Q2. What is MCP?
A2. MCP is a protocol for connecting AI applications with external tools and context.
```

The parser also accepts `Question 1:` / `Answer 1:` style labels.

## V9 learning/content reliability update — 2026-10-07

This update keeps the existing Veyrin UI and product/payment architecture while fixing content visibility and adding:

- Published interview material now appears on the home page without requiring `featured=true`.
- Advertisement delivery uses a no-cache public endpoint so new active ads appear without a redeploy; public ad images use the public Supabase bucket.
- Interview questions are category-aware in Admin and Interview Lab.
- Python coding practice has category-aware Admin creation and a learner flow where submitted code is followed by the expected solution.
- AI Studio can generate material drafts, interview Q&A and Python coding sets by category.
- Profile name can be changed from `/profile`.
- Login/signup explicitly state that passwords are case-sensitive.
- Forgot-password uses Supabase password reset and `/auth/callback` → `/reset-password`.

### Supabase migration

Apply:

`supabase/migrations/20261007_learning_content_system_v2.sql`

It adds the `coding_questions` table and indexes. Keep the earlier learning-content migration as well.

### Supabase Auth redirect

For production password reset, allow the production callback URL in Supabase Authentication URL Configuration:

`https://veyrin.in/auth/callback`

Also keep the local development callback if you use localhost during development.
