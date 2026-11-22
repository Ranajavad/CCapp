import 'react-native-url-polyfill/auto';
import { supabase } from './supabase';
import type { Book } from './types';

// Free book data from the Google Books API (no key required; a key only raises quota).
// We store the cover *URL* returned by the API – never the image itself.
// Open Library is used automatically when Google Books is rate-limited.
const BASE = 'https://www.googleapis.com/books/v1/volumes';
const KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY;

function cleanText(s?: string | null): string | null {
  if (!s) return null;
  return (
    s
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim() || null
  );
}

function coverFrom(links: any): string | null {
  const u: string | undefined = links?.thumbnail ?? links?.smallThumbnail;
  return u ? u.replace('http://', 'https://').replace('&edge=curl', '') : null;
}

function mapVolume(v: any): Book {
  const i = v.volumeInfo ?? {};
  const ids: any[] = i.industryIdentifiers ?? [];
  const isbn = (ids.find((x) => x.type === 'ISBN_13') ?? ids.find((x) => x.type === 'ISBN_10'))?.identifier ?? null;
  const year = parseInt(String(i.publishedDate ?? '').slice(0, 4), 10);
  return {
    external_id: v.id,
    title: [i.title, i.subtitle].filter(Boolean).join(': '),
    authors: i.authors ?? [],
    description: cleanText(i.description),
    cover_url: coverFrom(i.imageLinks),
    page_count: i.pageCount || null,
    published_year: Number.isFinite(year) ? year : null,
    isbn,
    categories: i.categories ?? [],
    language: i.language ?? null,
  };
}

/** Turns a bare ISBN into an `isbn:` query, otherwise returns the text unchanged. */
function normalizeQuery(q: string): string {
  const digits = q.replace(/[-\s]/g, '');
  return /^\d{9}[\dXx]$|^\d{13}$/.test(digits) ? `isbn:${digits}` : q.trim();
}

// ---- Open Library (free, no key) – automatic fallback when Google Books is rate-limited ----
const OL = 'https://openlibrary.org';
const OL_LANG: Record<string, string> = { no: 'nor', en: 'eng' };

function mapOpenLibraryDoc(d: any): Book {
  return {
    external_id: `ol:${d.key}`, // e.g. ol:/works/OL45804W
    title: d.title ?? '',
    authors: d.author_name ?? [],
    description: null,
    cover_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
    page_count: d.number_of_pages_median ?? null,
    published_year: d.first_publish_year ?? null,
    isbn: (d.isbn ?? [])[0] ?? null,
    categories: (d.subject ?? []).slice(0, 3),
    language: (d.language ?? [])[0] ?? null,
  };
}

async function searchOpenLibrary(
  query: string,
  opts: { lang?: string; max?: number; start?: number; orderBy?: 'relevance' | 'newest' },
): Promise<Book[]> {
  const q = normalizeQuery(query).replace(/^isbn:/, 'isbn:');
  const params = new URLSearchParams({
    q,
    limit: String(opts.max ?? 20),
    offset: String(opts.start ?? 0),
    fields: 'key,title,author_name,cover_i,first_publish_year,isbn,subject,number_of_pages_median,language',
  });
  if (opts.lang && OL_LANG[opts.lang]) params.set('language', OL_LANG[opts.lang]);
  if (opts.orderBy === 'newest') params.set('sort', 'new');
  const res = await fetch(`${OL}/search.json?${params.toString()}`);
  if (!res.ok) throw new Error(`Book search failed (${res.status})`);
  const json = await res.json();
  return (json.docs ?? []).map(mapOpenLibraryDoc).filter((b: Book) => b.title);
}

async function getOpenLibraryWork(key: string): Promise<Book> {
  const [workRes, searchRes] = await Promise.all([
    fetch(`${OL}${key}.json`),
    fetch(
      `${OL}/search.json?q=key:${encodeURIComponent(key)}&limit=1&fields=key,title,author_name,cover_i,first_publish_year,isbn,subject,number_of_pages_median,language`,
    ),
  ]);
  if (!workRes.ok) throw new Error(`Book lookup failed (${workRes.status})`);
  const work = await workRes.json();
  const doc = searchRes.ok ? ((await searchRes.json()).docs ?? [])[0] ?? {} : {};
  const desc = typeof work.description === 'string' ? work.description : work.description?.value;
  return {
    ...mapOpenLibraryDoc({ key, title: work.title, ...doc }),
    title: work.title ?? doc.title ?? '',
    description: cleanText(desc),
    cover_url: work.covers?.[0] ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : (doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null),
  };
}

export async function searchBooks(
  query: string,
  opts: { lang?: string; max?: number; start?: number; orderBy?: 'relevance' | 'newest' } = {},
): Promise<Book[]> {
  try {
    return await searchGoogleBooks(query, opts);
  } catch (e: any) {
    // Google Books answers 429 when its keyless quota is used up; fall back to Open Library.
    return await searchOpenLibrary(query, opts);
  }
}

async function searchGoogleBooks(
  query: string,
  opts: { lang?: string; max?: number; start?: number; orderBy?: 'relevance' | 'newest' },
): Promise<Book[]> {
  const params = new URLSearchParams({
    q: normalizeQuery(query),
    maxResults: String(opts.max ?? 20),
    startIndex: String(opts.start ?? 0),
    printType: 'books',
    orderBy: opts.orderBy ?? 'relevance',
  });
  if (opts.lang) params.set('langRestrict', opts.lang);
  if (KEY) params.set('key', KEY);
  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Book search failed (${res.status})`);
  const json = await res.json();
  return (json.items ?? []).map(mapVolume).filter((b: Book) => b.title);
}

export async function getVolume(id: string): Promise<Book> {
  if (id.startsWith('ol:')) return getOpenLibraryWork(id.slice(3));
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}${KEY ? `?key=${KEY}` : ''}`);
  if (!res.ok) throw new Error(`Book lookup failed (${res.status})`);
  return mapVolume(await res.json());
}

/** DB cache first (also holds manually added books), then the API. */
export async function resolveBook(externalId: string): Promise<Book> {
  const { data } = await supabase.from('books').select('*').eq('external_id', externalId).maybeSingle();
  if (data) return data as Book;
  if (externalId.startsWith('manual:')) throw new Error('Book not found');
  return getVolume(externalId);
}

/** Makes sure the book exists in our DB (metadata only) and returns its id. */
export async function ensureBook(book: Book): Promise<string> {
  if (book.id) return book.id;
  const find = () => supabase.from('books').select('id').eq('external_id', book.external_id).maybeSingle();
  const existing = await find();
  if (existing.data) return existing.data.id as string;
  const { id: _ignored, ...row } = book;
  const { data, error } = await supabase.from('books').insert(row).select('id').single();
  if (error) {
    const again = await find(); // lost a race with another user caching the same book
    if (again.data) return again.data.id as string;
    throw error;
  }
  return data.id as string;
}

export function manualExternalId() {
  return `manual:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
