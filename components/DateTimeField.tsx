import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { fmtDateTime } from '@/lib/format';
import { radius, useTheme } from '@/lib/theme';
import { AppText } from './ui';

/** Date + time picker that works on both iOS (compact picker) and Android (dialogs). */
export function DateTimeField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  minimumDate?: Date;
}) {
  const { colors, scheme } = useTheme();

  const openAndroid = () =>
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      minimumDate,
      onChange: (e, d) => {
        if (e.type !== 'set' || !d) return;
        DateTimePickerAndroid.open({
          value: d,
          mode: 'time',
          is24Hour: true,
          onChange: (e2, d2) => {
            if (e2.type === 'set' && d2) onChange(d2);
          },
        });
      },
    });

  return (
    <View style={{ gap: 6 }}>
      <AppText variant="caption" muted style={{ fontWeight: '600' }}>
        {label}
      </AppText>
      {Platform.OS === 'ios' ? (
        <View style={{ alignItems: 'flex-start' }}>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="compact"
            minimumDate={minimumDate}
            themeVariant={scheme}
            onChange={(_e, d) => d && onChange(d)}
          />
        </View>
      ) : (
        <Pressable
          onPress={openAndroid}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <AppText>{fmtDateTime(value)}</AppText>
        </Pressable>
      )}
    </View>
  );
}
