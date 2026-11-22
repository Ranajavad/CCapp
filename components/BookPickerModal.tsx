import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchBooks } from '@/lib/books';
import { useDebounced } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import type { Book } from '@/lib/types';
import { BookRow } from './BookRow';
import { AppText, Divider, Input } from './ui';

/** Full-screen book search used for nominations, club current read, discussion generator… */
export function BookPickerModal({
  visible,
  onClose,
  onPick,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (book: Book) => void;
  title?: string;
}) {
  const { t } = useT();
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 450);
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: 16, gap: 12, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="heading">{title ?? t('picker.title')}</AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color={colors.text} />
            </Pressable>
          </View>
          <Input value={q} onChangeText={setQ} placeholder={t('search.placeholder')} autoFocus autoCapitalize="none" />
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <AppText muted>{error}</AppText> : null}
          <FlatList
            data={results}
            keyExtractor={(b) => b.external_id}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => (
              <View style={{ paddingVertical: 10 }}>
                <Divider />
              </View>
            )}
            renderItem={({ item }) => (
              <BookRow
                book={item}
                onPress={() => {
                  onPick(item);
                  onClose();
                }}
              />
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
