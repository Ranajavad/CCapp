# Chapters & Chatters (C&C)

A place where readers track their reading, discover books, run book clubs and talk about stories.

React Native (Expo + TypeScript + expo-router) for iOS and Android · Supabase backend · English and Norwegian (Bokmål) · light and dark mode.

## What's in the app

| Area | Features |
| --- | --- |
| **Log in / Register** | E-mail + password, Sign in with Apple (iPhone) and Google. They create the account on first use, so log in and register share the same options. Forgot password via a 6-digit e-mail code. |
| **Home** | "Currently reading" shelf plus a friends feed: *"Rana is reading The Seven Husbands of Evelyn Hugo"*, reviews like *"I did not expect that plot twist!"*. Friends react with emoji and comment. |
| **My Library** | Wish to read / Reading / Read, 1–5 star rating, reading progress, private notes pinned to a page or chapter, add books by search, ISBN or manually, and quick links to Norli and Ark. |
| **Discover** | Genre shelves, new releases, search and a Norwegian-only filter. Data from the free Google Books API. Only the cover **URL** is stored – never the image. |
| **Book Clubs** | Create / join with a share code, current read, nominations + voting rounds with deadlines (public or anonymous), automatic winner announcement, date polls, scheduled meetings with a Google Maps place, RSVP, on-device reminders, meeting notes and summaries. |
| **AI discussion generator** | Guided stages (warm-up → rating → characters → plot → themes → fun → wrap-up), tone and spoiler controls, a group star-rating tally, and AI meeting summaries. Falls back to built-in questions when the AI is unreachable. |

## Setup

You need [Node.js LTS](https://nodejs.org) (not installed on the machine this was generated on, so nothing here has been compiled or run yet).

```powershell
npm install
npx expo install --fix     # aligns package versions with the installed Expo SDK
copy .env.example .env     # then fill it in
npx expo start
```

Use a **development build** (`npx expo run:ios` / `run:android`, or EAS) rather than Expo Go: Sign in with Apple and the OAuth redirect need your own bundle id / URL scheme.

### 1. Supabase

1. Create a project at supabase.com and put the URL and anon key in `.env`.
2. Apply the schema: `supabase db push`, or paste `supabase/migrations/0001_init.sql` into the SQL editor.
3. **Auth → Providers**: enable Email, Google and Apple.
4. **Auth → URL configuration**: add `candc://auth-callback` to the allowed redirect URLs.
5. **Auth → Email templates → Reset password**: include the code in the mail, e.g. `Your code: {{ .Token }}`. The app asks for this code instead of using a link.
6. Optional: enable `pg_cron` and run `supabase/optional/pg_cron.sql` so voting winners are announced even when nobody has the app open. Without it, rounds are closed the next time any member opens the club.

### 2. AI discussion generator

The Anthropic key stays on the server in a Supabase Edge Function:

```powershell
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy discussion-questions
```

The model defaults to `claude-sonnet-5-5`; override with the `ANTHROPIC_MODEL` secret.

### 3. Google Maps (optional)

Enable **Places API (New)** in Google Cloud and set `EXPO_PUBLIC_GOOGLE_PLACES_KEY` (restrict the key to your app). Without it, members type the place by hand; either way a meeting's place opens in Google Maps.

## Notes and limitations

- **Norli / Ark** have no public catalogue API. The app finds books through Google Books (search by title or ISBN) and opens Norli's and Ark's own search pages. The URL patterns are in `lib/stores.ts` and were not verified against the live sites.
- **Meeting reminders** are local notifications scheduled on each member's device when they RSVP "going" or open the meeting list. Server-sent push notifications (e.g. "the winner has been announced") are not included.
- Profiles are readable by every signed-in user so friends can be found by name. Libraries and notes are private; the feed is visible to you and your accepted friends.
- Translations live in `lib/i18n/translations.ts`; the Norwegian file must define exactly the same keys as English (checked by TypeScript).
- Run `npm run typecheck` after installing.

## Structure

```
app/            expo-router screens (auth, tabs, book, club/*, discussion, friends)
components/     UI kit and shared widgets
lib/            supabase client, auth, theme, i18n, book API, places, notifications
supabase/       SQL migration (tables + RLS + voting logic) and the edge function
assets/         C&C logo / icon / splash
```
