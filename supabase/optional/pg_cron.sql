-- Optional: announce voting winners automatically even when nobody has the app open.
-- Enable the pg_cron extension first (Dashboard -> Database -> Extensions).
-- Without this, rounds are still closed + announced the next time any club
-- member opens the club or round screen (the app calls close_due_rounds()).

select cron.schedule(
  'cc-close-due-rounds',
  '*/5 * * * *',
  $$ select public.close_due_rounds(); $$
);
