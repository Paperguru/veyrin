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
