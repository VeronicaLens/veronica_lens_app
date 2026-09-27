import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUpcomingEvents } from '../../../features/astronomical-events/index.ts';
import { useDeviceLocation } from '../../../features/device-location/index.ts';
import type {
  UpcomingAstronomicalEvent,
  UpcomingAstronomicalEventType,
} from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { EventDetailPage } from './EventDetailPage.tsx';

interface EventsPageProps {
  accessToken: string;
  initialEventId?: string | null;
  onInitialEventHandled?(): void;
}

const types: { value?: UpcomingAstronomicalEventType; label: string }[] = [
  { label: 'Todos' },
  { value: 'rise', label: 'Nascer' },
  { value: 'transit', label: 'Trânsito' },
  { value: 'set', label: 'Ocaso' },
];

const periods = [7, 14, 30] as const;

export function EventsPage({
  accessToken,
  initialEventId,
  onInitialEventHandled,
}: EventsPageProps) {
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [type, setType] = useState<UpcomingAstronomicalEventType | undefined>();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const location = useDeviceLocation();
  const effectivePeriodDays = initialEventId ? 30 : periodDays;
  const events = useUpcomingEvents(accessToken, location.location, effectivePeriodDays, type);
  const canShowEvents =
    location.status === 'active' && !events.loading && !events.error && events.events.length > 0;
  const activeEventId = initialEventId ?? selectedEventId;
  const activeEvent = events.events.find((event) => event.id === activeEventId) ?? null;

  if (activeEvent) {
    return (
      <EventDetailPage
        accessToken={accessToken}
        event={activeEvent}
        location={location.location}
        meta={events.meta}
        onBack={() => {
          setSelectedEventId(null);
          onInitialEventHandled?.();
        }}
      />
    );
  }

  if (
    initialEventId &&
    location.status === 'active' &&
    !events.loading &&
    !events.error &&
    !activeEvent
  ) {
    return (
      <SafeAreaView className="flex-1 bg-canvas px-5 pt-5" edges={['top', 'left', 'right']}>
        <EmptyState
          icon="calendar-x"
          title="Evento não encontrado"
          message="Este evento não está mais disponível na agenda atual."
          action="Voltar para eventos"
          onPress={() => onInitialEventHandled?.()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <FlatList
        contentContainerClassName="px-5 pb-8 pt-5"
        data={canShowEvents ? events.events : []}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(event) => event.id}
        ListHeaderComponent={
          <View className="gap-6">
            <View className="gap-2">
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                Planeje sua observação
              </Text>
              <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
                Eventos astronômicos
              </Text>
              <Text className="font-body text-sm leading-5 text-muted">
                Nascer, trânsito e ocaso da Lua e dos planetas para a sua localização.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="font-label text-xs text-ink">Período</Text>
              <View accessibilityRole="radiogroup" className="flex-row gap-2">
                {periods.map((days) => (
                  <FilterChip
                    key={days}
                    label={`${days} dias`}
                    selected={periodDays === days}
                    onPress={() => setPeriodDays(days)}
                  />
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {types.map((option) => (
                    <FilterChip
                      key={option.label}
                      label={option.label}
                      selected={type === option.value}
                      onPress={() => setType(option.value)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {events.meta?.stale ? (
              <Notice
                icon="cloud-off"
                message="Exibindo a última previsão salva enquanto o provedor se recupera."
              />
            ) : null}

            {location.fallbackMessage ? (
              <EmptyState
                icon="map-pin-off"
                title="Localização necessária"
                message={location.fallbackMessage}
                action="Tentar novamente"
                onPress={location.retry}
              />
            ) : location.status !== 'active' || events.loading ? (
              <View className="items-center gap-3 rounded-card bg-surface p-8">
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="font-body text-sm text-muted">
                  {location.status === 'active'
                    ? 'Calculando próximos eventos...'
                    : 'Obtendo localização...'}
                </Text>
              </View>
            ) : events.error ? (
              <EmptyState
                icon="cloud-off"
                title="Eventos indisponíveis"
                message={events.error}
                action="Tentar novamente"
                onPress={events.refresh}
              />
            ) : events.events.length === 0 ? (
              <EmptyState
                icon="calendar-search"
                title="Nenhum evento encontrado"
                message="Ajuste o período ou o tipo para ampliar sua busca."
              />
            ) : (
              <View className="flex-row items-center justify-between">
                <Text className="font-label text-base text-ink">Próximos eventos</Text>
                <Text className="font-body text-xs text-muted">
                  {events.events.length} resultados
                </Text>
              </View>
            )}
          </View>
        }
        ListHeaderComponentStyle={{ marginBottom: canShowEvents ? 12 : 0 }}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => setSelectedEventId(item.id)} />
        )}
      />
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`min-w-[84px] items-center rounded-pill border px-4 py-2.5 ${selected ? 'border-brand bg-brand' : 'border-border bg-surface'}`}
      onPress={onPress}
    >
      <Text className="font-label text-[11px] text-ink">{label}</Text>
    </Pressable>
  );
}

function EventCard({ event, onPress }: { event: UpcomingAstronomicalEvent; onPress(): void }) {
  const config = {
    rise: { icon: 'sunrise', label: 'Nascer', color: theme.colors.info },
    transit: { icon: 'move-up', label: 'Trânsito', color: theme.colors.accent },
    set: { icon: 'sunset', label: 'Ocaso', color: theme.colors.event },
  }[event.type] as { icon: LucideIconName; label: string; color: string };
  const date = new Date(event.startsAt);
  return (
    <Pressable
      accessibilityLabel={`Abrir detalhes de ${event.title}`}
      accessibilityRole="button"
      className="flex-row gap-4 rounded-card border border-border bg-surface p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
        <Lucide color={config.color} name={config.icon} size={20} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-label text-sm text-ink">{event.title}</Text>
        <Text
          className="font-label text-[10px] uppercase tracking-wide"
          style={{ color: config.color }}
        >
          {config.label} · {formatDate(date)} às {formatTime(date)}
        </Text>
        <Text className="font-body text-xs leading-5 text-muted">{event.description}</Text>
      </View>
      <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
    </Pressable>
  );
}

function Notice({ icon, message }: { icon: LucideIconName; message: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-control border border-border bg-surface px-4 py-3">
      <Lucide color={theme.colors.info} name={icon} size={18} />
      <Text className="flex-1 font-body text-xs leading-5 text-muted">{message}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  message,
  action,
  onPress,
}: {
  icon: LucideIconName;
  title: string;
  message: string;
  action?: string;
  onPress?(): void;
}) {
  return (
    <View className="items-center gap-3 rounded-card border border-border bg-surface p-7">
      <Lucide color={theme.colors.accent} name={icon} size={28} />
      <Text className="font-display text-lg text-ink">{title}</Text>
      <Text className="text-center font-body text-sm leading-5 text-muted">{message}</Text>
      {action && onPress ? (
        <Pressable
          className="mt-2 rounded-pill bg-brand px-5 py-3 active:opacity-80"
          onPress={onPress}
        >
          <Text className="font-label text-xs text-ink">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(value);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}
