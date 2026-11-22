import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useDebounced } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { autocompletePlaces, mapsUrl, Place, placeDetails, placesEnabled, PlaceSuggestion } from '@/lib/places';
import { useTheme } from '@/lib/theme';
import { AppText, Button, Card, Input, Row } from './ui';

/**
 * Meeting location picker. With a Google Places key it autocompletes real
 * places (and stores place id + coordinates); without one it accepts a typed
 * name/address. Either way the place can be opened in Google Maps.
 */
export function PlacePicker({ value, onChange }: { value: Place | null; onChange: (p: Place | null) => void }) {
  const { t, lang } = useT();
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 350);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!placesEnabled || value) return;
    let cancelled = false;
    autocompletePlaces(dq, lang)
      .then((s) => !cancelled && setSuggestions(s))
      .catch(() => !cancelled && setSuggestions([]));
    return () => {
      cancelled = true;
    };
  }, [dq, lang, value]);

  if (value) {
    return (
      <Card>
        <Row style={{ alignItems: 'flex-start' }}>
          <Ionicons name="location" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{value.name}</AppText>
            {value.address ? (
              <AppText variant="caption" muted>
                {value.address}
              </AppText>
            ) : null}
          </View>
        </Row>
        <Row>
          <Button small variant="secondary" icon="map-outline" title={t('place.openMaps')} onPress={() => Linking.openURL(mapsUrl(value))} />
          <Button small variant="ghost" title={t('place.change')} onPress={() => (onChange(null), setQ(''), setAddress(''))} />
        </Row>
      </Card>
    );
  }

  if (!placesEnabled) {
    return (
      <View style={{ gap: 10 }}>
        <Input label={t('place.name')} value={q} onChangeText={setQ} placeholder={t('place.namePlaceholder')} />
        <Input label={t('place.address')} value={address} onChangeText={setAddress} />
        <Button
          small
          variant="secondary"
          title={t('place.use')}
          disabled={!q.trim()}
          onPress={() => onChange({ place_id: null, name: q.trim(), address: address.trim() || null, lat: null, lng: null })}
        />
        <AppText variant="caption" muted>
          {t('place.noKey')}
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Input label={t('place.search')} value={q} onChangeText={setQ} placeholder={t('place.searchPlaceholder')} />
      {suggestions.map((s) => (
        <Pressable
          key={s.place_id}
          onPress={async () => {
            try {
              onChange(await placeDetails(s.place_id, lang));
            } catch {
              onChange({ place_id: s.place_id, name: s.main, address: s.secondary || null, lat: null, lng: null });
            }
          }}
          style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 }}
        >
          <Ionicons name="location-outline" size={20} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <AppText>{s.main}</AppText>
            <AppText variant="caption" muted>
              {s.secondary}
            </AppText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
