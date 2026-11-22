import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import { AppText, Avatar, Button, Card, Input, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { AVATARS, avatarIdFrom, avatarValue } from '@/lib/avatars';
import { signOut } from '@/lib/authActions';
import { useData } from '@/lib/hooks';
import { deviceLanguage, LangPref, loadLanguagePref, setLanguagePref, TKey, useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { radius, useTheme } from '@/lib/theme';

const LANGUAGES: { value: LangPref; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'nb', label: 'Norsk' },
];

export default function Profile() {
  const { t } = useT();
  const { mode, setMode, colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [pref, setPref] = useState<LangPref>(deviceLanguage());
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    loadLanguagePref().then(setPref);
  }, []);

  const { data: profile, reload } = useData(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
    return data as { display_name: string; avatar_url?: string | null } | null;
  }, [user?.id]);

  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  const chooseAvatar = async (id: string) => {
    setSavingAvatar(true);
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarValue(id) }).eq('id', user!.id);
    setSavingAvatar(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    setAvatarOpen(false);
    reload();
  };

  const saveName = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user!.id);
    setSaving(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else reload();
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={8}>
          <Ionicons name="sunny-outline" size={22} color={mode === 'light' ? colors.accent : colors.textMuted} />
          <Switch
            accessibilityLabel={t('profile.appearance')}
            value={mode === 'dark'}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
          <Ionicons name="moon-outline" size={20} color={mode === 'dark' ? colors.primary : colors.textMuted} />
        </Row>
        <Pressable
          accessibilityLabel={t('profile.language')}
          onPress={() => setLangOpen(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            padding: 4,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="globe-outline" size={22} color={colors.primary} />
          <AppText variant="label">{pref.toUpperCase()}</AppText>
        </Pressable>
      </Row>

      <Row>
        <Pressable onPress={() => setAvatarOpen(true)} accessibilityLabel={t('profile.changePhoto')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Avatar name={profile?.display_name ?? '?'} url={profile?.avatar_url} size={72} />
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: colors.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="pencil" size={13} color={colors.onPrimary} />
          </View>
        </Pressable>
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

      <Modal transparent animationType="slide" visible={avatarOpen} onRequestClose={() => setAvatarOpen(false)}>
        <Pressable onPress={() => setAvatarOpen(false)} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => {}}
            style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 20, maxHeight: '80%' }}
          >
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <AppText variant="heading">{t('profile.chooseAvatar')}</AppText>
              <Pressable onPress={() => setAvatarOpen(false)} accessibilityLabel={t('common.cancel')} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </Row>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                {AVATARS.map((a) => {
                  const selected = avatarIdFrom(profile?.avatar_url) === a.id;
                  return (
                    <Pressable
                      key={a.id}
                      disabled={savingAvatar}
                      onPress={() => chooseAvatar(a.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={t(`avatar.${a.id}` as TKey)}
                      style={({ pressed }) => ({ opacity: pressed || savingAvatar ? 0.6 : 1 })}
                    >
                      <View
                        style={{
                          padding: 3,
                          borderRadius: 40,
                          borderWidth: 3,
                          borderColor: selected ? colors.primary : 'transparent',
                        }}
                      >
                        <Avatar name={a.id} url={avatarValue(a.id)} size={58} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="fade" visible={langOpen} onRequestClose={() => setLangOpen(false)}>
        <Pressable
          onPress={() => setLangOpen(false)}
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 32 }}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 8, gap: 4 }}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.value}
                onPress={() => {
                  setPref(l.value);
                  setLanguagePref(l.value);
                  setLangOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: radius.sm,
                  backgroundColor: pressed || pref === l.value ? colors.surfaceAlt : 'transparent',
                })}
              >
                <AppText>{l.label}</AppText>
                {pref === l.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Button variant="danger" icon="log-out-outline" title={t('profile.logout')} onPress={() => signOut()} />
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>
        Chapters & Chatters · v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>
    </Screen>
  );
}
