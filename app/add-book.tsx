import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';
import { BookRow } from '@/components/BookRow';
import { AppText, Button, Card, Divider, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ensureBook, manualExternalId, searchBooks } from '@/lib/books';
import { useDebounced } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { upsertEntry } from '@/lib/library';
import { STORES } from '@/lib/stores';
import { useTheme } from '@/lib/theme';
import type { Book } from '@/lib/types';
import { Linking } from 'react-native';

export default function AddBook() {
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 450);
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dq.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchBooks(dq)
      .then((r) => !cancelled && (setResults(r), setError(null)))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dq]);

  const open = (b: Book) => router.replace(`/book/${encodeURIComponent(b.external_id)}`);

  const saveManual = async () => {
    setSaving(true);
    try {
      const book: Book = {
        external_id: manualExternalId(),
        title: title.trim(),
        authors: author.trim() ? [author.trim()] : [],
        description: null,
        cover_url: null,
        page_count: parseInt(pages, 10) || null,
        published_year: null,
        isbn: null,
        categories: [],
        language: null,
      };
      const id = await ensureBook(book);
      await upsertEntry(user!.id, id, { status: 'wishlist' });
      router.replace(`/book/${encodeURIComponent(book.external_id)}`);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      keyboardShouldPersistTaps="handled"
      data={results}
      keyExtractor={(b) => b.external_id}
      ItemSeparatorComponent={Divider}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 6 }}>
          <Input value={q} onChangeText={setQ} placeholder={t('search.placeholder')} autoCapitalize="none" autoFocus />
          <AppText variant="caption" muted>
            {t('add.isbnHint')}
          </AppText>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <AppText style={{ color: colors.danger }}>{error}</AppText> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingVertical: 10 }}>
          <BookRow book={item} onPress={() => open(item)} />
        </View>
      )}
      ListFooterComponent={
        <View style={{ gap: 12, marginTop: 16 }}>
          {manual ? (
            <Card>
              <AppText variant="subheading">{t('add.manual')}</AppText>
              <Input label={t('add.title')} value={title} onChangeText={setTitle} />
              <Input label={t('add.author')} value={author} onChangeText={setAuthor} />
              <Input label={t('add.pages')} value={pages} onChangeText={setPages} keyboardType="number-pad" />
              <Button title={t('common.save')} onPress={saveManual} loading={saving} disabled={!title.trim()} />
            </Card>
          ) : (
            <Button variant="secondary" icon="create-outline" title={t('add.manualCta')} onPress={() => setManual(true)} />
          )}
          <Card>
            <AppText variant="subheading">{t('add.storesTitle')}</AppText>
            <AppText variant="caption" muted>
              {t('add.storesBody')}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {STORES.map((s) => (
                <Button
                  key={s.key}
                  small
                  variant="secondary"
                  icon="storefront-outline"
                  title={s.name}
                  onPress={() => Linking.openURL(s.searchUrl(q || ''))}
                />
              ))}
            </View>
          </Card>
        </View>
      }
    />
  );
}
