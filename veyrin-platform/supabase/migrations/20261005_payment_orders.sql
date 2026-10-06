-- Veyrin payment ledger migration.
-- Run this once in Supabase SQL Editor if payment checkout reports:
-- "Could not find the table 'public.payment_orders' in the schema cache".

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists payment_orders_user_idx on public.payment_orders(user_id);
create index if not exists payment_orders_course_idx on public.payment_orders(course_id);

alter table public.payment_orders enable row level security;

drop policy if exists "users can read own payment orders" on public.payment_orders;
create policy "users can read own payment orders"
on public.payment_orders for select
using (auth.uid() = user_id);

-- Ask PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
