-- Profile pictures are now chosen from the built-in avatar set (stored as 'avatar:<id>').
-- Remove uploaded-photo URLs and stop members from uploading their own images.

update public.profiles set avatar_url = null where avatar_url is not null and avatar_url not like 'avatar:%';

alter table public.profiles
  add constraint profiles_avatar_preset check (avatar_url is null or avatar_url like 'avatar:%');

drop policy if exists avatars_insert on storage.objects;
drop policy if exists avatars_update on storage.objects;
