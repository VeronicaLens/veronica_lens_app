import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

import { theme } from '../config/index.ts';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="font-label text-[11px] uppercase tracking-wide text-accent">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        className="h-11 min-h-11 rounded-control border border-border bg-surface px-4 font-body text-sm text-ink focus:border-info"
        placeholderTextColor={theme.colors.muted}
        {...props}
      />
    </View>
  );
}
