import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConditionsForecast } from '../../../features/current-conditions/index.ts';
import { useDeviceLocation, type DeviceLocation } from '../../../features/device-location/index.ts';
import type {
  CurrentConditions,
  CurrentConditionsFactor,
  ObservationRating,
} from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

interface ObservationConditionsPageProps {
  accessToken: string;
  initialLocation: DeviceLocation | null;
  onBack(): void;
}

const ratingConfig: Record<ObservationRating, { label: string; color: string }> = {
  good: { label: 'Favoráveis', color: theme.colors.info },
  fair: { label: 'Atenção a alguns fatores', color: theme.colors.event },
  poor: { label: 'Desfavoráveis', color: theme.colors.muted },
};

const factorConfig: Record<
  CurrentConditionsFactor['code'],
  { label: string; icon: LucideIconName }
> = {
  'cloud-cover': { label: 'Nuvens', icon: 'cloud' },
  precipitation: { label: 'Chuva', icon: 'cloud-rain' },
  visibility: { label: 'Visibilidade', icon: 'eye' },
  wind: { label: 'Vento', icon: 'wind' },
  humidity: { label: 'Umidade', icon: 'droplets' },
};

const statusLabels = {
  good: 'Favorável',
  caution: 'Atenção',
  poor: 'Desfavorável',
} as const;

const ratingOrder: Record<ObservationRating, number> = { good: 2, fair: 1, poor: 0 };

export function ObservationConditionsPage({
  accessToken,
  initialLocation,
  onBack,
}: ObservationConditionsPageProps) {
  const deviceLocation = useDeviceLocation(!initialLocation);
  const observer = initialLocation ?? deviceLocation.location;
  const forecast = useConditionsForecast(accessToken, observer);
  const [selectedDayKey, setSelectedDayKey] = useState(() => localDateKey(new Date()));
  const [selectedSampleAt, setSelectedSampleAt] = useState<string | null>(null);
  const now = new Date();

  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    const dateKey = localDateKey(date);
    const samples = (forecast.forecast?.hourly ?? []).filter((sample) =>
      isSameLocalDay(new Date(sample.observedAt), date),
    );
    const nightSamples = samples.filter((sample) => {
      const hour = new Date(sample.observedAt).getHours();
      return hour >= 18 || hour < 6;
    });
    const bestSample = chooseBestSample(nightSamples.length > 0 ? nightSamples : samples);
    return { date, dateKey, samples, bestSample };
  });

  const selectedDay = days.find((day) => day.dateKey === selectedDayKey) ?? days[0] ?? null;
  const selectedSample =
    selectedDay?.samples.find((sample) => sample.observedAt === selectedSampleAt) ??
    selectedDay?.bestSample ??
    null;

  const chooseDay = (dateKey: string, bestSample: CurrentConditions | null) => {
    setSelectedDayKey(dateKey);
    setSelectedSampleAt(bestSample?.observedAt ?? null);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-5">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Voltar para o início"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={onBack}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={20} />
          </Pressable>
          <View className="flex-1 gap-1">
            <Text className="font-label text-[10px] uppercase tracking-[2px] text-accent">
              Planejamento
            </Text>
            <Text accessibilityRole="header" className="font-display text-xl text-ink">
              Próximos 7 dias
            </Text>
          </View>
          <Lucide color={theme.colors.accent} name="calendar-clock" size={22} />
        </View>

        <View className="gap-2 rounded-panel border border-border bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <Lucide color={theme.colors.accent} name="map-pin" size={16} />
            <Text className="font-label text-xs text-ink">
              {observer ? 'Previsão para sua localização' : 'Localização necessária'}
            </Text>
          </View>
          <Text className="font-body text-xs leading-5 text-muted">
            Toque em um dia para ver os horários previstos. Os horários são locais e a avaliação
            considera clima, não a posição de um objeto específico no céu.
          </Text>
        </View>

        {!observer ? (
          <View className="items-center gap-3 rounded-panel border border-border bg-surface p-6">
            {deviceLocation.status === 'requesting-permission' ||
            deviceLocation.status === 'locating' ? (
              <>
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="font-body text-sm text-muted">Obtendo sua localização...</Text>
              </>
            ) : (
              <>
                <Lucide color={theme.colors.event} name="map-pin-off" size={24} />
                <Text className="text-center font-body text-sm leading-5 text-muted">
                  {deviceLocation.fallbackMessage ??
                    'Ative a localização para consultar a previsão neste ponto.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="rounded-pill bg-brand px-5 py-3 active:opacity-80"
                  onPress={deviceLocation.retry}
                >
                  <Text className="font-label text-xs text-ink">Tentar novamente</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : forecast.loading ? (
          <View className="items-center gap-3 rounded-panel border border-border bg-surface p-8">
            <ActivityIndicator color={theme.colors.primary} />
            <Text className="font-body text-sm text-muted">
              Carregando a previsão horária dos próximos 7 dias...
            </Text>
          </View>
        ) : forecast.error ? (
          <View className="items-center gap-3 rounded-panel border border-border bg-surface p-6">
            <Lucide color={theme.colors.event} name="cloud-off" size={24} />
            <Text accessibilityRole="alert" className="text-center font-body text-sm text-muted">
              {forecast.error}
            </Text>
            <Pressable
              accessibilityRole="button"
              className="rounded-pill bg-brand px-5 py-3 active:opacity-80"
              onPress={forecast.refresh}
            >
              <Text className="font-label text-xs text-ink">Tentar novamente</Text>
            </Pressable>
          </View>
        ) : forecast.forecast ? (
          <>
            <View className="gap-3">
              <View className="gap-1">
                <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                  Previsão por dia
                </Text>
                <Text className="font-body text-xs text-muted">
                  Melhor horário meteorológico previsto para cada noite.
                </Text>
              </View>
              {days.map((day, index) => (
                <DayForecastCard
                  key={day.dateKey}
                  bestSample={day.bestSample}
                  date={day.date}
                  isSelected={selectedDayKey === day.dateKey}
                  number={index + 1}
                  onPress={() => chooseDay(day.dateKey, day.bestSample)}
                />
              ))}
            </View>

            {selectedDay ? (
              <View className="gap-4 rounded-panel border border-border bg-surface p-5">
                <View className="gap-1">
                  <Text className="font-label text-[11px] uppercase tracking-[1.5px] text-accent">
                    Horários de {formatDate(selectedDay.date)}
                  </Text>
                  <Text className="font-body text-xs text-muted">
                    Selecione um horário para ver os fatores da previsão.
                  </Text>
                </View>
                {selectedDay.samples.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {selectedDay.samples.map((sample) => (
                        <HourForecastChip
                          key={sample.observedAt}
                          isSelected={selectedSample?.observedAt === sample.observedAt}
                          onPress={() => setSelectedSampleAt(sample.observedAt)}
                          sample={sample}
                        />
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <Text className="font-body text-sm leading-5 text-muted">
                    Não há horários disponíveis para esse dia na previsão atual.
                  </Text>
                )}

                {selectedSample ? (
                  <ForecastResult fetchedAt={forecast.forecast.fetchedAt} sample={selectedSample} />
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          <View className="rounded-panel border border-border bg-surface p-5">
            <Text className="font-body text-sm leading-5 text-muted">
              Ainda não há dados de previsão disponíveis para sua localização.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DayForecastCard({
  bestSample,
  date,
  isSelected,
  number,
  onPress,
}: {
  bestSample: CurrentConditions | null;
  date: Date;
  isSelected: boolean;
  number: number;
  onPress(): void;
}) {
  const ratingDetails = bestSample ? ratingConfig[bestSample.rating] : null;

  return (
    <Pressable
      accessibilityLabel={`${formatDayLabel(date, number)}${
        ratingDetails ? `: ${ratingDetails.label}` : ': sem previsão'
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={`flex-row items-center gap-3 rounded-panel border p-4 active:opacity-80 ${
        isSelected ? 'border-brand bg-surface' : 'border-border bg-surface'
      }`}
      onPress={onPress}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
        <Text className="font-label text-xs text-accent">{number}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-label text-sm text-ink">{formatDayLabel(date, number)}</Text>
        {bestSample ? (
          <Text className="font-body text-xs text-muted">
            Melhor horário estimado: {formatTime(new Date(bestSample.observedAt))}
          </Text>
        ) : (
          <Text className="font-body text-xs text-muted">Sem horários disponíveis</Text>
        )}
      </View>
      {ratingDetails ? (
        <View className="flex-row items-center gap-2">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ratingDetails.color }}
          />
          <Text
            className="max-w-24 text-right font-label text-[10px]"
            style={{ color: ratingDetails.color }}
          >
            {ratingDetails.label}
          </Text>
        </View>
      ) : null}
      <Lucide color={theme.colors.muted} name="chevron-right" size={16} />
    </Pressable>
  );
}

function HourForecastChip({
  isSelected,
  onPress,
  sample,
}: {
  isSelected: boolean;
  onPress(): void;
  sample: CurrentConditions;
}) {
  const color = ratingConfig[sample.rating].color;

  return (
    <Pressable
      accessibilityLabel={`${formatTime(new Date(sample.observedAt))}, ${ratingConfig[sample.rating].label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={`min-w-16 items-center gap-2 rounded-control border px-3 py-3 ${
        isSelected ? 'border-brand bg-brand' : 'border-border bg-surface-2'
      }`}
      onPress={onPress}
    >
      <Text className="font-label text-xs text-ink">{formatTime(new Date(sample.observedAt))}</Text>
      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    </Pressable>
  );
}

function ForecastResult({ fetchedAt, sample }: { fetchedAt: string; sample: CurrentConditions }) {
  const ratingDetails = ratingConfig[sample.rating];

  return (
    <View className="gap-4 rounded-control border border-border bg-canvas p-4">
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ratingDetails.color }}
          />
          <Text className="font-label text-sm text-ink">{ratingDetails.label}</Text>
        </View>
        <Text className="font-body text-xs text-muted">
          Previsão para {formatDateTime(new Date(sample.observedAt))} ·{' '}
          {Math.round(sample.temperatureCelsius)}°C · Atualizada às{' '}
          {formatTime(new Date(fetchedAt))}
        </Text>
      </View>
      <View className="h-px bg-border" />
      <View className="gap-3">
        {sample.factors.map((factor) => (
          <FactorRow key={factor.code} factor={factor} />
        ))}
      </View>
      <View className="flex-row items-start gap-2 rounded-control bg-surface-2 p-3">
        <Lucide color={theme.colors.muted} name="info" size={15} />
        <Text className="flex-1 font-body text-xs leading-5 text-muted">
          Estimativa meteorológica, não medição no local. Não avalia o horizonte, a poluição
          luminosa nem a posição de um objeto específico no céu.
        </Text>
      </View>
    </View>
  );
}

function FactorRow({ factor }: { factor: CurrentConditionsFactor }) {
  const config = factorConfig[factor.code];
  const color =
    factor.status === 'good'
      ? theme.colors.info
      : factor.status === 'caution'
        ? theme.colors.event
        : theme.colors.muted;

  return (
    <View className="flex-row items-start gap-3">
      <Lucide color={color} name={config.icon} size={17} />
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="font-label text-xs text-ink">{config.label}</Text>
          <Text className="font-label text-[10px]" style={{ color }}>
            {statusLabels[factor.status]}
          </Text>
        </View>
        <Text className="font-body text-xs leading-5 text-muted">{factor.summary}</Text>
      </View>
    </View>
  );
}

function chooseBestSample(samples: CurrentConditions[]): CurrentConditions | null {
  return (
    [...samples].sort((left, right) => {
      const ratingDifference = ratingOrder[right.rating] - ratingOrder[left.rating];
      if (ratingDifference !== 0) return ratingDifference;
      const cloudDifference = left.cloudCoverPercent - right.cloudCoverPercent;
      if (cloudDifference !== 0) return cloudDifference;
      const rainDifference =
        left.precipitationProbabilityPercent - right.precipitationProbabilityPercent;
      if (rainDifference !== 0) return rainDifference;
      return left.windSpeedKilometersPerHour - right.windSpeedKilometersPerHour;
    })[0] ?? null
  );
}

function localDateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return localDateKey(left) === localDateKey(right);
}

function formatDayLabel(value: Date, dayNumber: number): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(value);
  return dayNumber === 1 ? `Hoje · ${label}` : label;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(value);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}
