import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabase';
import type { TKey } from './i18n';

/**
 * In-app notifications. Nothing is stored for them: the list is built from data the user can already
 * see (their clubs' rounds, meetings, announcements and their friend requests), and the only thing kept
 * on the device is when the list was last opened.
 */

export type InboxItem = {
  id: string;
  kind: 'round-nominating' | 'round-voting' | 'winner' | 'announcement' | 'new-book' | 'meeting-new' | 'meeting-soon';
  at: string; // ISO time the thing happened
  icon: React.ComponentProps<typeof Ionicons>['name'];
  titleKey: TKey;
  params: Record<string, string>;
  href: string;
};

export type FriendRequest = {
  id: string;
  created_at: string;
  requester: { id: string; display_name: string; avatar_url?: string | null } | null;
};

export type AcceptedFriend = { id: string; person: { id: string; display_name: string; avatar_url?: string | null } | null };

export type Inbox = { requests: FriendRequest[]; accepted: AcceptedFriend[]; items: InboxItem[]; seenAt: string; unread: number };

const SEEN_KEY = 'inboxSeenAt';
const SEEN_FRIENDS_KEY = 'inboxSeenFriends';
const DAYS = 24 * 3600 * 1000;

const since = (days: number) => new Date(Date.now() - days * DAYS).toISOString();

type ClubRef = { name: string } | null;

export async function loadInbox(userId: string): Promise<Inbox> {
  const now = Date.now();
  const [seen, seenFriendsRaw, accepted, requests, rounds, announcements, previous, meetings] = await Promise.all([
    AsyncStorage.getItem(SEEN_KEY),
    AsyncStorage.getItem(SEEN_FRIENDS_KEY),
    // Requests I sent that the other person has since accepted. Friendships have no "accepted at" time,
    // so which ones I've already been told about is remembered on the device.
    supabase
      .from('friendships')
      .select('id,person:addressee_id(id,display_name,avatar_url)')
      .eq('requester_id', userId)
      .eq('status', 'accepted'),
    supabase
      .from('friendships')
      .select('id,created_at,requester:requester_id(id,display_name,avatar_url)')
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('club_rounds')
      .select('id,club_id,title,nominations_deadline,voting_deadline,status,created_at,clubs:club_id(name)')
      .eq('status', 'open')
      .gte('voting_deadline', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('club_announcements')
      .select('id,club_id,kind,body,created_at,clubs:club_id(name)')
      .gte('created_at', since(14))
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('club_previous_reads')
      .select('id,club_id,replaced_at,clubs:club_id(name)')
      .gte('replaced_at', since(14))
      .order('replaced_at', { ascending: false })
      .limit(20),
    supabase
      .from('club_meetings')
      .select('id,club_id,title,starts_at,created_at,clubs:club_id(name)')
      .eq('status', 'planned')
      .gte('starts_at', new Date().toISOString())
      .lte('starts_at', new Date(now + 7 * DAYS).toISOString())
      .order('starts_at')
      .limit(20),
  ]);

  const items: InboxItem[] = [];
  const club = (r: any) => (r.clubs as ClubRef)?.name ?? '';

  for (const r of (rounds.data ?? []) as any[]) {
    const nominating = now < new Date(r.nominations_deadline).getTime();
    items.push({
      id: `round-${r.id}-${nominating ? 'n' : 'v'}`,
      kind: nominating ? 'round-nominating' : 'round-voting',
      // Voting opened when the nomination deadline passed.
      at: nominating ? r.created_at : r.nominations_deadline,
      icon: nominating ? 'bookmarks-outline' : 'trophy-outline',
      titleKey: nominating ? 'inbox.nominationsOpen' : 'inbox.votingOpen',
      params: { club: club(r), title: r.title },
      href: `/club/round/${r.id}`,
    });
  }

  for (const a of (announcements.data ?? []) as any[]) {
    const winner = a.kind === 'winner';
    items.push({
      id: `ann-${a.id}`,
      kind: winner ? 'winner' : 'announcement',
      at: a.created_at,
      icon: winner ? 'ribbon-outline' : 'megaphone-outline',
      titleKey: winner ? 'inbox.winner' : 'inbox.announcement',
      params: { club: club(a), title: a.body },
      href: `/club/${a.club_id}`,
    });
  }

  for (const p of (previous.data ?? []) as any[]) {
    items.push({
      id: `prev-${p.id}`,
      kind: 'new-book',
      at: p.replaced_at,
      icon: 'book-outline',
      titleKey: 'inbox.newBook',
      params: { club: club(p), title: '' },
      href: `/club/${p.club_id}`,
    });
  }

  for (const m of (meetings.data ?? []) as any[]) {
    const soon = new Date(m.starts_at).getTime() - now <= 2 * DAYS;
    if (!soon && new Date(m.created_at).getTime() < now - 7 * DAYS) continue;
    const when = new Date(m.starts_at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    items.push({
      id: `meet-${m.id}-${soon ? 's' : 'n'}`,
      kind: soon ? 'meeting-soon' : 'meeting-new',
      at: soon ? new Date(new Date(m.starts_at).getTime() - 2 * DAYS).toISOString() : m.created_at,
      icon: 'calendar-outline',
      titleKey: soon ? 'inbox.meetingSoon' : 'inbox.meetingNew',
      params: { club: club(m), title: m.title, when },
      href: `/club/meeting/${m.id}`,
    });
  }

  items.sort((a, b) => b.at.localeCompare(a.at));

  // Never opened before: everything from the last couple of weeks counts as new.
  const seenAt = seen ?? new Date(0).toISOString();
  let seenFriends: string[] = [];
  try {
    seenFriends = seenFriendsRaw ? (JSON.parse(seenFriendsRaw) as string[]) : [];
  } catch {}
  const newAccepted = ((accepted.data ?? []) as unknown as AcceptedFriend[]).filter((f) => !seenFriends.includes(f.id));
  const unread = (requests.data?.length ?? 0) + newAccepted.length + items.filter((i) => i.at > seenAt).length;
  return { requests: (requests.data ?? []) as unknown as FriendRequest[], accepted: newAccepted, items, seenAt, unread };
}

export async function markInboxSeen(acceptedIds: string[] = []) {
  await AsyncStorage.setItem(SEEN_KEY, new Date().toISOString());
  if (acceptedIds.length) {
    const raw = await AsyncStorage.getItem(SEEN_FRIENDS_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(SEEN_FRIENDS_KEY, JSON.stringify([...new Set([...seen, ...acceptedIds])]));
  }
}
