import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { BookPickerModal } from '@/components/BookPickerModal';
import { AppText, BookCover, Button, Card, Chip, Row, Screen, Section } from '@/components/ui';
import { resolveBook } from '@/lib/books';
import { authorLine } from '@/lib/format';
import { TKey, useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { fonts, radius, useTheme } from '@/lib/theme';
import type { Book } from '@/lib/types';

// Guided flow: easy opening questions first, then rating, then the story, themes and fun.
const STAGES = ['warmup', 'rating', 'characters', 'plot', 'themes', 'fun', 'closing'] as const;
type Stage = (typeof STAGES)[number];
const TONES = ['cozy', 'deep', 'playful'] as const;
type Tone = (typeof TONES)[number];

/** Offline fallback so the generator still works without the AI backend. */
const FALLBACK_COUNT = 3;

export default function Discussion() {
  const { book: bookParam } = useLocalSearchParams<{ book?: string; club?: string }>();
  const { t, lang } = useT();
  const { colors } = useTheme();

  const [book, setBook] = useState<Book | null>(null);
  const [picker, setPicker] = useState(false);
  const [stage, setStage] = useState<Stage>('warmup');
  const [tone, setTone] = useState<Tone>('cozy');
  const [spoilers, setSpoilers] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [tally, setTally] = useState<number[]>([0, 0, 0, 0, 0]);
  const fetchId = useRef(0);

  useEffect(() => {
    if (bookParam) resolveBook(decodeURIComponent(String(bookParam))).then(setBook).catch(() => {});
  }, [bookParam]);

  const fallback = useCallback(
    (s: Stage): string[] => {
      const out: string[] = [];
      for (let i = 1; i <= FALLBACK_COUNT; i++) out.push(t(`ai.fallback.${s}.${i}` as TKey));
      return out;
    },
    [t],
  );

  const fetchQuestions = useCallback(
    async (s: Stage, already: string[]) => {
      if (!book) return [];
      const myId = ++fetchId.current;
      setLoading(true);
      let qs: string[] = [];
      try {
        const { data, error } = await supabase.functions.invoke('discussion-questions', {
          body: {
            language: lang,
            title: book.title,
            authors: authorLine(book.authors),
            description: book.description,
            stage: s,
            tone,
            spoilers: spoilers && s !== 'warmup',
            exclude: already.slice(-20),
            count: 4,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        qs = (data?.questions ?? []) as string[];
        setUsedFallback(false);
      } catch {
        qs = fallback(s).filter((q) => !already.includes(q));
        setUsedFallback(true);
      }
      if (myId !== fetchId.current) return [];
      setLoading(false);
      return qs;
    },
    [book, lang, tone, spoilers, fallback],
  );

  const start = useCallback(
    async (s: Stage) => {
      setStage(s);
      setQueue([]);
      setCurrent(null);
      const qs = await fetchQuestions(s, asked);
      if (qs.length) {
        setCurrent(qs[0]);
        setQueue(qs.slice(1));
        setAsked((a) => [...a, qs[0]]);
      }
    },
    [fetchQuestions, asked],
  );

  // Kick off the first stage once a book is chosen.
  useEffect(() => {
    if (book && !current && !loading && asked.length === 0) start('warmup');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  const next = async () => {
    if (queue.length) {
      setCurrent(queue[0]);
      setAsked((a) => [...a, queue[0]]);
      setQueue(queue.slice(1));
      return;
    }
    const qs = await fetchQuestions(stage, asked);
    if (qs.length) {
      setCurrent(qs[0]);
      setQueue(qs.slice(1));
      setAsked((a) => [...a, qs[0]]);
    }
  };

  const stageIndex = STAGES.indexOf(stage);
  const total = tally.reduce((a, b) => a + b, 0);
  const avg = total ? tally.reduce((sum, c, i) => sum + c * (i + 1), 0) / total : 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: t('ai.title') }} />

      {!book ? (
        <Card>
          <AppText variant="heading">✨ {t('ai.title')}</AppText>
          <AppText muted>{t('ai.intro')}</AppText>
          <Button icon="search" title={t('ai.pickBook')} onPress={() => setPicker(true)} />
        </Card>
      ) : (
        <>
          <Row>
            <BookCover url={book.cover_url} title={book.title} width={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="subheading" numberOfLines={2}>
                {book.title}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {authorLine(book.authors)}
              </AppText>
            </View>
            <Button
              small
              variant="ghost"
              title={t('ai.change')}
              onPress={() => {
                setPicker(true);
              }}
            />
          </Row>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STAGES.map((s) => (
              <Chip key={s} label={t(`ai.stage.${s}` as TKey)} selected={s === stage} onPress={() => start(s)} />
            ))}
          </ScrollView>

          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {TONES.map((x) => (
              <Chip key={x} label={t(`ai.tone.${x}` as TKey)} selected={x === tone} onPress={() => setTone(x)} />
            ))}
            {stageIndex > 0 ? (
              <Chip
                icon={spoilers ? 'eye' : 'eye-off'}
                label={spoilers ? t('ai.spoilersOn') : t('ai.spoilersOff')}
                selected={spoilers}
                onPress={() => setSpoilers(!spoilers)}
              />
            ) : null}
          </Row>

          <View
            style={{
              minHeight: 220,
              borderRadius: radius.lg,
              backgroundColor: colors.primary,
              padding: 24,
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <AppText variant="label" style={{ color: colors.onPrimary }}>
              {t(`ai.stage.${stage}` as TKey)} · {stageIndex + 1}/{STAGES.length}
            </AppText>
            {loading && !current ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <AppText style={{ color: colors.onPrimary, fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, fontWeight: '700' }}>
                {current ?? t('ai.empty')}
              </AppText>
            )}
          </View>
          {usedFallback ? (
            <AppText variant="caption" muted>
              {t('ai.offline')}
            </AppText>
          ) : null}

          <Row>
            <Button style={{ flex: 1 }} icon="refresh" title={t('ai.another')} onPress={next} loading={loading && !!current} />
            {stageIndex < STAGES.length - 1 ? (
              <Button style={{ flex: 1 }} variant="secondary" icon="arrow-forward" title={t('ai.nextStage')} onPress={() => start(STAGES[stageIndex + 1])} />
            ) : null}
          </Row>

          {stage === 'rating' ? (
            <Section title={t('ai.tallyTitle')}>
              <AppText variant="caption" muted>
                {t('ai.tallyHint')}
              </AppText>
              <Card>
                {[5, 4, 3, 2, 1].map((star) => (
                  <Row key={star} style={{ justifyContent: 'space-between' }}>
                    <Row gap={4}>
                      <AppText style={{ width: 20, fontWeight: '700' }}>{star}</AppText>
                      <Ionicons name="star" size={18} color={colors.accent} />
                    </Row>
                    <Row gap={14}>
                      <Pressable onPress={() => setTally(tally.map((c, i) => (i === star - 1 ? Math.max(0, c - 1) : c)))} hitSlop={8}>
                        <Ionicons name="remove-circle-outline" size={26} color={colors.textMuted} />
                      </Pressable>
                      <AppText variant="heading" style={{ minWidth: 24, textAlign: 'center' }}>
                        {tally[star - 1]}
                      </AppText>
                      <Pressable onPress={() => setTally(tally.map((c, i) => (i === star - 1 ? c + 1 : c)))} hitSlop={8}>
                        <Ionicons name="add-circle" size={26} color={colors.primary} />
                      </Pressable>
                    </Row>
                  </Row>
                ))}
                <AppText variant="subheading" style={{ textAlign: 'center' }}>
                  {total ? t('ai.average', { avg: avg.toFixed(1), n: total }) : t('ai.noRatings')}
                </AppText>
              </Card>
            </Section>
          ) : null}
        </>
      )}

      <BookPickerModal
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(b) => {
          setBook(b);
          setAsked([]);
          setCurrent(null);
          setQueue([]);
          setStage('warmup');
        }}
        title={t('ai.pickBook')}
      />
    </Screen>
  );
}
