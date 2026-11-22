-- The creator of a club must always be able to take part in its voting rounds
-- and date polls (nominate + vote), even if their club_members row is missing
-- (e.g. clubs created before the on_club_created trigger existed).

-- 1) Backfill: make sure every club owner is a member with role 'owner'.
insert into public.club_members (club_id, user_id, role)
select c.id, c.owner_id, 'owner'
from public.clubs c
on conflict (club_id, user_id) do update set role = 'owner';

-- 2) Membership checks also accept the club's owner directly.
create or replace function public.is_club_member(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club and user_id = auth.uid()
  ) or exists (
    select 1 from public.clubs
    where id = p_club and owner_id = auth.uid()
  );
$$;

create or replace function public.is_club_owner(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clubs
    where id = p_club and owner_id = auth.uid()
  );
$$;

create or replace function public.is_round_member(p_round uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.club_rounds r
    where r.id = p_round and public.is_club_member(r.club_id)
  );
$$;

create or replace function public.is_poll_member(p_poll uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.date_polls p
    where p.id = p_poll and public.is_club_member(p.club_id)
  );
$$;
