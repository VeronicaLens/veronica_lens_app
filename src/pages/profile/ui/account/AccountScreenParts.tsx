import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../../../shared/config/index.ts';

export function AccountScreenLayout({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack(): void;
  children: ReactNode;
}) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-10 pt-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Pressable
            accessibilityLabel="Voltar ao perfil"
            accessibilityRole="button"
            className="mb-1 h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
            onPress={onBack}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={19} />
          </Pressable>
          <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
            {title}
          </Text>
          <Text className="font-body text-sm leading-5 text-muted">{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AccountSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-label text-base text-ink">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function InfoRow({
  icon,
  title,
  description,
  trailing,
}: {
  icon: LucideIconName;
  title: string;
  description: string;
  trailing?: ReactNode;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${description}`}
      className="flex-row items-start gap-3 rounded-control bg-surface px-4 py-3"
    >
      <View className="w-5 items-center pt-0.5">
        <Lucide color={theme.colors.accent} name={icon} size={17} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-label text-[13px] text-ink">{title}</Text>
        <Text className="font-body text-xs leading-[18px] text-muted">{description}</Text>
      </View>
      {trailing}
    </View>
  );
}

export function LinkRow({
  icon,
  label,
  onPress,
}: {
  icon: LucideIconName;
  label: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      className="min-h-[48px] flex-row items-center rounded-control bg-surface px-4 active:opacity-80"
      onPress={onPress}
    >
      <Lucide color={theme.colors.accent} name={icon} size={16} />
      <Text className="ml-3 flex-1 font-body text-xs text-ink">{label}</Text>
      <Lucide color={theme.colors.muted} name="external-link" size={15} />
    </Pressable>
  );
}
