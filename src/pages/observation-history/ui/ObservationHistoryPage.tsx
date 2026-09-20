import { Lucide } from '@react-native-vector-icons/lucide';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useObservationHistory } from '../../../features/observation-history/index.ts';
import type { ObservationHistoryItem } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

interface ObservationHistoryPageProps {
  accessToken: string;
}

export function ObservationHistoryPage({ accessToken }: ObservationHistoryPageProps) {
  const [selectedObservation, setSelectedObservation] = useState<ObservationHistoryItem | null>(
    null,
  );
  const { observations, loading, loadingMore, hasMore, error, refresh, loadMore } =
    useObservationHistory(accessToken);

  if (selectedObservation) {
    return (
      <ObservationDetail
        observation={selectedObservation}
        onBack={() => setSelectedObservation(null)}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <FlatList
        contentContainerClassName="flex-grow px-5 pb-8 pt-5"
        data={observations}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(observation) => observation.id}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-6">
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : hasMore ? (
            <Pressable
              accessibilityRole="button"
              className="mt-5 items-center rounded-pill border border-border bg-surface px-5 py-3 active:opacity-80"
              onPress={() => void loadMore()}
            >
              <Text className="font-label text-xs text-accent">Carregar mais</Text>
            </Pressable>
          ) : null
        }
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
                onPress={() => void refresh()}
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
        renderItem={({ item }) => (
          <ObservationCard observation={item} onPress={() => setSelectedObservation(item)} />
        )}
      />
    </SafeAreaView>
  );
}

function ObservationCard({
  observation,
  onPress,
}: {
  observation: ObservationHistoryItem;
  onPress(): void;
}) {
  const observedAt = new Date(observation.observedAt);
  const location =
    observation.latitude === null || observation.longitude === null
      ? 'Localização não registrada'
      : `${observation.latitude.toFixed(4)}, ${observation.longitude.toFixed(4)}`;

  return (
    <Pressable
      accessibilityLabel={`Abrir observação ${observation.title}`}
      accessibilityRole="button"
      className="flex-row gap-3 rounded-card border border-border bg-surface p-3 active:opacity-80"
      onPress={onPress}
    >
      <Thumbnail observation={observation} />
      <View className="flex-1 gap-3 py-1">
        <View className="flex-row items-start gap-3">
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
    </Pressable>
  );
}

function ObservationDetail({
  observation,
  onBack,
}: {
  observation: ObservationHistoryItem;
  onBack(): void;
}) {
  const location =
    observation.latitude === null || observation.longitude === null
      ? 'Localização não registrada'
      : `${observation.latitude.toFixed(4)}, ${observation.longitude.toFixed(4)}`;

  return (
    <SafeAreaView className="flex-1 bg-canvas px-5 pt-5">
      <View className="mb-5 flex-row items-center gap-3">
        <Pressable
          accessibilityLabel="Voltar ao histórico"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={onBack}
        >
          <Lucide color={theme.colors.text} name="arrow-left" size={19} />
        </Pressable>
        <Text accessibilityRole="header" className="flex-1 font-display text-xl text-ink">
          Observação
        </Text>
      </View>
      <FlatList
        contentContainerClassName="gap-5 pb-8"
        data={observation.photos}
        keyExtractor={(photo) => photo.id}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="gap-1">
              <Text className="font-display text-2xl text-ink">{observation.title}</Text>
              <Text className="font-body text-sm text-muted">
                {formatDateTime(new Date(observation.observedAt))}
              </Text>
            </View>
            {observation.notes ? (
              <Text className="font-body text-sm leading-6 text-muted">{observation.notes}</Text>
            ) : null}
            <View className="flex-row items-center gap-2 rounded-control bg-surface px-4 py-3">
              <Lucide color={theme.colors.muted} name="map-pin" size={16} />
              <Text className="flex-1 font-body text-xs text-muted">{location}</Text>
            </View>
            <Text className="font-label text-base text-ink">Astrofotos</Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="font-body text-sm text-muted">Esta observação não possui mídia.</Text>
        }
        renderItem={({ item }) =>
          item.thumbnailUrl ? (
            <Image
              accessibilityLabel={`Astrofoto de ${observation.title}`}
              className="h-72 w-full rounded-card bg-surface-2"
              resizeMode="cover"
              source={{ uri: item.thumbnailUrl }}
            />
          ) : (
            <View className="h-32 items-center justify-center rounded-card bg-surface-2">
              <Lucide color={theme.colors.muted} name="image-off" size={24} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function Thumbnail({ observation }: { observation: ObservationHistoryItem }) {
  const thumbnailUrl = observation.photos[0]?.thumbnailUrl;
  return thumbnailUrl ? (
    <Image
      accessibilityLabel={`Miniatura de ${observation.title}`}
      className="h-24 w-20 rounded-control bg-surface-2"
      resizeMode="cover"
      source={{ uri: thumbnailUrl }}
    />
  ) : (
    <View className="h-24 w-20 items-center justify-center rounded-control bg-surface-2">
      <Lucide color={theme.colors.accent} name="camera" size={20} />
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
