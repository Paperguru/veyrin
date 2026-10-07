-- Veyrin V9: category-aware interview/Python practice, profile editing and reliable public content.

create table if not exists public.coding_questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Python',
  difficulty text not null default 'Medium',
  prompt text not null,
  starter_code text default '',
  expected_code text not null,
  explanation text default '',
  complexity text default '',
  course_id uuid references public.courses(id) on delete set null,
  published boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists coding_questions_category_idx on public.coding_questions(category);
create index if not exists coding_questions_published_idx on public.coding_questions(published, created_at desc);

alter table public.coding_questions enable row level security;
drop policy if exists "published coding questions public" on public.coding_questions;
create policy "published coding questions public" on public.coding_questions
for select using (published = true);

notify pgrst, 'reload schema';
