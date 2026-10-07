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
