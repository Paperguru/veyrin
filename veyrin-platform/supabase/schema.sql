-- Veyrin initial production schema
create extension if not exists pgcrypto;
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, role text default 'learner', created_at timestamptz default now());
create table if not exists public.courses (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, description text, role text, level text, duration text, price integer default 0, cover_emoji text default '✦', published boolean default false, featured boolean default false, created_at timestamptz default now());
create table if not exists public.lessons (id uuid primary key default gen_random_uuid(), course_id uuid references public.courses(id) on delete cascade, title text not null, content jsonb default '{}'::jsonb, position integer default 0, video_url text, published boolean default false, created_at timestamptz default now());
create table if not exists public.questions (id uuid primary key default gen_random_uuid(), course_id uuid references public.courses(id) on delete set null, category text, role text, difficulty text, question text not null, answer text, explanation text, tags text[] default '{}', created_at timestamptz default now());
create table if not exists public.enrollments (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, course_id uuid references public.courses(id) on delete cascade, status text default 'active', progress integer default 0, created_at timestamptz default now(), unique(user_id,course_id));
create table if not exists public.content_drafts (id uuid primary key default gen_random_uuid(), created_by uuid references auth.users(id) on delete set null, content_type text not null, title text, source_brief text, difficulty text, content jsonb not null, status text default 'draft', created_at timestamptz default now());
create table if not exists public.question_attempts (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, question_id uuid references public.questions(id) on delete cascade, correct boolean, answer text, created_at timestamptz default now());

alter table public.profiles enable row level security; alter table public.content_drafts enable row level security; alter table public.courses enable row level security; alter table public.lessons enable row level security; alter table public.questions enable row level security; alter table public.enrollments enable row level security; alter table public.question_attempts enable row level security;
create policy "published courses public" on public.courses for select using (published=true or auth.uid()=null);
create policy "published lessons public" on public.lessons for select using (published=true);
drop policy if exists "published questions public" on public.questions;
create policy "own profile" on public.profiles for select using (auth.uid()=id);
create policy "own enrollment" on public.enrollments for select using (auth.uid()=user_id);
create policy "own attempts" on public.question_attempts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Admin writes should use a server-side service role or a dedicated admin RPC after your auth role is configured.

create policy "admins can read own drafts" on public.content_drafts for select using (auth.uid()=created_by);

-- Launch product: GenAI Engineer Interview Question Bank — India (₹199)
insert into public.courses (slug,title,description,role,level,duration,price,cover_emoji,published,featured)
values ('genai-engineer-interview-bank-india','GenAI Engineer Interview Question Bank — India','A focused interview bank covering Python, LLMs, RAG, agents, evaluation and system design for GenAI Engineer interviews in India.','GenAI Engineer','Intermediate → Advanced','Self paced',199,'₹',true,true)
on conflict (slug) do update set price=excluded.price, published=true, featured=true;

-- The service-role admin API performs protected CRUD; it bypasses RLS and never exposes the service key to the browser.

-- Starter questions for the ₹199 India GenAI bank.
insert into public.questions (course_id,category,role,difficulty,question,answer,tags)
select c.id,'RAG','GenAI Engineer','Hard','Design a production RAG system for a large Indian enterprise. How would you control hallucinations, retrieval quality and sensitive data?','A strong answer should cover hybrid retrieval, reranking, chunking, metadata filters, evaluation datasets, grounded generation, citation checks, PII controls, access-aware retrieval, observability and fallback behavior.','{"rag","evaluation","security","system-design"}'
from public.courses c where c.slug='genai-engineer-interview-bank-india'
and not exists (select 1 from public.questions q where q.course_id=c.id and q.question like 'Design a production RAG system%');

insert into public.questions (course_id,category,role,difficulty,question,answer,tags)
select c.id,'LLM','GenAI Engineer','Hard','An LLM application is accurate in offline testing but fails after deployment. How would you diagnose the issue?','Separate retrieval, prompt, model, tool and data-drift failures. Add traces, slice production traffic, compare offline and online distributions, inspect retrieved context, measure groundedness and latency, and reproduce failures in a regression suite.','{"llm","debugging","observability"}'
from public.courses c where c.slug='genai-engineer-interview-bank-india'
and not exists (select 1 from public.questions q where q.course_id=c.id and q.question like 'An LLM application is accurate%');

-- Razorpay production payment ledger.
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
create policy "users can read own payment orders" on public.payment_orders for select using (auth.uid()=user_id);

-- Refresh PostgREST after schema deployment.
notify pgrst, 'reload schema';

-- See supabase/migrations/20261005_genai_bank_seed.sql for the complete starter bank and idempotent question seed.
