import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useObservationRecommendation } from '../../../features/observation-planning/index.ts';
import type { DeviceLocation } from '../../../features/device-location/index.ts';
import type {
  ObservationRecommendation,
  UpcomingAstronomicalEvent,
  UpcomingEventsMeta,
} from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

interface EventDetailPageProps {
  accessToken: string;
  event: UpcomingAstronomicalEvent;
  location: DeviceLocation | null;
  meta: UpcomingEventsMeta | null;
  onBack(): void;
}

export function EventDetailPage({
  accessToken,
  event,
  location,
  meta,
  onBack,
}: EventDetailPageProps) {
  const planning = useObservationRecommendation(
    accessToken,
    event.objectIds.at(0) ?? null,
    location,
    event.startsAt,
  );
  const config = eventTypeConfig(event.type);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-28 pt-5">
        <Pressable
          accessibilityLabel="Voltar para eventos"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
          onPress={onBack}
        >
          <Lucide color={theme.colors.text} name="chevron-left" size={20} />
        </Pressable>

        <View className="gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-2">
            <Lucide color={config.color} name={config.icon} size={26} />
          </View>
          <Text
            className="font-label text-[11px] uppercase tracking-[2px]"
            style={{ color: config.color }}
          >
            {config.label}
          </Text>
          <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
            {event.title}
          </Text>
          <Text className="font-label text-sm text-accent">{formatEventDate(event.startsAt)}</Text>
          <Text className="font-body text-sm leading-6 text-muted">{event.description}</Text>
        </View>

        <DetailCard icon="eye" title="Visibilidade">
          {!location ? (
            <Text className="font-body text-xs leading-5 text-muted">
              Dados de visibilidade indisponíveis sem a localização do observador.
            </Text>
          ) : planning.loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color={theme.colors.accent} size="small" />
              <Text className="font-body text-xs text-muted">Calculando condições...</Text>
            </View>
          ) : planning.error ? (
            <View className="gap-2">
              <Text className="font-body text-xs leading-5 text-muted">{planning.error}</Text>
              <Pressable accessibilityRole="button" onPress={planning.refresh}>
                <Text className="font-label text-xs text-accent">Tentar novamente</Text>
              </Pressable>
            </View>
          ) : planning.recommendation ? (
            <VisibilityDetails recommendation={planning.recommendation} />
          ) : (
            <Text className="font-body text-xs leading-5 text-muted">
              Nenhum dado complementar de visibilidade disponível.
            </Text>
          )}
        </DetailCard>

        <DetailCard icon="database" title="Origem do dado">
          {meta ? (
            <View className="gap-1">
              <Text className="font-body text-xs text-ink">
                {meta.source === 'provider' ? 'Provedor astronômico' : 'Cache da VeronicaLens'}
              </Text>
              <Text className="font-body text-[11px] text-muted">
                Atualizado em {formatEventDate(meta.updatedAt)}
              </Text>
              {meta.stale ? (
                <Text className="font-body text-[11px] text-event">
                  Última versão salva; atualização do provedor indisponível.
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="font-body text-xs text-muted">
              Origem e atualização indisponíveis.
            </Text>
          )}
        </DetailCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function VisibilityDetails({ recommendation }: { recommendation: ObservationRecommendation }) {
  const window = recommendation.recommendedWindow;
  return (
    <View className="gap-2">
      <Text className="font-label text-xs text-ink">
        {recommendation.status === 'recommended' && window
          ? `Janela favorável: ${formatTime(window.from)}–${formatTime(window.to)}`
          : recommendation.status === 'insufficient_data'
            ? 'Dados insuficientes'
            : 'Sem janela favorável'}
      </Text>
      <Text className="font-body text-xs leading-5 text-muted">{recommendation.summary}</Text>
      {!recommendation.meta.weatherAvailable ? (
        <Text className="font-body text-[11px] text-event">Previsão climática indisponível.</Text>
      ) : null}
    </View>
  );
}

function DetailCard({
  icon,
  title,
  children,
}: {
  icon: LucideIconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <Lucide color={theme.colors.accent} name={icon} size={17} />
        <Text className="font-label text-sm text-ink">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function eventTypeConfig(type: UpcomingAstronomicalEvent['type']): {
  icon: LucideIconName;
  label: string;
  color: string;
} {
  return {
    rise: { icon: 'sunrise', label: 'Nascer', color: theme.colors.info },
    transit: { icon: 'move-up', label: 'Trânsito', color: theme.colors.accent },
    set: { icon: 'sunset', label: 'Ocaso', color: theme.colors.event },
  }[type] as { icon: LucideIconName; label: string; color: string };
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}
