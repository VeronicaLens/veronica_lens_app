import { Lucide } from '@react-native-vector-icons/lucide';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { theme } from '../../../shared/config/index.ts';
import {
  WHITE_BALANCE_RANGE_KELVIN,
  type AssistedCapturePlan,
  type AssistedCaptureSettings,
} from '../model/assisted-capture.ts';
import type { CameraCapabilities, CameraNumericCapability } from '../model/camera-capabilities.ts';

type ControlId = 'iso' | 'exposure' | 'focus' | 'white-balance';

interface ControlOption {
  label: string;
  settings: Partial<AssistedCaptureSettings>;
  selected: boolean;
}

interface ControlModel {
  id: ControlId;
  label: string;
  value: string;
  disabled: boolean;
  unavailableMessage: string;
  minimumLabel: string;
  maximumLabel: string;
  position: number;
  steps: number;
  fromPosition(position: number): Partial<AssistedCaptureSettings>;
  options: ControlOption[];
}

interface CaptureControlsPanelProps {
  enabled: boolean;
  accent: string;
  capabilities: CameraCapabilities | null;
  plan: AssistedCapturePlan | null;
  onSettingsChange(settings: Partial<AssistedCaptureSettings>): void;
}

const ISO_STOPS = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER_STOPS = [
  1 / 8000,
  1 / 4000,
  1 / 2000,
  1 / 1000,
  1 / 500,
  1 / 250,
  1 / 125,
  1 / 60,
  1 / 30,
  1 / 15,
  1 / 8,
  1 / 4,
  1 / 2,
  1,
  2,
  4,
  8,
  15,
  30,
];
const WHITE_BALANCE_PRESETS = [3200, 4000, 5500, 6500];
const FOCUS_INFINITY = 1;

export function CaptureControlsPanel({
  enabled,
  accent,
  capabilities,
  plan,
  onSettingsChange,
}: CaptureControlsPanelProps) {
  const [openControl, setOpenControl] = useState<ControlId | null>(null);
  const controls = buildControls(capabilities, plan);
  const open = controls.find(({ id }) => id === openControl) ?? null;

  return (
    <View className="gap-2" style={{ opacity: enabled ? 1 : 0.7 }}>
      {!enabled ? (
        <Text className="font-body text-[10px] leading-4 text-muted">
          Assistente desligado: a câmera usa ajustes automáticos. Mexa em um controle para
          reativá-lo.
        </Text>
      ) : null}
      {open ? (
        <View className="gap-1.5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5"
          >
            {open.options.map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected: option.selected }}
                className="h-8 justify-center rounded-pill border px-3 active:opacity-75"
                onPress={() => {
                  onSettingsChange(option.settings);
                  setOpenControl(null);
                }}
                style={{
                  backgroundColor: option.selected ? accent : theme.colors.surface2,
                  borderColor: option.selected ? accent : theme.colors.border,
                }}
              >
                <Text
                  className="font-label text-[11px]"
                  style={{ color: option.selected ? theme.colors.background : theme.colors.text }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {open.disabled ? (
            <Text className="font-body text-[10px] leading-4 text-muted">
              {open.unavailableMessage}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row gap-2">
        {controls.map((control) => (
          <View key={control.id} className="flex-1 gap-1.5">
            <Text className="font-body text-[10px] text-muted" numberOfLines={1}>
              {control.label}
            </Text>
            <Pressable
              accessibilityHint="Mostra valores predefinidos"
              accessibilityLabel={`${control.label}: ${control.value}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: openControl === control.id }}
              className="h-9 flex-row items-center justify-between rounded-control border px-2 active:opacity-75"
              onPress={() =>
                setOpenControl((current) => (current === control.id ? null : control.id))
              }
              style={{
                backgroundColor: theme.colors.surface2,
                borderColor: openControl === control.id ? accent : theme.colors.border,
              }}
            >
              <Text
                className="flex-1 font-label text-[11px]"
                numberOfLines={1}
                style={{ color: control.disabled ? theme.colors.muted : theme.colors.text }}
              >
                {control.value}
              </Text>
              <Lucide
                color={theme.colors.muted}
                name={openControl === control.id ? 'chevron-up' : 'chevron-down'}
                size={13}
              />
            </Pressable>
            <ValueSlider
              accent={accent}
              accessibilityLabel={control.label}
              accessibilityValue={control.value}
              disabled={control.disabled}
              position={control.position}
              steps={control.steps}
              onChange={(position) => onSettingsChange(control.fromPosition(position))}
            />
            <View className="flex-row justify-between">
              <Text className="font-body text-[9px] text-muted">{control.minimumLabel}</Text>
              <Text className="font-body text-[9px] text-muted">{control.maximumLabel}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ValueSlider({
  accent,
  accessibilityLabel,
  accessibilityValue,
  disabled,
  position,
  steps,
  onChange,
}: {
  accent: string;
  accessibilityLabel: string;
  accessibilityValue: string;
  disabled: boolean;
  position: number;
  steps: number;
  onChange(position: number): void;
}) {
  const trackRef = useRef<View>(null);
  const layout = useRef({ x: 0, width: 1 });
  const lastPosition = useRef(position);
  const clamped = clamp(position, 0, 1);
  const color = disabled ? theme.colors.muted : accent;

  function measure() {
    trackRef.current?.measureInWindow((x, _y, width) => {
      layout.current = { x, width: Math.max(1, width) };
    });
  }

  function update(pageX: number) {
    const raw = clamp((pageX - layout.current.x) / layout.current.width, 0, 1);
    const snapped = steps > 1 ? Math.round(raw * (steps - 1)) / (steps - 1) : raw;
    if (Math.abs(snapped - lastPosition.current) < 0.0001) return;
    lastPosition.current = snapped;
    onChange(snapped);
  }

  function step(direction: 1 | -1) {
    const increment = steps > 1 ? 1 / (steps - 1) : 0.05;
    onChange(clamp(clamped + direction * increment, 0, 1));
  }

  return (
    <View
      ref={trackRef}
      accessible
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={{ text: accessibilityValue }}
      className="h-6 justify-center"
      onAccessibilityAction={(event) =>
        !disabled && step(event.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      onLayout={measure}
      onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={(event) => {
        lastPosition.current = clamped;
        update(event.nativeEvent.pageX);
      }}
      onResponderMove={(event) => update(event.nativeEvent.pageX)}
      onResponderTerminationRequest={() => false}
      onStartShouldSetResponder={() => !disabled}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <View className="h-[3px] rounded-full" style={{ backgroundColor: theme.colors.border }} />
      <View
        className="absolute h-[3px] rounded-full"
        style={{ backgroundColor: color, width: `${clamped * 100}%` }}
      />
      <View
        className="absolute h-4 w-4 rounded-full"
        style={{ backgroundColor: color, left: `${clamped * 100}%`, marginLeft: -8 }}
      />
    </View>
  );
}

function buildControls(
  capabilities: CameraCapabilities | null,
  plan: AssistedCapturePlan | null,
): ControlModel[] {
  const manualExposure =
    plan?.exposureMode === 'manual' && plan.iso !== null && plan.exposureTimeSeconds !== null;

  return [
    isoControl(capabilities, manualExposure ? plan.iso : null),
    manualExposure || capabilities?.exposureCompensation.status !== 'supported'
      ? exposureTimeControl(capabilities, manualExposure ? plan.exposureTimeSeconds : null)
      : exposureCompensationControl(capabilities, plan?.exposureCompensationEv ?? 0),
    focusControl(capabilities, plan?.focusLensPosition ?? null),
    whiteBalanceControl(capabilities, plan?.whiteBalanceKelvin ?? null),
  ];
}

function isoControl(capabilities: CameraCapabilities | null, iso: number | null): ControlModel {
  const stops = stopsWithinRange(ISO_STOPS, capabilities?.iso);
  const index = iso === null ? Math.floor((stops.length - 1) / 2) : nearestIndex(stops, iso);
  return {
    id: 'iso',
    label: 'ISO',
    value: iso === null ? 'Auto' : `${Math.round(iso)}`,
    disabled: iso === null,
    unavailableMessage: 'ISO manual indisponível nesta câmera. A câmera ajusta automaticamente.',
    minimumLabel: formatIso(stops[0]),
    maximumLabel: formatIso(stops.at(-1)),
    position: stops.length > 1 ? index / (stops.length - 1) : 0,
    steps: stops.length,
    fromPosition: (position) => {
      const iso = stops[Math.round(position * (stops.length - 1))];
      return iso === undefined ? {} : { iso };
    },
    options:
      iso === null
        ? [{ label: 'Auto', settings: {}, selected: true }]
        : stops.map((stop) => ({
            label: formatIso(stop),
            settings: { iso: stop },
            selected: Math.abs(stop - iso) < 1,
          })),
  };
}

function exposureTimeControl(
  capabilities: CameraCapabilities | null,
  seconds: number | null,
): ControlModel {
  const stops = stopsWithinRange(SHUTTER_STOPS, capabilities?.exposureTime);
  const index =
    seconds === null ? Math.floor((stops.length - 1) / 2) : nearestIndex(stops, seconds);
  return {
    id: 'exposure',
    label: 'Tempo de exposição',
    value: seconds === null ? 'Auto' : formatShutter(seconds),
    disabled: seconds === null,
    unavailableMessage:
      'Tempo de exposição manual indisponível nesta câmera. A câmera ajusta automaticamente.',
    minimumLabel: formatShutter(stops[0]),
    maximumLabel: formatShutter(stops.at(-1)),
    position: stops.length > 1 ? index / (stops.length - 1) : 0,
    steps: stops.length,
    fromPosition: (position) => {
      const exposureTimeSeconds = stops[Math.round(position * (stops.length - 1))];
      return exposureTimeSeconds === undefined ? {} : { exposureTimeSeconds };
    },
    options:
      seconds === null
        ? [{ label: 'Auto', settings: {}, selected: true }]
        : stops.map((stop) => ({
            label: formatShutter(stop),
            settings: { exposureTimeSeconds: stop },
            selected: Math.abs(Math.log2(stop / seconds)) < 0.1,
          })),
  };
}

function exposureCompensationControl(
  capabilities: CameraCapabilities | null,
  ev: number,
): ControlModel {
  const minimum = Math.max(-3, capabilities?.exposureCompensation.minimum ?? -2);
  const maximum = Math.min(3, capabilities?.exposureCompensation.maximum ?? 2);
  const stops: number[] = [];
  for (let value = Math.ceil(minimum * 2) / 2; value <= maximum + 0.001; value += 0.5) {
    stops.push(Number(value.toFixed(1)));
  }
  const index = stops.reduce(
    (best, stop, candidate) =>
      Math.abs(stop - ev) < Math.abs((stops[best] ?? stop) - ev) ? candidate : best,
    0,
  );
  return {
    id: 'exposure',
    label: 'Exposição',
    value: formatEv(ev),
    disabled: stops.length < 2,
    unavailableMessage: 'Compensação de exposição indisponível nesta câmera.',
    minimumLabel: formatEv(stops[0] ?? minimum),
    maximumLabel: formatEv(stops.at(-1) ?? maximum),
    position: stops.length > 1 ? index / (stops.length - 1) : 0.5,
    steps: stops.length,
    fromPosition: (position) => ({
      exposureCompensationEv: stops[Math.round(position * (stops.length - 1))] ?? 0,
    }),
    options: stops.map((stop) => ({
      label: formatEv(stop),
      settings: { exposureCompensationEv: stop },
      selected: Math.abs(stop - ev) < 0.01,
    })),
  };
}

function focusControl(
  capabilities: CameraCapabilities | null,
  lensPosition: number | null,
): ControlModel {
  const supported = capabilities?.focus.lockingSupported === true;
  return {
    id: 'focus',
    label: 'Foco',
    value: !supported || lensPosition === null ? 'Auto' : lensPosition >= 0.99 ? '∞' : 'Manual',
    disabled: !supported,
    unavailableMessage:
      'Foco manual indisponível nesta câmera. Toque no astro no visor para focar automaticamente.',
    minimumLabel: 'Perto',
    maximumLabel: '∞',
    position: lensPosition ?? FOCUS_INFINITY,
    steps: 101,
    fromPosition: (position) => ({ focusLensPosition: position }),
    options: supported
      ? [
          { label: 'Auto', settings: { focusLensPosition: null }, selected: lensPosition === null },
          {
            label: 'Infinito ∞',
            settings: { focusLensPosition: FOCUS_INFINITY },
            selected: lensPosition !== null && lensPosition >= 0.99,
          },
        ]
      : [{ label: 'Auto', settings: {}, selected: true }],
  };
}

function whiteBalanceControl(
  capabilities: CameraCapabilities | null,
  kelvin: number | null,
): ControlModel {
  const supported = capabilities?.whiteBalance.lockingSupported === true;
  const { minimum, maximum } = WHITE_BALANCE_RANGE_KELVIN;
  const steps = (maximum - minimum) / 100 + 1;
  return {
    id: 'white-balance',
    label: 'WB',
    value: !supported || kelvin === null ? 'Auto' : `${Math.round(kelvin)}K`,
    disabled: !supported,
    unavailableMessage:
      'Balanço de branco manual indisponível nesta câmera. A câmera ajusta as cores automaticamente.',
    minimumLabel: `${minimum}K`,
    maximumLabel: `${maximum}K`,
    position: ((kelvin ?? 4000) - minimum) / (maximum - minimum),
    steps,
    fromPosition: (position) => ({
      whiteBalanceKelvin: Math.round((minimum + position * (maximum - minimum)) / 100) * 100,
    }),
    options: supported
      ? [
          { label: 'Auto', settings: { whiteBalanceKelvin: null }, selected: kelvin === null },
          ...WHITE_BALANCE_PRESETS.map((preset) => ({
            label: `${preset}K`,
            settings: { whiteBalanceKelvin: preset },
            selected: kelvin === preset,
          })),
        ]
      : [{ label: 'Auto', settings: {}, selected: true }],
  };
}

function stopsWithinRange(
  stops: number[],
  capability: CameraNumericCapability | undefined,
): number[] {
  if (
    !capability ||
    capability.status !== 'supported' ||
    capability.minimum === null ||
    capability.maximum === null
  ) {
    return stops;
  }
  const minimum = capability.minimum;
  const maximum = capability.maximum;
  const inside = stops.filter((stop) => stop > minimum * 1.0001 && stop < maximum * 0.9999);
  return [minimum, ...inside, maximum].filter(
    (value, index, values) => index === 0 || Math.abs(value - (values[index - 1] ?? 0)) > 1e-9,
  );
}

function nearestIndex(stops: number[], value: number): number {
  let best = 0;
  stops.forEach((stop, index) => {
    const current = stops[best] ?? stop;
    if (Math.abs(Math.log(stop / value)) < Math.abs(Math.log(current / value))) best = index;
  });
  return best;
}

function formatIso(value: number | undefined): string {
  return value === undefined ? '' : `${Math.round(value)}`;
}

function formatShutter(value: number | undefined): string {
  if (value === undefined) return '';
  if (value >= 1) return `${Number(value.toFixed(1)).toLocaleString('pt-BR')} s`;
  return `1/${Math.round(1 / value)}`;
}

function formatEv(value: number): string {
  const formatted = Number(value.toFixed(1)).toLocaleString('pt-BR');
  return `${value > 0 ? '+' : ''}${formatted} EV`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
