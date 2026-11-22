import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Avatar, Button, Card, Input, Row, Screen, Segmented } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { signOut } from '@/lib/authActions';
import { useData } from '@/lib/hooks';
import { LangPref, loadLanguagePref, setLanguagePref, useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { ThemeMode, useTheme } from '@/lib/theme';

export default function Profile() {
  const { t } = useT();
  const { mode, setMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [pref, setPref] = useState<LangPref>('system');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLanguagePref().then(setPref);
  }, []);

  const { data: profile, reload } = useData(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
    return data as { display_name: string } | null;
  }, [user?.id]);

  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  const saveName = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user!.id);
    setSaving(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else reload();
  };

  return (
    <Screen>
      <Row>
        <Avatar name={profile?.display_name ?? '?'} size={56} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{profile?.display_name ?? ''}</AppText>
          <AppText variant="caption" muted>
            {user?.email ?? user?.phone ?? ''}
          </AppText>
        </View>
      </Row>

      <Card>
        <Input label={t('profile.displayName')} value={name} onChangeText={setName} />
        <Button small title={t('common.save')} onPress={saveName} loading={saving} disabled={!name.trim() || name.trim() === profile?.display_name} />
      </Card>

      <Button variant="secondary" icon="people-outline" title={t('profile.friends')} onPress={() => router.push('/friends')} />

      <Card>
        <AppText variant="subheading">{t('profile.appearance')}</AppText>
        <Segmented<ThemeMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'system', label: t('profile.system') },
            { value: 'light', label: t('profile.light') },
            { value: 'dark', label: t('profile.dark') },
          ]}
        />
      </Card>

      <Card>
        <AppText variant="subheading">{t('profile.language')}</AppText>
        <Segmented<LangPref>
          value={pref}
          onChange={(p) => {
            setPref(p);
            setLanguagePref(p);
          }}
          options={[
            { value: 'system', label: t('profile.system') },
            { value: 'en', label: 'English' },
            { value: 'nb', label: 'Norsk' },
          ]}
        />
      </Card>

      <Button variant="danger" icon="log-out-outline" title={t('profile.logout')} onPress={() => signOut()} />
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>
        Chapters & Chatters · v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>
    </Screen>
  );
}
