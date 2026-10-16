import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useObservationRecommendation } from '../../../features/observation-planning/index.ts';
import type { DeviceLocation } from '../../../features/device-location/index.ts';
import type {
  ObservationRecommendation,
  UpcomingAstronomicalEvent,
  UpcomingEventsMeta,
  VisibilityFactor,
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
  const recommendation = planning.recommendation;
  const window = recommendation?.status === 'recommended' ? recommendation.recommendedWindow : null;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-28 pt-5">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Voltar para eventos"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={onBack}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={20} />
          </Pressable>
          <Text className="font-label text-[10px] uppercase tracking-[2px] text-muted">
            Evento astronômico
          </Text>
        </View>

        <View className="gap-4 rounded-card border border-border bg-surface p-5">
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full border bg-surface-2"
              style={{ borderColor: config.color }}
            >
              <Lucide color={config.color} name={config.icon} size={22} />
            </View>
            <View className="flex-1 gap-1">
              <Text
                className="font-label text-[10px] uppercase tracking-[2px]"
                style={{ color: config.color }}
              >
                {config.label}
              </Text>
              <Text className="font-body text-xs text-muted">Acompanhe o melhor momento</Text>
            </View>
          </View>
          <Text accessibilityRole="header" className="font-display text-[30px] leading-9 text-ink">
            {event.title}
          </Text>
          <Text className="font-body text-sm leading-6 text-muted">{event.description}</Text>
          <View className="flex-row items-center gap-2 border-t border-border pt-3">
            <Lucide color={theme.colors.accent} name="calendar-clock" size={16} />
            <Text className="font-label text-xs text-ink">{formatEventDate(event.startsAt)}</Text>
          </View>
        </View>

        <View className="gap-4 rounded-card border border-primary/40 bg-elevated p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
              <Lucide color={theme.colors.accent} name="telescope" size={19} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-label text-[10px] uppercase tracking-[2px] text-accent">
                Planejamento de observação
              </Text>
              <Text className="font-display text-lg text-ink">Seu melhor momento</Text>
            </View>
            <View className="rounded-pill border border-border bg-surface px-2.5 py-1">
              <Text className="font-label text-[9px] text-muted">24 HORAS</Text>
            </View>
          </View>
          {window ? (
            <View className="flex-row items-center gap-3 rounded-control border border-primary/30 bg-surface px-4 py-3">
              <Lucide color={theme.colors.accent} name="clock-3" size={19} />
              <View className="flex-1 gap-1">
                <Text className="font-body text-[10px] uppercase tracking-[1px] text-muted">
                  Janela recomendada
                </Text>
                <Text className="font-display text-2xl text-ink">
                  {formatTime(window.from)} – {formatTime(window.to)}
                </Text>
              </View>
            </View>
          ) : null}
          {!location ? (
            <PlanningMessage icon="map-pin-off">
              Ative a localização para calcular um plano personalizado para o seu céu.
            </PlanningMessage>
          ) : planning.loading ? (
            <View className="flex-row items-center gap-3 rounded-control bg-surface px-3 py-3">
              <ActivityIndicator color={theme.colors.accent} size="small" />
              <View className="flex-1 gap-1">
                <Text className="font-label text-xs text-ink">Analisando o céu</Text>
                <Text className="font-body text-[11px] text-muted">
                  Verificando posição do astro e previsão do tempo.
                </Text>
              </View>
            </View>
          ) : planning.error ? (
            <View className="flex-row items-center gap-3 rounded-control bg-surface px-3 py-3">
              <Lucide color={theme.colors.event} name="cloud-alert" size={18} />
              <Text className="flex-1 font-body text-xs leading-5 text-muted">
                {planning.error}
              </Text>
              <Pressable accessibilityRole="button" onPress={planning.refresh}>
                <Text className="font-label text-xs text-accent">Tentar</Text>
              </Pressable>
            </View>
          ) : recommendation ? (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Lucide
                  color={
                    recommendation.status === 'recommended' ? theme.colors.info : theme.colors.event
                  }
                  name={recommendation.status === 'recommended' ? 'circle-check' : 'circle-alert'}
                  size={16}
                />
                <Text className="flex-1 font-label text-xs text-ink">
                  {recommendation.status === 'recommended'
                    ? 'Condições avaliadas'
                    : recommendation.status === 'insufficient_data'
                      ? 'Análise incompleta'
                      : 'Nenhuma janela favorável'}
                </Text>
              </View>
              <Text className="font-body text-xs leading-5 text-muted">
                {recommendation.summary}
              </Text>
            </View>
          ) : (
            <PlanningMessage icon="orbit">
              Selecione um objeto com dados de posição para encontrar uma janela favorável.
            </PlanningMessage>
          )}
        </View>

        {recommendation ? (
          <DetailCard icon="scan-eye" title="Fatores considerados">
            <VisibilityDetails recommendation={recommendation} />
          </DetailCard>
        ) : null}

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
  const altitude = findFactor(recommendation.factors, 'altitude');
  const weather = findFactor(recommendation.factors, 'weather');
  const altitudeValue = altitude?.metrics?.altitudeDegrees ?? null;
  const minimumValue = altitude?.metrics?.minimumAltitudeDegrees ?? null;
  const cloudValue = weather?.metrics?.cloudCoverPercent ?? null;
  const precipitationValue = weather?.metrics?.precipitationProbabilityPercent ?? null;
  const visibilityValue = weather?.metrics?.visibilityMeters ?? null;

  return (
    <View className="gap-3">
      {altitudeValue !== null || cloudValue !== null ? (
        <View className="overflow-hidden rounded-control bg-surface-2">
          {altitudeValue !== null ? (
            <StatRow
              left={{ icon: 'triangle', label: 'Altitude', value: `${altitudeValue}°` }}
              right={
                minimumValue !== null
                  ? { icon: 'settings', label: 'Mínimo configurado', value: `${minimumValue}°` }
                  : undefined
              }
            />
          ) : null}
          {altitudeValue !== null && cloudValue !== null ? (
            <View className="h-px bg-border" />
          ) : null}
          {cloudValue !== null ? (
            <StatRow
              left={{ icon: 'cloud', label: 'Nuvens', value: `${cloudValue}%` }}
              right={
                precipitationValue !== null
                  ? {
                      icon: 'cloud-rain',
                      label: 'Probabilidade de precipitação',
                      value: `${precipitationValue}%`,
                    }
                  : undefined
              }
            />
          ) : null}
          {visibilityValue !== null ? (
            <>
              <View className="h-px bg-border" />
              <StatRow
                left={{ icon: 'eye', label: 'Visibilidade', value: `${visibilityValue} m` }}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {!recommendation.meta.weatherAvailable ? (
        <Text className="font-body text-[11px] text-event">Previsão climática indisponível.</Text>
      ) : null}
    </View>
  );
}

function PlanningMessage({ icon, children }: { icon: LucideIconName; children: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-control bg-surface px-3 py-3">
      <Lucide color={theme.colors.muted} name={icon} size={18} />
      <Text className="flex-1 font-body text-xs leading-5 text-muted">{children}</Text>
    </View>
  );
}

interface StatItem {
  icon: LucideIconName;
  label: string;
  value: string;
}

function StatRow({ left, right }: { left: StatItem; right?: StatItem | undefined }) {
  return (
    <View className="flex-row">
      <Stat item={left} />
      {right ? (
        <>
          <View className="w-px bg-border" />
          <Stat item={right} />
        </>
      ) : null}
    </View>
  );
}

function Stat({ item }: { item: StatItem }) {
  return (
    <View className="flex-1 flex-row items-center gap-2.5 px-3 py-3">
      <Lucide color={theme.colors.accent} name={item.icon} size={17} />
      <View className="flex-1">
        <Text className="font-body text-[10px] leading-3 text-muted" numberOfLines={2}>
          {item.label}
        </Text>
        <Text className="font-label text-sm text-ink">{item.value}</Text>
      </View>
    </View>
  );
}

function findFactor(
  factors: VisibilityFactor[],
  code: VisibilityFactor['code'],
): VisibilityFactor | undefined {
  return factors.find((factor) => factor.code === code);
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
