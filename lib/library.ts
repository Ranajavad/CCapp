import { supabase } from './supabase';
import type { LibraryEntry, ShelfStatus } from './types';

/**
 * Updates the user's entry for a book, creating it when it does not exist yet.
 * (A partial `upsert` would trip the NOT NULL on `status`, so update-then-insert.)
 */
export async function upsertEntry(userId: string, bookId: string, patch: Partial<LibraryEntry>) {
  const stamped = { ...patch, updated_at: new Date().toISOString() };
  const upd = await supabase
    .from('library_entries')
    .update(stamped)
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .select();
  if (upd.error) throw upd.error;
  if (upd.data && upd.data.length > 0) return upd.data[0] as LibraryEntry;

  const ins = await supabase
    .from('library_entries')
    .insert({ user_id: userId, book_id: bookId, status: 'wishlist', ...stamped })
    .select()
    .single();
  if (ins.error) throw ins.error;
  return ins.data as LibraryEntry;
}

export async function postActivity(
  userId: string,
  bookId: string,
  type: 'started' | 'finished' | 'review',
  body?: string | null,
  rating?: number | null,
) {
  const { error } = await supabase
    .from('activity')
    .insert({ user_id: userId, book_id: bookId, type, body: body ?? null, rating: rating ?? null });
  if (error) throw error;
}

export function statusPatch(
  status: ShelfStatus,
  prev: LibraryEntry | null,
  pageCount: number | null,
): Partial<LibraryEntry> {
  const now = new Date().toISOString();
  const patch: Partial<LibraryEntry> = { status };
  if (status === 'reading') {
    patch.started_at = prev?.started_at ?? now;
    patch.finished_at = null;
  }
  if (status === 'read') {
    patch.started_at = prev?.started_at ?? now;
    patch.finished_at = now;
    if (pageCount) patch.current_page = pageCount;
  }
  return patch;
}
