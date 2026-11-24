-- Teams: a coach creates a team and shares a join code; athletes join it and do
-- mental reps. Coaches see only team-level aggregates, never an athlete's reps.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['player'::text, 'mentor'::text, 'coach'::text]));

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  sport text,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, player_id)
);
create index if not exists team_members_player_idx on public.team_members(player_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Membership check that bypasses RLS, so policies don't recurse.
create or replace function public.is_team_member(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members where team_id = t and player_id = auth.uid());
$$;

drop policy if exists "Coach manages own teams" on public.teams;
create policy "Coach manages own teams" on public.teams
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists "Members view their teams" on public.teams;
create policy "Members view their teams" on public.teams
  for select using (public.is_team_member(id));

drop policy if exists "Admins view teams" on public.teams;
create policy "Admins view teams" on public.teams
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Players see own memberships" on public.team_members;
create policy "Players see own memberships" on public.team_members
  for select using (player_id = auth.uid());

drop policy if exists "Players leave teams" on public.team_members;
create policy "Players leave teams" on public.team_members
  for delete using (player_id = auth.uid());

drop policy if exists "Coaches see roster" on public.team_members;
create policy "Coaches see roster" on public.team_members
  for select using (exists (select 1 from teams t where t.id = team_id and t.coach_id = auth.uid()));

drop policy if exists "Coaches remove members" on public.team_members;
create policy "Coaches remove members" on public.team_members
  for delete using (exists (select 1 from teams t where t.id = team_id and t.coach_id = auth.uid()));

-- Coach creates a team; the code is generated server-side.
create or replace function public.create_team(p_name text, p_sport text)
returns public.teams language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_team teams;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'coach') then
    raise exception 'only coaches can create teams';
  end if;
  loop
    -- No 0/O/1/I so codes are easy to read aloud.
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
      into v_code from generate_series(1, 6);
    exit when not exists (select 1 from teams where code = v_code);
  end loop;
  insert into teams (name, sport, code, coach_id)
    values (trim(p_name), nullif(trim(coalesce(p_sport, '')), ''), v_code, auth.uid())
    returning * into v_team;
  return v_team;
end;
$$;

-- Athlete joins by code. Returns the team name so the UI can confirm.
create or replace function public.join_team(p_code text)
returns table (team_id uuid, team_name text) language plpgsql security definer set search_path = public as $$
declare v_team teams;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'player') then
    raise exception 'only athletes can join a team';
  end if;
  select * into v_team from teams where code = upper(trim(p_code));
  if v_team.id is null then raise exception 'team code not found'; end if;
  insert into team_members (team_id, player_id) values (v_team.id, auth.uid())
    on conflict do nothing;
  return query select v_team.id, v_team.name;
end;
$$;

-- Weekly team aggregates for the coach. Confidence is only returned for weeks
-- where at least 3 athletes logged a rep, so no one athlete can be singled out.
create or replace function public.team_rep_summary(p_team uuid)
returns table (week date, reps bigint, athletes bigint, avg_confidence numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from teams where id = p_team and coach_id = auth.uid()) then
    raise exception 'not your team';
  end if;
  return query
    select date_trunc('week', r.created_at)::date as week,
           count(*) as reps,
           count(distinct r.player_id) as athletes,
           case when count(distinct r.player_id) >= 3
                then round(avg(case when r.mood ~ '^([1-9]|10)$' then r.mood::numeric end), 1)
           end as avg_confidence
      from reflections r
      join team_members m on m.player_id = r.player_id and m.team_id = p_team
     where r.title in ('Pre-Game Reset', 'Post-Game Debrief', 'Bad Day Reset')
       and r.created_at >= m.joined_at
       and r.created_at > now() - interval '12 weeks'
     group by 1
     order by 1;
end;
$$;

revoke all on function public.create_team(text, text) from public, anon;
revoke all on function public.join_team(text) from public, anon;
revoke all on function public.team_rep_summary(uuid) from public, anon;
grant execute on function public.create_team(text, text) to authenticated;
grant execute on function public.join_team(text) to authenticated;
grant execute on function public.team_rep_summary(uuid) to authenticated;
