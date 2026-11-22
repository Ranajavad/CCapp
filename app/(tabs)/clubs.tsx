import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { AppText, BookCover, Button, Card, EmptyState, ErrorState, Loading, Row } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import type { Club } from '@/lib/types';

export default function Clubs() {
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data, loading, error, refreshing, refresh, reload } = useData(async () => {
    // Close any rounds whose voting deadline passed so winners show up as current reads.
    await supabase.rpc('close_due_rounds');
    const { data, error } = await supabase
      .from('club_members')
      .select('role, clubs(*, books:current_book_id(*))')
      .eq('user_id', user!.id);
    if (error) throw error;
    return (data ?? []).map((m: any) => ({ ...m.clubs, myRole: m.role })) as (Club & { myRole: string })[];
  }, [user?.id]);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <AppText muted>{t('clubs.subtitle')}</AppText>

      <Row>
        <Button style={{ flex: 1 }} icon="add-circle-outline" title={t('clubs.create')} onPress={() => router.push('/club/new')} />
        <Button style={{ flex: 1 }} variant="secondary" icon="enter-outline" title={t('clubs.join')} onPress={() => router.push('/club/join')} />
      </Row>

      <Card onPress={() => router.push('/discussion')} style={{ backgroundColor: colors.surfaceAlt }}>
        <Row>
          <AppText style={{ fontSize: 26 }}>✨</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{t('clubs.aiCard')}</AppText>
            <AppText variant="caption" muted>
              {t('clubs.aiCardBody')}
            </AppText>
          </View>
        </Row>
      </Card>

      <AppText variant="heading">{t('clubs.mine')}</AppText>
      {data?.length ? (
        data.map((c) => (
          <Card key={c.id} onPress={() => router.push(`/club/${c.id}`)}>
            <Row style={{ alignItems: 'flex-start' }}>
              {c.books ? (
                <BookCover url={c.books.cover_url} title={c.books.title} width={52} />
              ) : (
                <View style={{ width: 52, height: 78, borderRadius: 6, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText style={{ fontSize: 24 }}>📚</AppText>
                </View>
              )}
              <View style={{ flex: 1, gap: 3 }}>
                <AppText variant="subheading">{c.name}</AppText>
                <AppText variant="caption" muted>
                  {c.books ? t('clubs.currentRead', { title: c.books.title }) : t('clubs.noCurrentRead')}
                </AppText>
              </View>
            </Row>
          </Card>
        ))
      ) : (
        <EmptyState icon="people-outline" title={t('clubs.empty')} body={t('clubs.emptyBody')} />
      )}
    </ScrollView>
  );
}
