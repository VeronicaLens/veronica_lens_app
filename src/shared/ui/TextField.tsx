import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useState, type ReactNode } from 'react';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

import { theme } from '../config/index.ts';

interface TextFieldProps extends TextInputProps {
  label: string;
  icon?: LucideIconName;
  trailing?: ReactNode;
}

export function TextField({ label, icon, trailing, onBlur, onFocus, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <Text className="font-label text-[11px] uppercase tracking-wide text-accent">{label}</Text>
      <View
        className={`h-11 min-h-11 flex-row items-center gap-2 rounded-control border bg-surface px-4 ${
          focused ? 'border-info' : 'border-border'
        }`}
      >
        {icon ? <Lucide color={theme.colors.muted} name={icon} size={16} /> : null}
        <TextInput
          accessibilityLabel={label}
          className="flex-1 font-body text-sm text-ink"
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.colors.muted}
          {...props}
        />
        {trailing}
      </View>
    </View>
  );
}
