-- "Get on the podcast" applications submitted from /podcast/apply.
-- Public inserts go through /api/podcast/apply with the service role, so there
-- is no anon policy; only admin-dashboard roles can read or triage them.

create table public.podcast_guest_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  guest_type text not null default 'athlete'
    check (guest_type in ('athlete', 'coach', 'expert', 'other')),
  sport text,
  affiliation text,
  social_links text,
  story text not null,
  topics text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'scheduled', 'declined')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create index podcast_guest_applications_created_at_idx
  on public.podcast_guest_applications (created_at desc);

alter table public.podcast_guest_applications enable row level security;
create policy "Admin dashboard access to guest applications" on public.podcast_guest_applications
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'outreach', 'operations'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'outreach', 'operations'));
