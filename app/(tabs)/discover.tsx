import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native';
import { AppText, BookCover, Chip, EmptyState, Input } from '@/components/ui';
import { searchBooks } from '@/lib/books';
import { authorLine } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import type { Book } from '@/lib/types';

const GENRES = ['fiction', 'romance', 'fantasy', 'thriller', 'crime', 'historical', 'science', 'biography', 'youngadult', 'classics'] as const;
type Genre = (typeof GENRES)[number];

const SUBJECT: Record<Genre, string> = {
  fiction: 'fiction',
  romance: 'romance',
  fantasy: 'fantasy',
  thriller: 'thriller',
  crime: 'crime',
  historical: 'historical fiction',
  science: 'science fiction',
  biography: 'biography',
  youngadult: 'young adult fiction',
  classics: 'classics',
};

function Cover({ book, onPress, width }: { book: Book; onPress: () => void; width: number }) {
  return (
    <Pressable onPress={onPress} style={{ width, gap: 6 }}>
      <BookCover url={book.cover_url} title={book.title} width={width} />
      <AppText variant="caption" style={{ fontWeight: '700' }} numberOfLines={2}>
        {book.title}
      </AppText>
      <AppText variant="caption" muted numberOfLines={1}>
        {authorLine(book.authors)}
      </AppText>
    </Pressable>
  );
}

export default function Discover() {
  const { t } = useT();
  const { colors } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 500);
  const [genre, setGenre] = useState<Genre>('fiction');
  const [norwegian, setNorwegian] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [fresh, setFresh] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searching = dq.trim().length >= 2;
  const lang = norwegian ? 'no' : undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const main = searching
      ? searchBooks(dq, { lang, max: 24 })
      : searchBooks(`subject:${SUBJECT[genre]}`, { lang, max: 24 });
    const news = searching ? Promise.resolve([] as Book[]) : searchBooks(`subject:${SUBJECT[genre]}`, { lang, max: 10, orderBy: 'newest' });
    Promise.all([main, news])
      .then(([m, n]) => {
        if (cancelled) return;
        setResults(m);
        setFresh(n.filter((b) => b.cover_url));
        setError(null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dq, genre, norwegian, searching, lang]);

  const open = (b: Book) => router.push(`/book/${encodeURIComponent(b.external_id)}`);

  const header = (
    <View style={{ gap: 14, marginBottom: 14 }}>
      <AppText muted>{t('discover.subtitle')}</AppText>
      <Input value={q} onChangeText={setQ} placeholder={t('search.placeholder')} autoCapitalize="none" returnKeyType="search" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label={t('discover.allLanguages')} selected={!norwegian} onPress={() => setNorwegian(false)} />
        <Chip label={t('discover.norwegian')} selected={norwegian} onPress={() => setNorwegian(true)} />
      </View>
      {!searching ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {GENRES.map((g) => (
              <Chip key={g} label={t(`genre.${g}` as any)} selected={g === genre} onPress={() => setGenre(g)} />
            ))}
          </ScrollView>
          {fresh.length > 0 ? (
            <View style={{ gap: 10 }}>
              <AppText variant="heading">{t('discover.newReleases')}</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {fresh.map((b) => (
                  <Cover key={b.external_id} book={b} width={100} onPress={() => open(b)} />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <AppText variant="heading">{t('discover.popular')}</AppText>
        </>
      ) : (
        <AppText variant="heading">{t('discover.results')}</AppText>
      )}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <AppText style={{ color: colors.danger }}>{error}</AppText> : null}
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      data={results}
      numColumns={3}
      columnWrapperStyle={{ gap: 12, marginBottom: 16 }}
      keyExtractor={(b) => b.external_id}
      ListHeaderComponent={header}
      ListEmptyComponent={!loading ? <EmptyState icon="search-outline" title={t('discover.none')} /> : null}
      renderItem={({ item }) => (
        <View style={{ flex: 1 / 3 }}>
          <Cover book={item} width={96} onPress={() => open(item)} />
        </View>
      )}
    />
  );
}
