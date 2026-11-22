import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { BookRow } from '@/components/BookRow';
import { AppText, Divider, EmptyState, ErrorState, Loading, Segmented, Stars } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { radius, useTheme } from '@/lib/theme';
import type { LibraryEntry, ShelfStatus } from '@/lib/types';

export default function Library() {
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<ShelfStatus>('reading');

  const { data, loading, error, refreshing, refresh, reload } = useData(async () => {
    const { data, error } = await supabase
      .from('library_entries')
      .select('*, books(*)')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LibraryEntry[];
  }, [user?.id]);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const list = (data ?? []).filter((e) => e.status === tab && e.books);
  const count = (s: ShelfStatus) => (data ?? []).filter((e) => e.status === s).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Segmented<ShelfStatus>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'reading', label: `${t('shelf.reading')} (${count('reading')})` },
            { value: 'wishlist', label: `${t('shelf.wishlist')} (${count('wishlist')})` },
            { value: 'read', label: `${t('shelf.read')} (${count('read')})` },
          ]}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => (
          <View style={{ paddingVertical: 12 }}>
            <Divider />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="library-outline"
            title={t(`library.empty.${tab}` as any)}
            body={t('library.emptyBody')}
          />
        }
        renderItem={({ item }) => {
          const b = item.books!;
          const pct = b.page_count && item.current_page ? Math.min(1, item.current_page / b.page_count) : 0;
          return (
            <BookRow
              book={b}
              onPress={() => router.push(`/book/${encodeURIComponent(b.external_id)}`)}
              subtitle={
                item.status === 'read' ? (
                  <Stars value={item.rating} size={16} />
                ) : item.status === 'reading' ? (
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.round(pct * 100)}%`, height: 5, backgroundColor: colors.accent }} />
                    </View>
                    {b.page_count ? (
                      <AppText variant="caption" muted>
                        {t('home.progress', { page: item.current_page ?? 0, total: b.page_count })}
                      </AppText>
                    ) : null}
                  </View>
                ) : null
              }
            />
          );
        }}
      />

      <Pressable
        onPress={() => router.push('/add-book')}
        accessibilityLabel={t('library.addBook')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        })}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}
