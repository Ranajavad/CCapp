import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useT } from '@/lib/i18n';
import { fonts, radius, useTheme } from '@/lib/theme';
import { initials } from '@/lib/format';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------- Text
type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';

export function AppText({
  variant = 'body',
  muted,
  style,
  children,
  ...rest
}: {
  variant?: Variant;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  numberOfLines?: number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const base: Record<Variant, TextStyle> = {
    title: { fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', lineHeight: 34 },
    heading: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', lineHeight: 26 },
    subheading: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
    body: { fontSize: 15, lineHeight: 22 },
    caption: { fontSize: 13, lineHeight: 18 },
    label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  };
  return (
    <Text {...rest} style={[base[variant], { color: muted ? colors.textMuted : colors.text }, style]}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------- Layout
export function Screen({
  children,
  scroll = true,
  style,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ padding: 16, gap: 16, paddingBottom: 40 }, style]}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, style]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
}

export function Row({
  children,
  style,
  gap = 12,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const s: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={s}>{children}</View>;
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText variant="heading">{title}</AppText>
        {action}
      </Row>
      {children}
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

// ---------------------------------------------------------------- Controls
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  small,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.surfaceAlt : 'transparent';
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? '#FFFFFF' : variant === 'ghost' ? colors.primary : colors.text;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          paddingVertical: small ? 8 : 13,
          paddingHorizontal: small ? 14 : 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color, size = 22 }: { icon: IconName; onPress?: () => void; color?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}>
      <Ionicons name={icon} size={size} color={color ?? colors.text} />
    </Pressable>
  );
}

export function Input({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="caption" muted style={{ fontWeight: '600' }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: Platform.OS === 'ios' ? 13 : 10,
            fontSize: 16,
            color: colors.text,
            minHeight: props.multiline ? 90 : undefined,
            textAlignVertical: props.multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.primary : colors.surfaceAlt,
      }}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.onPrimary : colors.text} /> : null}
      <Text style={{ color: selected ? colors.onPrimary : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 3 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: on ? colors.primary : 'transparent',
            }}
          >
            <Text
              numberOfLines={1}
              style={{ color: on ? colors.onPrimary : colors.text, fontWeight: '600', fontSize: 13 }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stars({
  value,
  onChange,
  size = 24,
}: {
  value: number | null | undefined;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} hitSlop={4}>
          <Ionicons name={(value ?? 0) >= n ? 'star' : 'star-outline'} size={size} color={colors.accent} />
        </Pressable>
      ))}
    </View>
  );
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: color ?? colors.surfaceAlt,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: color ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- Media
const AVATAR_COLORS = ['#6B2D5C', '#2E7D5B', '#B5651D', '#3B5BA5', '#8E3B46', '#5B6B2D'];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: AVATAR_COLORS[h],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}

export function BookCover({
  url,
  title,
  width = 64,
  style,
}: {
  url?: string | null;
  title?: string;
  width?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const h = Math.round(width * 1.5);
  const box: ViewStyle = { width, height: h, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surfaceAlt };
  // The image is streamed from the API's URL; nothing is downloaded or stored by us.
  if (url) return <Image source={{ uri: url }} style={[box, style as any]} resizeMode="cover" />;
  return (
    <View style={[box, { padding: 6, justifyContent: 'center', backgroundColor: colors.primary }, style]}>
      <Text
        numberOfLines={4}
        style={{ color: colors.onPrimary, fontFamily: fonts.serif, fontSize: Math.max(9, width * 0.14), fontWeight: '700', textAlign: 'center' }}
      >
        {title ?? ''}
      </Text>
    </View>
  );
}

export function Logo({ size = 64 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.8,
          height: size * 0.54,
          borderRadius: size * 0.2,
          backgroundColor: colors.onPrimary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: size * 0.08,
        }}
      >
        <Text style={{ fontFamily: fonts.serif, fontWeight: '800', fontSize: size * 0.26, color: colors.primary }}>C&amp;C</Text>
        <View style={{ width: size * 0.3, height: Math.max(2, size * 0.035), backgroundColor: colors.accent, borderRadius: 2 }} />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.1,
          left: size * 0.24,
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.08,
          borderRightWidth: size * 0.08,
          borderTopWidth: size * 0.13,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.onPrimary,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------- States
export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function EmptyState({
  icon = 'book-outline',
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 28, gap: 10 }}>
      <Ionicons name={icon} size={44} color={colors.textMuted} />
      <AppText variant="subheading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" muted style={{ textAlign: 'center' }}>
          {body}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useT();
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={t('common.somethingWrong')}
      body={message}
      action={onRetry ? <Button title={t('common.retry')} onPress={onRetry} small variant="secondary" /> : undefined}
    />
  );
}
