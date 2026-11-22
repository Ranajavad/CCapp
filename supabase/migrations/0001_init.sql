-- Chapters & Chatters (C&C) – initial schema
-- Run with `supabase db push`, or paste into the Supabase SQL editor.
--
-- Notes
--  * Book cover images are NEVER stored: books.cover_url holds only the URL
--    returned by the book API.
--  * Every table has Row Level Security enabled.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Reader',
  bio text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Reader'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Books (metadata cache from the book API; cover_url is a URL only)
-- ---------------------------------------------------------------------------
create table public.books (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  title text not null,
  authors text[] not null default '{}',
  description text,
  cover_url text,
  page_count int,
  published_year int,
  isbn text,
  categories text[] not null default '{}',
  language text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- My library (private)
-- ---------------------------------------------------------------------------
create table public.library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  status text not null check (status in ('wishlist', 'reading', 'read')),
  rating smallint check (rating between 1 and 5),
  review text,
  current_page int check (current_page >= 0),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table public.book_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  page int,
  chapter text,
  body text not null,
  created_at timestamptz not null default now()
);

create index on public.book_notes (user_id, book_id);

-- ---------------------------------------------------------------------------
-- Friends + feed
-- ---------------------------------------------------------------------------
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  type text not null check (type in ('started', 'finished', 'review')),
  body text,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index on public.activity (user_id, created_at desc);

create table public.reactions (
  activity_id uuid not null references public.activity (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id, emoji)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index on public.comments (activity_id, created_at);

-- ---------------------------------------------------------------------------
-- Book clubs
-- ---------------------------------------------------------------------------
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  current_book_id uuid references public.books (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create function public.is_club_member(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club and user_id = auth.uid()
  );
$$;

create function public.is_club_owner(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club and user_id = auth.uid() and role = 'owner'
  );
$$;

create function public.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.club_members (club_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_club_created
  after insert on public.clubs
  for each row execute function public.add_owner_as_member();

create function public.join_club_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  select id into c from public.clubs where join_code = upper(trim(p_code));
  if c is null then
    raise exception 'invalid_code';
  end if;
  insert into public.club_members (club_id, user_id, role)
  values (c, auth.uid(), 'member')
  on conflict do nothing;
  return c;
end;
$$;

create table public.club_announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  kind text not null default 'info' check (kind in ('info', 'winner')),
  body text not null,
  book_id uuid references public.books (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Nominations + voting rounds
-- ---------------------------------------------------------------------------
create table public.club_rounds (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  nominations_deadline timestamptz not null,
  voting_deadline timestamptz not null,
  anonymous boolean not null default false,
  status text not null default 'open' check (status in ('open', 'closed')),
  winner_book_id uuid references public.books (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (voting_deadline > nominations_deadline)
);

create table public.round_nominations (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.club_rounds (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  nominated_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (round_id, book_id),
  unique (id, round_id)
);

create table public.round_votes (
  round_id uuid not null references public.club_rounds (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  nomination_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (round_id, user_id),
  foreign key (nomination_id, round_id)
    references public.round_nominations (id, round_id) on delete cascade
);

-- 'nominating' | 'voting' | 'closed'
create function public.round_phase(p_round uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when r.status = 'closed' then 'closed'
    when now() < r.nominations_deadline then 'nominating'
    when now() < r.voting_deadline then 'voting'
    else 'closed'
  end
  from public.club_rounds r
  where r.id = p_round;
$$;

create function public.is_round_member(p_round uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.club_rounds r
    join public.club_members m on m.club_id = r.club_id
    where r.id = p_round and m.user_id = auth.uid()
  );
$$;

create function public.is_round_anonymous(p_round uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select anonymous from public.club_rounds where id = p_round), true);
$$;

-- Vote totals. For anonymous rounds they are hidden until the round is closed.
create function public.round_results(p_round uuid)
returns table (nomination_id uuid, votes bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.club_rounds;
begin
  select * into r from public.club_rounds where id = p_round;
  if r.id is null or not public.is_club_member(r.club_id) then
    return;
  end if;
  if r.anonymous and r.status <> 'closed' then
    return;
  end if;
  return query
    select n.id, count(v.user_id)
    from public.round_nominations n
    left join public.round_votes v on v.nomination_id = n.id
    where n.round_id = p_round
    group by n.id;
end;
$$;

-- Internal: tally, set the winner, make it the club's current read and
-- announce it. Not callable by clients directly.
create function public._finalize_round(p_round uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.club_rounds;
  wb uuid;
  wt text;
begin
  select * into r from public.club_rounds where id = p_round for update;
  if r.id is null or r.status = 'closed' then
    return;
  end if;

  select n.book_id into wb
  from public.round_nominations n
  left join public.round_votes v on v.nomination_id = n.id
  where n.round_id = p_round
  group by n.id, n.book_id, n.created_at
  order by count(v.user_id) desc, n.created_at asc
  limit 1;

  update public.club_rounds
     set status = 'closed', winner_book_id = wb
   where id = p_round;

  if wb is not null then
    update public.clubs set current_book_id = wb where id = r.club_id;
    select title into wt from public.books where id = wb;
    insert into public.club_announcements (club_id, kind, body, book_id)
    values (r.club_id, 'winner', wt, wb);
  end if;
end;
$$;

revoke all on function public._finalize_round(uuid) from public, anon, authenticated;

-- Closes every round whose voting deadline has passed. Called by the app
-- whenever a club/round screen opens, and (optionally) by pg_cron – see
-- supabase/optional/pg_cron.sql.
create function public.close_due_rounds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  x uuid;
  n int := 0;
begin
  for x in
    select id from public.club_rounds
    where status = 'open' and voting_deadline <= now()
  loop
    perform public._finalize_round(x);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Owner can end voting early.
create function public.finalize_round_now(p_round uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c uuid;
begin
  select club_id into c from public.club_rounds where id = p_round;
  if c is null or not public.is_club_owner(c) then
    raise exception 'forbidden';
  end if;
  perform public._finalize_round(p_round);
end;
$$;

-- ---------------------------------------------------------------------------
-- Meetings, RSVP, notes, date polls
-- ---------------------------------------------------------------------------
create table public.club_meetings (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  place_name text,
  place_address text,
  place_id text,
  lat double precision,
  lng double precision,
  book_id uuid references public.books (id) on delete set null,
  description text,
  summary text,
  status text not null default 'planned' check (status in ('planned', 'cancelled')),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_meeting_member(p_meeting uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.club_meetings mt
    join public.club_members m on m.club_id = mt.club_id
    where mt.id = p_meeting and m.user_id = auth.uid()
  );
$$;

create table public.meeting_rsvps (
  meeting_id uuid not null references public.club_meetings (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status text not null check (status in ('going', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

create table public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.club_meetings (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.date_polls (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  closes_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  meeting_id uuid references public.club_meetings (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_poll_member(p_poll uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.date_polls p
    join public.club_members m on m.club_id = p.club_id
    where p.id = p_poll and m.user_id = auth.uid()
  );
$$;

create function public.can_manage_poll(p_poll uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.date_polls p
    where p.id = p_poll
      and (p.created_by = auth.uid() or public.is_club_owner(p.club_id))
  );
$$;

create table public.date_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.date_polls (id) on delete cascade,
  starts_at timestamptz not null
);

create table public.date_poll_votes (
  option_id uuid not null references public.date_poll_options (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.library_entries enable row level security;
alter table public.book_notes enable row level security;
alter table public.friendships enable row level security;
alter table public.activity enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_announcements enable row level security;
alter table public.club_rounds enable row level security;
alter table public.round_nominations enable row level security;
alter table public.round_votes enable row level security;
alter table public.club_meetings enable row level security;
alter table public.meeting_rsvps enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.date_polls enable row level security;
alter table public.date_poll_options enable row level security;
alter table public.date_poll_votes enable row level security;

-- profiles: any signed-in user can find people; you edit only your own.
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- books: shared metadata cache
create policy books_select on public.books for select to authenticated using (true);
create policy books_insert on public.books for insert to authenticated with check (true);

-- library + notes: strictly private
create policy library_all on public.library_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notes_all on public.book_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- friendships
create policy friendships_select on public.friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy friendships_insert on public.friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
create policy friendships_update on public.friendships for update to authenticated
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
create policy friendships_delete on public.friendships for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- activity feed: me + my accepted friends
create policy activity_select on public.activity for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy activity_insert on public.activity for insert to authenticated
  with check (user_id = auth.uid());
create policy activity_delete on public.activity for delete to authenticated
  using (user_id = auth.uid());

create policy reactions_select on public.reactions for select to authenticated
  using (exists (select 1 from public.activity a where a.id = activity_id));
create policy reactions_insert on public.reactions for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from public.activity a where a.id = activity_id));
create policy reactions_delete on public.reactions for delete to authenticated
  using (user_id = auth.uid());

create policy comments_select on public.comments for select to authenticated
  using (exists (select 1 from public.activity a where a.id = activity_id));
create policy comments_insert on public.comments for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from public.activity a where a.id = activity_id));
create policy comments_delete on public.comments for delete to authenticated
  using (user_id = auth.uid());

-- clubs
create policy clubs_select on public.clubs for select to authenticated
  using (owner_id = auth.uid() or public.is_club_member(id));
create policy clubs_insert on public.clubs for insert to authenticated
  with check (owner_id = auth.uid());
create policy clubs_update on public.clubs for update to authenticated
  using (public.is_club_owner(id)) with check (public.is_club_owner(id));
create policy clubs_delete on public.clubs for delete to authenticated
  using (public.is_club_owner(id));

create policy members_select on public.club_members for select to authenticated
  using (public.is_club_member(club_id));
create policy members_delete on public.club_members for delete to authenticated
  using ((user_id = auth.uid() and role <> 'owner') or public.is_club_owner(club_id));

create policy announcements_select on public.club_announcements for select to authenticated
  using (public.is_club_member(club_id));

-- rounds
create policy rounds_select on public.club_rounds for select to authenticated
  using (public.is_club_member(club_id));
create policy rounds_insert on public.club_rounds for insert to authenticated
  with check (public.is_club_owner(club_id) and created_by = auth.uid());
create policy rounds_delete on public.club_rounds for delete to authenticated
  using (public.is_club_owner(club_id));

create policy nominations_select on public.round_nominations for select to authenticated
  using (public.is_round_member(round_id));
create policy nominations_insert on public.round_nominations for insert to authenticated
  with check (nominated_by = auth.uid()
    and public.is_round_member(round_id)
    and public.round_phase(round_id) = 'nominating');
create policy nominations_delete on public.round_nominations for delete to authenticated
  using (nominated_by = auth.uid() and public.round_phase(round_id) = 'nominating');

-- votes: you always see your own; others' only when the round is not anonymous
create policy votes_select on public.round_votes for select to authenticated
  using (user_id = auth.uid()
    or (public.is_round_member(round_id) and not public.is_round_anonymous(round_id)));
create policy votes_insert on public.round_votes for insert to authenticated
  with check (user_id = auth.uid()
    and public.is_round_member(round_id)
    and public.round_phase(round_id) = 'voting');
create policy votes_update on public.round_votes for update to authenticated
  using (user_id = auth.uid() and public.round_phase(round_id) = 'voting')
  with check (user_id = auth.uid() and public.round_phase(round_id) = 'voting');
create policy votes_delete on public.round_votes for delete to authenticated
  using (user_id = auth.uid() and public.round_phase(round_id) = 'voting');

-- meetings
create policy meetings_select on public.club_meetings for select to authenticated
  using (public.is_club_member(club_id));
create policy meetings_insert on public.club_meetings for insert to authenticated
  with check (public.is_club_owner(club_id) and created_by = auth.uid());
create policy meetings_update on public.club_meetings for update to authenticated
  using (created_by = auth.uid() or public.is_club_owner(club_id))
  with check (created_by = auth.uid() or public.is_club_owner(club_id));
create policy meetings_delete on public.club_meetings for delete to authenticated
  using (created_by = auth.uid() or public.is_club_owner(club_id));

create policy rsvps_select on public.meeting_rsvps for select to authenticated
  using (public.is_meeting_member(meeting_id));
create policy rsvps_insert on public.meeting_rsvps for insert to authenticated
  with check (user_id = auth.uid() and public.is_meeting_member(meeting_id));
create policy rsvps_update on public.meeting_rsvps for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rsvps_delete on public.meeting_rsvps for delete to authenticated
  using (user_id = auth.uid());

create policy mnotes_select on public.meeting_notes for select to authenticated
  using (public.is_meeting_member(meeting_id));
create policy mnotes_insert on public.meeting_notes for insert to authenticated
  with check (user_id = auth.uid() and public.is_meeting_member(meeting_id));
create policy mnotes_delete on public.meeting_notes for delete to authenticated
  using (user_id = auth.uid());

-- date polls
create policy polls_select on public.date_polls for select to authenticated
  using (public.is_club_member(club_id));
create policy polls_insert on public.date_polls for insert to authenticated
  with check (public.is_club_member(club_id) and created_by = auth.uid());
create policy polls_update on public.date_polls for update to authenticated
  using (public.can_manage_poll(id)) with check (public.can_manage_poll(id));
create policy polls_delete on public.date_polls for delete to authenticated
  using (public.can_manage_poll(id));

create policy options_select on public.date_poll_options for select to authenticated
  using (public.is_poll_member(poll_id));
create policy options_insert on public.date_poll_options for insert to authenticated
  with check (public.can_manage_poll(poll_id));
create policy options_delete on public.date_poll_options for delete to authenticated
  using (public.can_manage_poll(poll_id));

create policy pollvotes_select on public.date_poll_votes for select to authenticated
  using (exists (
    select 1 from public.date_poll_options o
    where o.id = option_id and public.is_poll_member(o.poll_id)));
create policy pollvotes_insert on public.date_poll_votes for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.date_poll_options o
    where o.id = option_id and public.is_poll_member(o.poll_id)));
create policy pollvotes_delete on public.date_poll_votes for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

revoke execute on function public.close_due_rounds() from public, anon;
revoke execute on function public.finalize_round_now(uuid) from public, anon;
revoke execute on function public.join_club_by_code(text) from public, anon;
revoke execute on function public.round_results(uuid) from public, anon;
grant execute on function public.close_due_rounds() to authenticated;
grant execute on function public.finalize_round_now(uuid) to authenticated;
grant execute on function public.join_club_by_code(text) to authenticated;
grant execute on function public.round_results(uuid) to authenticated;
