-- Veyrin learning-content system: materials, sequential interview practice,
-- PPT/video course assets and a small site advertisement slot.

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text default '',
  content_type text not null default 'pdf',
  access_type text not null default 'free',
  body text default '',
  file_path text,
  file_name text,
  course_id uuid references public.courses(id) on delete set null,
  upgrade_course_id uuid references public.courses(id) on delete set null,
  published boolean default false,
  featured boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.courses add column if not exists content_type text default 'standard';
alter table public.courses add column if not exists ppt_path text;
alter table public.courses add column if not exists ppt_file_name text;
alter table public.courses add column if not exists video_url text;
alter table public.courses add column if not exists video_title text;
alter table public.courses add column if not exists video_path text;
alter table public.courses add column if not exists video_file_name text;

alter table public.questions add column if not exists published boolean default true;

create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text default '',
  destination_url text not null,
  image_path text,
  image_file_name text,
  active boolean default true,
  priority integer default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.materials enable row level security;
alter table public.advertisements enable row level security;

-- Public metadata is intentionally limited to published/free material. Paid material
-- access is enforced by the server-side material page/download route.
drop policy if exists "published materials public" on public.materials;
create policy "published materials public" on public.materials
for select using (published = true and (access_type = 'free' or auth.uid() is not null));

drop policy if exists "active advertisements public" on public.advertisements;
create policy "active advertisements public" on public.advertisements
for select using (active = true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('veyrin-files', 'veyrin-files', false, 524288000)
on conflict (id) do update set public = false, file_size_limit = 524288000;

insert into storage.buckets (id, name, public, file_size_limit)
values ('veyrin-public', 'veyrin-public', true, 5242880)
on conflict (id) do update set public = true, file_size_limit = 5242880;

-- Admin APIs use the Supabase service role for uploads and CRUD. The service key is
-- never exposed to the browser.
notify pgrst, 'reload schema';
