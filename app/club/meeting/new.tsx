import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { DateTimeField } from '@/components/DateTimeField';
import { PlacePicker } from '@/components/PlacePicker';
import { AppText, Button, Input, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { scheduleMeetingReminders } from '@/lib/notifications';
import type { Place } from '@/lib/places';
import { supabase } from '@/lib/supabase';

// params: club (required), pollId + startsAt (when created from a date poll)
export default function NewMeeting() {
  const { club, pollId, startsAt } = useLocalSearchParams<{ club: string; pollId?: string; startsAt?: string }>();
  const { t } = useT();
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(startsAt ? new Date(startsAt) : new Date(Date.now() + 7 * 86400000));
  const [place, setPlace] = useState<Place | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: clubData } = useData(async () => {
    const { data } = await supabase.from('clubs').select('name,current_book_id').eq('id', club).maybeSingle();
    return data as { name: string; current_book_id: string | null } | null;
  }, [club]);

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from('club_meetings')
      .insert({
        club_id: club,
        title: title.trim() || t('meeting.defaultTitle', { name: clubData?.name ?? '' }),
        starts_at: date.toISOString(),
        place_name: place?.name ?? null,
        place_address: place?.address ?? null,
        place_id: place?.place_id ?? null,
        lat: place?.lat ?? null,
        lng: place?.lng ?? null,
        book_id: clubData?.current_book_id ?? null,
        description: notes.trim() || null,
        created_by: user!.id,
      })
      .select('id,title,starts_at')
      .single();
    if (error) {
      setBusy(false);
      Alert.alert(t('common.error'), error.message);
      return;
    }
    if (pollId) {
      await supabase.from('date_polls').update({ status: 'closed', meeting_id: data.id }).eq('id', pollId);
    }
    // The organiser is going by default.
    await supabase.from('meeting_rsvps').upsert({ meeting_id: data.id, user_id: user!.id, status: 'going' });
    scheduleMeetingReminders(data);
    setBusy(false);
    router.replace(`/club/meeting/${data.id}`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('meeting.schedule') }} />
      <Input label={t('meeting.title')} value={title} onChangeText={setTitle} placeholder={t('meeting.defaultTitle', { name: clubData?.name ?? '' })} />
      <DateTimeField label={t('meeting.when')} value={date} onChange={setDate} minimumDate={new Date()} />
      <AppText variant="subheading">{t('meeting.where')}</AppText>
      <PlacePicker value={place} onChange={setPlace} />
      <Input label={t('meeting.description')} value={notes} onChangeText={setNotes} multiline />
      <Button title={t('meeting.create')} onPress={create} loading={busy} />
    </Screen>
  );
}
