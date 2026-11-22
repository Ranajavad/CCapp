import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { AppText, Badge, BookCover, Button, Card, ErrorState, Input, Loading, Row, Screen, Section, Segmented, Stars } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ensureBook, resolveBook } from '@/lib/books';
import { authorLine, fmtDate } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { postActivity, statusPatch, upsertEntry } from '@/lib/library';
import { STORES } from '@/lib/stores';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import type { BookNote, LibraryEntry, ShelfStatus } from '@/lib/types';

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const externalId = decodeURIComponent(String(id));
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data, loading, error, reload } = useData(async () => {
    const book = await resolveBook(externalId);
    let entry: LibraryEntry | null = null;
    let notes: BookNote[] = [];
    if (book.id) {
      const [e, n] = await Promise.all([
        supabase.from('library_entries').select('*').eq('user_id', user!.id).eq('book_id', book.id).maybeSingle(),
        supabase.from('book_notes').select('*').eq('user_id', user!.id).eq('book_id', book.id).order('created_at', { ascending: false }),
      ]);
      entry = (e.data as LibraryEntry) ?? null;
      notes = (n.data ?? []) as BookNote[];
    }
    return { book, entry, notes };
  }, [externalId, user?.id]);

  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState('');
  const [review, setReview] = useState('');
  const [notePage, setNotePage] = useState('');
  const [noteChapter, setNoteChapter] = useState('');
  const [noteBody, setNoteBody] = useState('');

  const entry = data?.entry ?? null;
  useEffect(() => {
    setPage(entry?.current_page != null ? String(entry.current_page) : '');
    setReview(entry?.review ?? '');
  }, [entry?.id, entry?.current_page, entry?.review]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? 'Not found'} onRetry={reload} />;

  const { book, notes } = data;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await reload();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status: ShelfStatus) =>
    run(async () => {
      const bookId = await ensureBook(book);
      await upsertEntry(user!.id, bookId, statusPatch(status, entry, book.page_count));
      if (status === 'reading' && entry?.status !== 'reading') await postActivity(user!.id, bookId, 'started');
      if (status === 'read' && entry?.status !== 'read') await postActivity(user!.id, bookId, 'finished', null, entry?.rating);
    });

  const remove = () =>
    run(async () => {
      if (entry) await supabase.from('library_entries').delete().eq('id', entry.id);
    });

  const rate = (n: number) =>
    run(async () => {
      const bookId = await ensureBook(book);
      await upsertEntry(user!.id, bookId, entry ? { rating: n } : { rating: n, ...statusPatch('read', null, book.page_count) });
    });

  const savePage = () =>
    run(async () => {
      const bookId = await ensureBook(book);
      const n = Math.max(0, parseInt(page, 10) || 0);
      await upsertEntry(user!.id, bookId, { status: entry?.status ?? 'reading', current_page: n });
    });

  const shareReview = () =>
    run(async () => {
      const bookId = await ensureBook(book);
      const text = review.trim();
      await upsertEntry(user!.id, bookId, entry ? { review: text } : { review: text, ...statusPatch('read', null, book.page_count) });
      if (text) await postActivity(user!.id, bookId, 'review', text, entry?.rating);
    });

  const addNote = () =>
    run(async () => {
      const bookId = await ensureBook(book);
      const { error } = await supabase.from('book_notes').insert({
        user_id: user!.id,
        book_id: bookId,
        page: parseInt(notePage, 10) || null,
        chapter: noteChapter.trim() || null,
        body: noteBody.trim(),
      });
      if (error) throw error;
      setNotePage('');
      setNoteChapter('');
      setNoteBody('');
    });

  const deleteNote = (n: BookNote) =>
    run(async () => {
      await supabase.from('book_notes').delete().eq('id', n.id);
    });

  const description = book.description ?? '';
  const shortDesc = !expanded && description.length > 320 ? `${description.slice(0, 320)}…` : description;

  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />
        <Row gap={16} style={{ alignItems: 'flex-start' }}>
          <BookCover url={book.cover_url} title={book.title} width={110} />
          <View style={{ flex: 1, gap: 6 }}>
            <AppText variant="title" style={{ fontSize: 24, lineHeight: 30 }}>
              {book.title}
            </AppText>
            <AppText muted>{authorLine(book.authors)}</AppText>
            <AppText variant="caption" muted>
              {[book.published_year, book.page_count ? t('book.pages', { n: book.page_count }) : null].filter(Boolean).join(' · ')}
            </AppText>
            {book.categories[0] ? <Badge label={book.categories[0]} /> : null}
          </View>
        </Row>

        <Segmented<ShelfStatus>
          value={(entry?.status ?? '') as ShelfStatus}
          onChange={changeStatus}
          options={[
            { value: 'wishlist', label: t('shelf.wishlist') },
            { value: 'reading', label: t('shelf.reading') },
            { value: 'read', label: t('shelf.read') },
          ]}
        />
        {entry ? (
          <AppText variant="caption" muted style={{ textAlign: 'center' }}>
            {entry.status === 'read' && entry.finished_at
              ? t('book.finishedOn', { date: fmtDate(entry.finished_at) })
              : entry.status === 'reading' && entry.started_at
                ? t('book.startedOn', { date: fmtDate(entry.started_at) })
                : ' '}
          </AppText>
        ) : null}

        {entry?.status === 'reading' ? (
          <Card>
            <AppText variant="subheading">{t('book.progress')}</AppText>
            <Row>
              <View style={{ flex: 1 }}>
                <Input value={page} onChangeText={setPage} keyboardType="number-pad" placeholder={t('book.currentPage')} />
              </View>
              {book.page_count ? <AppText muted>/ {book.page_count}</AppText> : null}
              <Button small title={t('common.save')} onPress={savePage} loading={busy} />
            </Row>
          </Card>
        ) : null}

        <Card>
          <AppText variant="subheading">{t('book.yourRating')}</AppText>
          <Stars value={entry?.rating} onChange={rate} size={34} />
          <Input
            value={review}
            onChangeText={setReview}
            multiline
            placeholder={t('book.reviewPlaceholder')}
            maxLength={500}
          />
          <Button
            small
            icon="paper-plane-outline"
            title={t('book.shareReview')}
            onPress={shareReview}
            loading={busy}
            disabled={!review.trim()}
          />
          <AppText variant="caption" muted>
            {t('book.shareHint')}
          </AppText>
        </Card>

        {description ? (
          <Section title={t('book.about')}>
            <AppText>{shortDesc}</AppText>
            {description.length > 320 ? (
              <AppText onPress={() => setExpanded(!expanded)} style={{ color: colors.text, fontWeight: '700', textDecorationLine: 'underline' }}>
                {expanded ? t('common.less') : t('common.more')}
              </AppText>
            ) : null}
          </Section>
        ) : null}

        <Section title={t('book.notes')}>
          <AppText variant="caption" muted>
            {t('book.notesPrivate')}
          </AppText>
          <Card>
            <Row>
              <View style={{ width: 90 }}>
                <Input value={notePage} onChangeText={setNotePage} keyboardType="number-pad" placeholder={t('book.page')} />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={noteChapter} onChangeText={setNoteChapter} placeholder={t('book.chapter')} />
              </View>
            </Row>
            <Input value={noteBody} onChangeText={setNoteBody} multiline placeholder={t('book.notePlaceholder')} />
            <Button small icon="pin-outline" title={t('book.pinNote')} onPress={addNote} loading={busy} disabled={!noteBody.trim()} />
          </Card>
          {notes.length === 0 ? (
            <AppText muted variant="caption">
              {t('book.noNotes')}
            </AppText>
          ) : (
            notes.map((n) => (
              <Card key={n.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row gap={6}>
                    {n.page ? <Badge label={t('book.pageN', { n: n.page })} /> : null}
                    {n.chapter ? <Badge label={n.chapter} /> : null}
                  </Row>
                  <AppText variant="caption" muted onPress={() => deleteNote(n)}>
                    {t('common.delete')}
                  </AppText>
                </Row>
                <AppText>{n.body}</AppText>
              </Card>
            ))
          )}
        </Section>

        <Section title={t('book.more')}>
          <Button
            variant="secondary"
            icon="sparkles-outline"
            title={t('book.discussion')}
            onPress={() => router.push(`/discussion?book=${encodeURIComponent(book.external_id)}`)}
          />
          <Row>
            {STORES.map((s) => (
              <Button
                key={s.key}
                style={{ flex: 1 }}
                small
                variant="secondary"
                icon="storefront-outline"
                title={t('book.findAt', { store: s.name })}
                onPress={() => Linking.openURL(s.searchUrl(book.isbn ?? book.title))}
              />
            ))}
          </Row>
          {entry ? <Button variant="ghost" title={t('book.remove')} onPress={remove} /> : null}
        </Section>
    </Screen>
  );
}
