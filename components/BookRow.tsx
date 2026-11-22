import React from 'react';
import { Pressable, View } from 'react-native';
import { authorLine } from '@/lib/format';
import type { Book } from '@/lib/types';
import { AppText, BookCover, Row } from './ui';

export function BookRow({
  book,
  onPress,
  trailing,
  subtitle,
}: {
  book: Pick<Book, 'title' | 'authors' | 'cover_url'> & Partial<Book>;
  onPress?: () => void;
  trailing?: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Row gap={14} style={{ alignItems: 'flex-start' }}>
        <BookCover url={book.cover_url} title={book.title} width={52} />
        <View style={{ flex: 1, gap: 3 }}>
          <AppText variant="subheading" numberOfLines={2}>
            {book.title}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {authorLine(book.authors)}
            {book.published_year ? ` · ${book.published_year}` : ''}
          </AppText>
          {subtitle}
        </View>
        {trailing}
      </Row>
    </Pressable>
  );
}
