-- A club's current read is added to every member's library as "reading".
-- It happens when the owner picks a book, when a vote picks the winner (both change
-- clubs.current_book_id), and when someone joins a club that already has a current read.
-- A book that is already "reading" or "read" for a member is left alone; a "wishlist" one becomes "reading".

create or replace function public.add_current_read(p_club uuid, p_user uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b uuid;
begin
  select current_book_id into b from public.clubs where id = p_club;
  if b is null then
    return;
  end if;

  insert into public.library_entries (user_id, book_id, status, started_at)
  select m.user_id, b, 'reading', now()
  from public.club_members m
  where m.club_id = p_club and (p_user is null or m.user_id = p_user)
  on conflict (user_id, book_id) do update
    set status = 'reading',
        started_at = coalesce(public.library_entries.started_at, now()),
        updated_at = now()
    where public.library_entries.status = 'wishlist';
end;
$$;

-- Only the triggers below may call this (it bypasses row security), not API clients.
revoke execute on function public.add_current_read(uuid, uuid) from public, anon, authenticated;

create or replace function public.club_current_read_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.current_book_id is not null
     and (tg_op = 'INSERT' or new.current_book_id is distinct from old.current_book_id) then
    perform public.add_current_read(new.id);
  end if;
  return new;
end;
$$;

create trigger clubs_current_read
  after insert or update of current_book_id on public.clubs
  for each row execute function public.club_current_read_changed();

create or replace function public.member_joined_current_read()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_current_read(new.club_id, new.user_id);
  return new;
end;
$$;

create trigger club_members_current_read
  after insert on public.club_members
  for each row execute function public.member_joined_current_read();

-- Catch up: clubs that already have a current read.
do $$
declare
  c record;
begin
  for c in select id from public.clubs where current_book_id is not null loop
    perform public.add_current_read(c.id);
  end loop;
end;
$$;
