import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUpcomingEvents } from '../../../features/astronomical-events/index.ts';
import { useCurrentConditions } from '../../../features/current-conditions/index.ts';
import { useDeviceLocation, type DeviceLocation } from '../../../features/device-location/index.ts';
import type { ObservationRating, UpcomingAstronomicalEvent } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

const EVENT_PREVIEW_PERIOD_DAYS = 14;
const EVENT_PREVIEW_COUNT = 3;

const ratingConfig: Record<ObservationRating, { label: string; color: string }> = {
  good: { label: 'Boas condições', color: theme.colors.info },
  fair: { label: 'Condições regulares', color: theme.colors.event },
  poor: { label: 'Condições desfavoráveis', color: theme.colors.muted },
};

const eventTypeConfig: Record<
  UpcomingAstronomicalEvent['type'],
  { icon: LucideIconName; label: string; color: string }
> = {
  rise: { icon: 'sunrise', label: 'Nascer', color: theme.colors.info },
  transit: { icon: 'move-up', label: 'Trânsito', color: theme.colors.accent },
  set: { icon: 'sunset', label: 'Ocaso', color: theme.colors.event },
};

interface HomePageProps {
  accessToken: string;
  displayName: string | null;
  email: string;
  onOpenCamera(): void;
  onOpenEvent(eventId: string): void;
  onOpenEvents(): void;
  onOpenHistory(): void;
  onOpenConditionSimulation(location: DeviceLocation | null): void;
}

export function HomePage({
  accessToken,
  displayName,
  email,
  onOpenCamera,
  onOpenEvent,
  onOpenEvents,
  onOpenHistory,
  onOpenConditionSimulation,
}: HomePageProps) {
  const location = useDeviceLocation();
  const events = useUpcomingEvents(accessToken, location.location, EVENT_PREVIEW_PERIOD_DAYS);
  const conditions = useCurrentConditions(accessToken, location.location);
  const upcomingEvents = events.events.slice(0, EVENT_PREVIEW_COUNT);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <ImageBackground resizeMode="cover" source={backgroundImage}>
          <View className="gap-2 bg-canvas/40 px-6 pb-8 pt-6">
            <Text className="font-label text-[11px] uppercase tracking-[3px] text-accent">
              VeronicaLens
            </Text>
            <Text
              accessibilityRole="header"
              className="font-display text-[34px] leading-10 text-ink"
            >
              Descubra{'\n'}
              <Text className="text-accent">o céu.</Text>
            </Text>
            <View className="pt-3">
              <Text className="font-label text-base text-ink">Olá, {displayName ?? email}.</Text>
              <Text className="font-body text-sm leading-5 text-muted">
                O universo está te esperando hoje.
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View className="gap-8 px-6 pt-8">
          <View className="gap-4 rounded-card border border-border bg-surface p-5">
            <Pressable
              accessibilityLabel="Ver previsão das condições de observação para os próximos 7 dias"
              accessibilityRole="button"
              className="flex-row items-center justify-between active:opacity-80"
              onPress={() => onOpenConditionSimulation(location.location)}
            >
              <View className="flex-row items-center gap-2">
                <Lucide color={theme.colors.accent} name="sparkles" size={16} />
                <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                  Condições de observação
                </Text>
              </View>
              <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
            </Pressable>

            {conditions.conditions ? (
              <>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ratingConfig[conditions.conditions.rating].color }}
                  />
                  <Text className="font-label text-base text-ink">
                    {ratingConfig[conditions.conditions.rating].label}
                  </Text>
                </View>
                <View className="flex-row">
                  <ConditionStat
                    icon="thermometer"
                    label="Temperatura"
                    value={`${Math.round(conditions.conditions.temperatureCelsius)}°`}
                  />
                  <ConditionStat
                    icon="cloud-sun"
                    label="Céu"
                    value={conditions.conditions.skyLabel}
                  />
                  <ConditionStat
                    icon="cloud-rain"
                    label="Chance de chuva"
                    value={`${Math.round(conditions.conditions.precipitationProbabilityPercent)}%`}
                  />
                  <ConditionStat
                    icon="eye"
                    label="Visibilidade"
                    value={conditions.conditions.visibilityLabel}
                  />
                </View>
                <Text className="text-center font-body text-[10px] text-muted">
                  Previsão horária para {formatTime(new Date(conditions.conditions.observedAt))}
                </Text>
              </>
            ) : conditions.loading ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  Calculando condições de observação...
                </Text>
              </View>
            ) : conditions.error ? (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3"
                onPress={conditions.refresh}
              >
                <Lucide color={theme.colors.event} name="cloud-off" size={18} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  {conditions.error}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3"
                onPress={location.retry}
              >
                <Lucide color={theme.colors.muted} name="map-pin-off" size={18} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  {location.fallbackMessage ?? 'Obtendo sua localização para consultar o clima.'}
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 rounded-pill border border-border bg-surface-2 px-4 py-3 active:opacity-80"
              onPress={() => onOpenConditionSimulation(location.location)}
            >
              <Lucide color={theme.colors.accent} name="calendar-clock" size={16} />
              <Text className="font-label text-xs text-accent">Simular outro dia e horário</Text>
            </Pressable>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                Próximos eventos
              </Text>
              <Pressable accessibilityRole="button" onPress={onOpenEvents}>
                <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
              </Pressable>
            </View>

            {location.fallbackMessage ? (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-5 active:opacity-80"
                onPress={location.retry}
              >
                <Lucide color={theme.colors.muted} name="map-pin-off" size={20} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  {location.fallbackMessage}
                </Text>
              </Pressable>
            ) : location.status !== 'active' || events.loading ? (
              <View className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-5">
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  {location.status === 'active'
                    ? 'Calculando próximos eventos...'
                    : 'Obtendo sua localização...'}
                </Text>
              </View>
            ) : events.error ? (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-5 active:opacity-80"
                onPress={events.refresh}
              >
                <Lucide color={theme.colors.event} name="cloud-off" size={20} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  {events.error}
                </Text>
              </Pressable>
            ) : upcomingEvents.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {upcomingEvents.map((event) => (
                    <EventPreviewCard
                      key={event.id}
                      event={event}
                      onPress={() => onOpenEvent(event.id)}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="rounded-card border border-border bg-surface p-5 active:opacity-75"
                onPress={onOpenEvents}
              >
                <Text className="font-body text-sm leading-5 text-muted">
                  Veja quando a Lua e os planetas estarão visíveis no seu céu.
                </Text>
              </Pressable>
            )}
          </View>

          <View className="gap-3">
            <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
              Acesso rápido
            </Text>
            <View className="flex-row gap-3">
              <QuickAccessCard
                description="Registre o céu ao seu redor."
                icon="camera"
                label="Câmera"
                onPress={onOpenCamera}
              />
              <QuickAccessCard
                description="Veja quando a Lua e os planetas estarão no céu."
                icon="calendar-days"
                label="Eventos"
                onPress={onOpenEvents}
              />
              <QuickAccessCard
                description="Reveja suas capturas anteriores."
                icon="clock-3"
                label="Histórico"
                onPress={onOpenHistory}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConditionStat({
  icon,
  label,
  value,
}: {
  icon: LucideIconName;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 items-center gap-1.5">
      <Lucide color={theme.colors.info} name={icon} size={18} />
      {value ? <Text className="font-display text-base text-ink">{value}</Text> : null}
      <Text className="text-center font-body text-[10px] leading-3 text-muted" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function EventPreviewCard({
  event,
  onPress,
}: {
  event: UpcomingAstronomicalEvent;
  onPress(): void;
}) {
  const config = eventTypeConfig[event.type];
  const date = new Date(event.startsAt);

  return (
    <Pressable
      accessibilityLabel={`Abrir detalhes de ${event.title}`}
      accessibilityRole="button"
      className="w-40 gap-3 rounded-card border border-border bg-surface p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
        <Lucide color={config.color} name={config.icon} size={20} />
      </View>
      <View className="gap-1">
        <Text className="font-label text-sm text-ink" numberOfLines={1}>
          {event.title}
        </Text>
        <Text className="font-body text-xs text-muted">{formatDate(date)}</Text>
      </View>
    </Pressable>
  );
}

function QuickAccessCard({
  description,
  icon,
  label,
  onPress,
}: {
  description: string;
  icon: LucideIconName;
  label: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="flex-1 gap-3 rounded-card border border-border bg-surface p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
        <Lucide color={theme.colors.accent} name={icon} size={18} />
      </View>
      <View className="gap-1">
        <Text className="font-label text-xs text-ink">{label}</Text>
        <Text className="font-body text-[11px] leading-4 text-muted" numberOfLines={2}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(value);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}
