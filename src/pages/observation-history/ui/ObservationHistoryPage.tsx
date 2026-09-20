import { Lucide } from '@react-native-vector-icons/lucide';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useObservationHistory } from '../../../features/observation-history/index.ts';
import type { ObservationHistoryItem } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

interface ObservationHistoryPageProps {
  accessToken: string;
}

export function ObservationHistoryPage({ accessToken }: ObservationHistoryPageProps) {
  const { observations, loading, error, load } = useObservationHistory(accessToken);

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <FlatList
        contentContainerClassName="flex-grow px-5 pb-8 pt-5"
        data={observations}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(observation) => observation.id}
        ListEmptyComponent={
          loading ? (
            <View className="items-center gap-3 rounded-card bg-surface p-8">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="font-body text-sm text-muted">Carregando observações...</Text>
            </View>
          ) : error ? (
            <View className="items-center gap-3 rounded-card border border-border bg-surface p-7">
              <Lucide color={theme.colors.event} name="cloud-off" size={28} />
              <Text className="text-center font-body text-sm leading-5 text-muted">{error}</Text>
              <Pressable
                accessibilityRole="button"
                className="mt-2 rounded-pill bg-brand px-5 py-3 active:opacity-80"
                onPress={() => void load()}
              >
                <Text className="font-label text-xs text-ink">Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center gap-3 rounded-card border border-border bg-surface p-7">
              <Lucide color={theme.colors.accent} name="telescope" size={28} />
              <Text className="font-display text-lg text-ink">Nenhuma observação ainda</Text>
              <Text className="text-center font-body text-sm leading-5 text-muted">
                Suas fotos e anotações aparecerão aqui após a primeira captura.
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View className="mb-6 gap-2">
            <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
              Seu céu registrado
            </Text>
            <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
              Histórico
            </Text>
            <Text className="font-body text-sm leading-5 text-muted">
              Observações salvas nesta conta, da mais recente para a mais antiga.
            </Text>
          </View>
        }
        renderItem={({ item }) => <ObservationCard observation={item} />}
      />
    </SafeAreaView>
  );
}

function ObservationCard({ observation }: { observation: ObservationHistoryItem }) {
  const observedAt = new Date(observation.observedAt);
  const location =
    observation.latitude === null || observation.longitude === null
      ? 'Localização não registrada'
      : `${observation.latitude.toFixed(4)}, ${observation.longitude.toFixed(4)}`;

  return (
    <View className="gap-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
          <Lucide color={theme.colors.accent} name="camera" size={18} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-label text-sm text-ink">{observation.title}</Text>
          <Text className="font-body text-xs text-muted">
            {formatDateTime(observedAt)}
            {observation.celestialObjectName ? ` · ${observation.celestialObjectName}` : ''}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Lucide color={theme.colors.info} name="image" size={14} />
          <Text className="font-label text-[11px] text-info">{observation.photos.length}</Text>
        </View>
      </View>
      {observation.notes ? (
        <Text className="font-body text-sm leading-5 text-muted">{observation.notes}</Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <Lucide color={theme.colors.muted} name="map-pin" size={14} />
        <Text className="flex-1 font-body text-xs text-muted">{location}</Text>
      </View>
    </View>
  );
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
