import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Keyboard, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACTIVITY_SELECT, ActivityCard, ActivityItem } from '@/components/ActivityCard';
import { AppText, Avatar, Card, EmptyState, ErrorState, Input, Loading, Row, TrashButton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

type CommentRow = { id: string; user_id: string; body: string; created_at: string; profiles: { display_name: string; avatar_url?: string | null } | null };

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);
  // Height of the on-screen keyboard (iPhone). Android resizes the window by itself.
  const [kb, setKb] = useState(0);

  // Keep the newest comment in view when the keyboard opens.
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      if (Platform.OS === 'ios') setKb(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const { data, loading, error, reload } = useData(async () => {
    const [a, c] = await Promise.all([
      supabase.from('activity').select(ACTIVITY_SELECT).eq('id', id).maybeSingle(),
      supabase
        .from('comments')
        .select('id,user_id,body,created_at,profiles:user_id(display_name,avatar_url)')
        .eq('activity_id', id)
        .order('created_at', { ascending: true }),
    ]);
    if (a.error) throw a.error;
    return { activity: a.data as unknown as ActivityItem | null, comments: (c.data ?? []) as unknown as CommentRow[] };
  }, [id]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  if (!data.activity) return <EmptyState title={t('common.notFound')} />;

  const send = async () => {
    setSending(true);
    const { error } = await supabase.from('comments').insert({ activity_id: id, user_id: user!.id, body: text.trim() });
    setSending(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else {
      setText('');
      reload();
    }
  };

  const remove = async (c: CommentRow) => {
    await supabase.from('comments').delete().eq('id', c.id);
    reload();
  };

  // The bottom padding equals the keyboard height, so the box is never hidden behind it.
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingBottom: kb }}>
      <Stack.Screen options={{ title: t('feed.comment') }} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
      >
      <ActivityCard item={data.activity} userId={user!.id} onChanged={reload} detail />
      {data.comments.map((c) => (
        <Card key={c.id}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Avatar name={c.profiles?.display_name ?? '?'} url={c.profiles?.avatar_url} size={30} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                {c.user_id === user!.id ? t('common.you') : c.profiles?.display_name}
                <AppText variant="caption" muted>
                  {'  '}
                  {timeAgo(c.created_at)}
                </AppText>
              </AppText>
              <AppText>{c.body}</AppText>
            </View>
            {c.user_id === user!.id ? (
              <TrashButton label={t('common.delete')} onPress={() => remove(c)} />
            ) : null}
          </Row>
        </Card>
      ))}
      </ScrollView>

      {/* The composer sits below the list, so it stays above the keyboard however many comments there are. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: kb ? 10 : Math.max(insets.bottom, 10),
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Input value={text} onChangeText={setText} placeholder={t('feed.writeComment')} multiline maxLength={1000} style={{ minHeight: 46, maxHeight: 110 }} />
        </View>
        <Pressable
          onPress={send}
          disabled={!text.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel={t('feed.send')}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: text.trim() ? 1 : 0.4,
          }}
        >
          {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={20} color="#fff" style={{ marginLeft: 2 }} />}
        </Pressable>
      </View>
    </View>
  );
}
