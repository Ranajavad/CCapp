import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { ACTIVITY_SELECT, ActivityCard, ActivityItem } from '@/components/ActivityCard';
import { AppText, BookCover, Button, Card, EmptyState, ErrorState, Loading, Row, Section } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { syncClubCurrentReads } from '@/lib/library';
import { supabase } from '@/lib/supabase';
import { radius, useTheme } from '@/lib/theme';
import type { LibraryEntry } from '@/lib/types';

export default function Home() {
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data, loading, error, refreshing, refresh, reload } = useData(async () => {
    await syncClubCurrentReads(user!.id);
    const [reading, feed] = await Promise.all([
      supabase
        .from('library_entries')
        .select('*, books(*)')
        .eq('user_id', user!.id)
        .eq('status', 'reading')
        .order('updated_at', { ascending: false }),
      supabase.from('activity').select(ACTIVITY_SELECT).order('created_at', { ascending: false }).limit(50),
    ]);
    if (feed.error) throw feed.error;
    return {
      reading: (reading.data ?? []) as LibraryEntry[],
      feed: (feed.data ?? []) as unknown as ActivityItem[],
    };
  }, [user?.id]);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const header = (
    <View style={{ gap: 20, paddingBottom: 8 }}>
      <Section title={t('home.nowReading')}>
        {data?.reading.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {data.reading.map((e) => {
              const pct = e.books?.page_count && e.current_page ? Math.min(1, e.current_page / e.books.page_count) : 0;
              return (
                <Pressable key={e.id} onPress={() => router.push(`/book/${encodeURIComponent(e.books!.external_id)}`)}>
                  <Card style={{ width: 250 }}>
                    <Row style={{ alignItems: 'flex-start' }}>
                      <BookCover url={e.books?.cover_url} title={e.books?.title} width={54} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <AppText variant="subheading" numberOfLines={2}>
                          {e.books?.title}
                        </AppText>
                        <AppText variant="caption" muted numberOfLines={1}>
                          {(e.books?.authors ?? []).join(', ')}
                        </AppText>
                      </View>
                    </Row>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.round(pct * 100)}%`, height: 6, backgroundColor: colors.accent }} />
                    </View>
                    <AppText variant="caption" muted>
                      {e.books?.page_count
                        ? t('home.progress', { page: e.current_page ?? 0, total: e.books.page_count })
                        : t('home.reading')}
                    </AppText>
                  </Card>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Card>
            <AppText muted>{t('home.nothingReading')}</AppText>
            <Button small variant="secondary" icon="compass-outline" title={t('home.findBook')} onPress={() => router.push('/(tabs)/discover')} />
          </Card>
        )}
      </Section>

      <Section
        title={t('home.friendsFeed')}
        action={
          <AppText variant="caption" onPress={() => router.push('/friends')} style={{ color: colors.text, fontWeight: '700', textDecorationLine: 'underline' }}>
            {t('home.friends')}
          </AppText>
        }
      >
        {null}
      </Section>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      data={data?.feed ?? []}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      renderItem={({ item }) => <ActivityCard item={item} userId={user!.id} onChanged={reload} />}
      ListEmptyComponent={
        <EmptyState
          icon="chatbubbles-outline"
          title={t('home.emptyFeed')}
          body={t('home.emptyFeedBody')}
          action={<Button small title={t('home.addFriends')} onPress={() => router.push('/friends')} />}
        />
      }
    />
  );
}
