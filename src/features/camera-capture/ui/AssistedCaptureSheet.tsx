import { Lucide } from '@react-native-vector-icons/lucide';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CameraCapabilities } from '../model/camera-capabilities.ts';
import type { AssistedCapturePlan, AssistedCaptureSettings } from '../model/assisted-capture.ts';
import { theme } from '../../../shared/config/index.ts';

interface AssistedCaptureSheetProps {
  visible: boolean;
  enabled: boolean;
  capabilities: CameraCapabilities | null;
  plan: AssistedCapturePlan | null;
  settings: AssistedCaptureSettings;
  onClose(): void;
  onEnabledChange(enabled: boolean): void;
  onSettingsChange(settings: Partial<AssistedCaptureSettings>): void;
}

export function AssistedCaptureSheet({
  visible,
  enabled,
  capabilities,
  plan,
  settings,
  onClose,
  onEnabledChange,
  onSettingsChange,
}: AssistedCaptureSheetProps) {
  const insets = useSafeAreaInsets();
  const manualExposureAvailable = plan?.iso !== null && plan?.exposureTimeSeconds !== null;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Fechar ajustes de captura"
          accessibilityRole="button"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
        <View
          className="gap-5 rounded-t-panel border-t border-border bg-surface px-5 pt-5"
          style={{ paddingBottom: 20 + insets.bottom }}
        >
          <View className="h-1 w-12 self-center rounded-pill bg-border" />
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text accessibilityRole="header" className="font-display text-lg text-ink">
                Foto assistida
              </Text>
              <Text className="font-body text-[11px] text-muted">
                Ajustes limitados ao suporte desta câmera
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar ajustes"
              accessibilityRole="button"
              className="p-2"
              onPress={onClose}
            >
              <Lucide color={theme.colors.muted} name="x" size={20} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled }}
            className="min-h-12 flex-row items-center justify-between border-y border-border py-3"
            onPress={() => onEnabledChange(!enabled)}
          >
            <View className="flex-row items-center gap-3">
              <Lucide color={theme.colors.accent} name="sparkles" size={18} />
              <View className="gap-0.5">
                <Text className="font-label text-xs text-ink">Aplicar recomendações</Text>
                <Text className="font-body text-[10px] text-muted">
                  Foco, exposição e estabilidade
                </Text>
              </View>
            </View>
            <View
              className="h-6 w-11 justify-center rounded-pill px-0.5"
              style={{ backgroundColor: enabled ? theme.colors.accent : theme.colors.border }}
            >
              <View
                className="h-5 w-5 rounded-full bg-surface"
                style={{ alignSelf: enabled ? 'flex-end' : 'flex-start' }}
              />
            </View>
          </Pressable>

          {!capabilities || !plan ? (
            <Text className="font-body text-xs leading-5 text-muted">
              Lendo os recursos da câmera...
            </Text>
          ) : (
            <>
              <View className="gap-3">
                <Text className="font-label text-xs text-ink">Recomendado para esta captura</Text>
                {plan.recommendations.map((recommendation) => (
                  <View key={recommendation.id} className="flex-row items-start gap-3">
                    <Lucide
                      color={theme.colors.accent}
                      name={iconFor(recommendation.id)}
                      size={15}
                    />
                    <View className="flex-1 gap-0.5">
                      <Text className="font-label text-[11px] text-ink">
                        {recommendation.title}
                      </Text>
                      <Text className="font-body text-[10px] leading-4 text-muted">
                        {recommendation.detail}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View className="gap-3 border-t border-border pt-4">
                <Text className="font-label text-xs text-ink">Ajustes da câmera</Text>
                {plan.exposureMode === 'manual' && manualExposureAvailable ? (
                  <>
                    <NumericControl
                      label="ISO"
                      value={plan.iso ?? 0}
                      minimum={capabilities.iso.minimum ?? 0}
                      maximum={capabilities.iso.maximum ?? 0}
                      format={(value) => `${Math.round(value)}`}
                      step={(value, direction, minimum, maximum) =>
                        clamp(value + direction * 100, minimum, maximum)
                      }
                      onChange={(value) => onSettingsChange({ iso: value })}
                    />
                    <NumericControl
                      label="Obturador"
                      value={plan.exposureTimeSeconds ?? 0}
                      minimum={capabilities.exposureTime.minimum ?? 0}
                      maximum={capabilities.exposureTime.maximum ?? 0}
                      format={formatExposureTime}
                      step={(value, direction, minimum, maximum) =>
                        clamp(value * (direction > 0 ? 2 : 0.5), minimum, maximum)
                      }
                      onChange={(value) => onSettingsChange({ exposureTimeSeconds: value })}
                    />
                  </>
                ) : capabilities.exposureCompensation.status === 'supported' &&
                  plan.exposureMode !== 'manual' ? (
                  <NumericControl
                    label="Compensação de exposição"
                    value={plan.exposureCompensationEv}
                    minimum={capabilities.exposureCompensation.minimum ?? 0}
                    maximum={capabilities.exposureCompensation.maximum ?? 0}
                    format={(value) => `${value > 0 ? '+' : ''}${Number(value.toFixed(1))}`}
                    step={(value, direction, minimum, maximum) =>
                      clamp(Math.round(value + direction), minimum, maximum)
                    }
                    onChange={(value) => onSettingsChange({ exposureCompensationEv: value })}
                  />
                ) : (
                  <Text className="font-body text-[10px] leading-4 text-muted">
                    A câmera mantém a exposição automática neste aparelho.
                  </Text>
                )}
                {capabilities.iso.status !== 'supported' ? (
                  <Text className="font-body text-[10px] leading-4 text-muted">
                    ISO e obturador ficam automáticos: o controle manual não está disponível para
                    esta câmera e plataforma.
                  </Text>
                ) : null}
              </View>
            </>
          )}

          <Pressable
            accessibilityRole="button"
            className="h-12 items-center justify-center rounded-pill bg-brand active:opacity-80"
            onPress={onClose}
          >
            <Text className="font-label text-xs text-ink">Concluir ajustes</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function NumericControl({
  label,
  value,
  minimum,
  maximum,
  format,
  step,
  onChange,
}: {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  format(value: number): string;
  step(value: number, direction: -1 | 1, minimum: number, maximum: number): number;
  onChange(value: number): void;
}) {
  return (
    <View className="min-h-11 flex-row items-center justify-between">
      <Text className="font-body text-xs text-muted">{label}</Text>
      <View className="flex-row items-center gap-4">
        <StepButton
          label={`Diminuir ${label}`}
          disabled={value <= minimum}
          onPress={() => onChange(step(value, -1, minimum, maximum))}
        />
        <Text
          accessibilityLiveRegion="polite"
          className="min-w-[72px] text-center font-label text-xs text-ink"
        >
          {format(value)}
        </Text>
        <StepButton
          label={`Aumentar ${label}`}
          disabled={value >= maximum}
          onPress={() => onChange(step(value, 1, minimum, maximum))}
        />
      </View>
    </View>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="h-9 w-9 items-center justify-center rounded-full border border-border active:opacity-70"
      disabled={disabled}
      onPress={onPress}
    >
      <Lucide
        color={disabled ? theme.colors.muted : theme.colors.accent}
        name={label.startsWith('Diminuir') ? 'minus' : 'plus'}
        size={16}
      />
    </Pressable>
  );
}

function iconFor(id: 'focus' | 'exposure' | 'stability'): 'crosshair' | 'sun' | 'move' {
  switch (id) {
    case 'focus':
      return 'crosshair';
    case 'exposure':
      return 'sun';
    case 'stability':
      return 'move';
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatExposureTime(value: number): string {
  if (value >= 1) return `${Number(value.toFixed(2))} s`;
  return `1/${Math.round(1 / value)} s`;
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.62)' },
});
