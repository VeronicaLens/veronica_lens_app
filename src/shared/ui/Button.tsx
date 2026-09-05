import { ActivityIndicator, Pressable, Text } from 'react-native';

import { theme } from '../config/index.ts';

interface ButtonProps {
  label: string;
  onPress(): void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({
  label,
  onPress,
  busy = false,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const isDisabled = disabled || busy;
  const primary = variant === 'primary';
  const secondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: isDisabled }}
      className={`h-11 min-h-11 items-center justify-center rounded-pill border px-5 active:opacity-80 ${
        primary
          ? 'border-brand bg-brand'
          : secondary
            ? 'border-border bg-surface-2'
            : 'border-transparent bg-canvas'
      } ${isDisabled ? 'opacity-60' : ''}`}
      disabled={isDisabled}
      onPress={onPress}
    >
      {busy ? (
        <ActivityIndicator color={primary ? theme.colors.text : theme.colors.accent} />
      ) : (
        <Text className={`font-label text-xs ${primary || secondary ? 'text-ink' : 'text-accent'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
