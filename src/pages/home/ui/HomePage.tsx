import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUpcomingEvents } from '../../../features/astronomical-events/index.ts';
import { useDeviceLocation } from '../../../features/device-location/index.ts';
import type { UpcomingAstronomicalEvent } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

const EVENT_PREVIEW_PERIOD_DAYS = 14;
const EVENT_PREVIEW_COUNT = 3;

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
  onOpenEvents(): void;
  onOpenHistory(): void;
}

export function HomePage({
  accessToken,
  displayName,
  email,
  onOpenCamera,
  onOpenEvents,
  onOpenHistory,
}: HomePageProps) {
  const location = useDeviceLocation();
  const events = useUpcomingEvents(accessToken, location.location, EVENT_PREVIEW_PERIOD_DAYS);
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
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                Próximos eventos
              </Text>
              <Pressable accessibilityRole="button" onPress={onOpenEvents}>
                <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
              </Pressable>
            </View>

            {upcomingEvents.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {upcomingEvents.map((event) => (
                    <EventPreviewCard key={event.id} event={event} onPress={onOpenEvents} />
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
