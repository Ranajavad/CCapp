export type Book = {
  id?: string; // our DB id (uuid) once the book has been cached
  external_id: string; // Google Books volume id, or "manual:<id>"
  title: string;
  authors: string[];
  description: string | null;
  cover_url: string | null; // URL only – images are never stored
  page_count: number | null;
  published_year: number | null;
  isbn: string | null;
  categories: string[];
  language: string | null;
};

export type ShelfStatus = 'wishlist' | 'reading' | 'read';

export type LibraryEntry = {
  id: string;
  user_id: string;
  book_id: string;
  status: ShelfStatus;
  rating: number | null;
  review: string | null;
  current_page: number | null;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
  books?: Book;
};

export type BookNote = {
  id: string;
  book_id: string;
  page: number | null;
  chapter: string | null;
  body: string;
  created_at: string;
};

export type Profile = { id: string; display_name: string; bio?: string | null };

export type Club = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  join_code: string;
  current_book_id: string | null;
  books?: Book | null;
};

export type Round = {
  id: string;
  club_id: string;
  title: string;
  nominations_deadline: string;
  voting_deadline: string;
  anonymous: boolean;
  status: 'open' | 'closed';
  winner_book_id: string | null;
};

export type RoundPhase = 'nominating' | 'voting' | 'closed';

export type Meeting = {
  id: string;
  club_id: string;
  title: string;
  starts_at: string;
  place_name: string | null;
  place_address: string | null;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  book_id: string | null;
  description: string | null;
  summary: string | null;
  status: 'planned' | 'cancelled';
  created_by: string;
  books?: Book | null;
};

export type RsvpStatus = 'going' | 'maybe' | 'no';

export function roundPhase(r: Round, now = new Date()): RoundPhase {
  if (r.status === 'closed') return 'closed';
  if (now < new Date(r.nominations_deadline)) return 'nominating';
  if (now < new Date(r.voting_deadline)) return 'voting';
  return 'closed';
}
