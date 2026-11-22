import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { authorLine, timeAgo } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { radius, useTheme } from '@/lib/theme';
import { AppText, Avatar, BookCover, Card, Row, Stars } from './ui';

export type ActivityItem = {
  id: string;
  user_id: string;
  type: 'started' | 'finished' | 'review';
  body: string | null;
  rating: number | null;
  created_at: string;
  profiles?: { display_name: string } | null;
  books?: { external_id: string; title: string; authors: string[]; cover_url: string | null } | null;
  reactions?: { emoji: string; user_id: string }[];
  comments?: { count: number }[];
};

export const ACTIVITY_SELECT =
  'id,user_id,type,body,rating,created_at,' +
  'profiles:user_id(display_name),' +
  'books:book_id(external_id,title,authors,cover_url),' +
  'reactions(emoji,user_id),comments(count)';

export const EMOJIS = ['❤️', '😮', '😂', '📚', '👏'];

export function ActivityCard({
  item,
  userId,
  onChanged,
  detail,
}: {
  item: ActivityItem;
  userId: string;
  onChanged: () => void;
  detail?: boolean;
}) {
  const { t } = useT();
  const { colors } = useTheme();
  const router = useRouter();
  const name = item.user_id === userId ? t('common.you') : item.profiles?.display_name ?? '?';
  const title = item.books?.title ?? '';
  const sentenceKey = item.type === 'started' ? 'feed.started' : item.type === 'finished' ? 'feed.finished' : 'feed.reviewed';
  const commentCount = item.comments?.[0]?.count ?? 0;

  const toggle = async (emoji: string) => {
    const mine = item.reactions?.some((r) => r.user_id === userId && r.emoji === emoji);
    const { error } = mine
      ? await supabase.from('reactions').delete().eq('activity_id', item.id).eq('user_id', userId).eq('emoji', emoji)
      : await supabase.from('reactions').insert({ activity_id: item.id, user_id: userId, emoji });
    if (error) Alert.alert(t('common.error'), error.message);
    else onChanged();
  };

  return (
    <Card>
      <Row style={{ alignItems: 'flex-start' }}>
        <Avatar name={item.profiles?.display_name ?? '?'} />
        <View style={{ flex: 1 }}>
          <AppText variant="body" style={{ fontWeight: '600' }}>
            {t(sentenceKey, { name, title })}
          </AppText>
          <AppText variant="caption" muted>
            {timeAgo(item.created_at)}
          </AppText>
        </View>
      </Row>

      {item.books ? (
        <Pressable onPress={() => router.push(`/book/${encodeURIComponent(item.books!.external_id)}`)}>
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <BookCover url={item.books.cover_url} title={item.books.title} width={46} />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="subheading" numberOfLines={2}>
                {item.books.title}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {authorLine(item.books.authors)}
              </AppText>
              {item.rating ? <Stars value={item.rating} size={16} /> : null}
            </View>
          </Row>
        </Pressable>
      ) : null}

      {item.type === 'review' && item.body ? (
        <AppText style={{ fontStyle: 'italic' }}>“{item.body}”</AppText>
      ) : null}

      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {EMOJIS.map((e) => {
          const count = item.reactions?.filter((r) => r.emoji === e).length ?? 0;
          const mine = item.reactions?.some((r) => r.user_id === userId && r.emoji === e);
          return (
            <Pressable
              key={e}
              onPress={() => toggle(e)}
              style={{
                flexDirection: 'row',
                gap: 4,
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: radius.pill,
                backgroundColor: mine ? colors.primary : colors.surfaceAlt,
              }}
            >
              <AppText style={{ fontSize: 14 }}>{e}</AppText>
              {count > 0 ? (
                <AppText variant="caption" style={{ color: mine ? colors.onPrimary : colors.text, fontWeight: '700' }}>
                  {count}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
        {!detail ? (
          <Pressable
            onPress={() => router.push(`/activity/${item.id}`)}
            style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginLeft: 'auto', padding: 4 }}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
            <AppText variant="caption" muted>
              {commentCount > 0 ? t('feed.comments', { n: commentCount }) : t('feed.comment')}
            </AppText>
          </Pressable>
        ) : null}
      </Row>
    </Card>
  );
}
