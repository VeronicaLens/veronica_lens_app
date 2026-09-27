import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useObservationHistory } from '../../../features/observation-history/index.ts';
import type { ObservationHistoryItem } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

type Category = 'all' | 'moon' | 'planet' | 'other';

const categoryConfig: Record<Exclude<Category, 'all'>, { icon: LucideIconName; label: string }> = {
  moon: { icon: 'moon', label: 'Lua' },
  planet: { icon: 'orbit', label: 'Planetas' },
  other: { icon: 'sparkles', label: 'Céu profundo' },
};

const planetNames = [
  'mercúrio',
  'vênus',
  'terra',
  'marte',
  'júpiter',
  'saturno',
  'urano',
  'netuno',
];

function categorize(observation: ObservationHistoryItem): Exclude<Category, 'all'> {
  const name = observation.celestialObjectName?.toLowerCase() ?? '';
  if (name.includes('lua')) return 'moon';
  if (planetNames.some((planet) => name.includes(planet))) return 'planet';
  return 'other';
}

interface ObservationHistoryPageProps {
  accessToken: string;
}

export function ObservationHistoryPage({ accessToken }: ObservationHistoryPageProps) {
  const [selectedObservation, setSelectedObservation] = useState<ObservationHistoryItem | null>(
    null,
  );
  const [category, setCategory] = useState<Category>('all');
  const { observations, loading, loadingMore, hasMore, error, refresh, loadMore } =
    useObservationHistory(accessToken);
  const filteredObservations = useMemo(
    () =>
      category === 'all'
        ? observations
        : observations.filter((observation) => categorize(observation) === category),
    [category, observations],
  );

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
        contentContainerClassName="flex-grow pb-8"
        data={filteredObservations}
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
              className="mx-5 mt-5 items-center rounded-pill border border-border bg-surface px-5 py-3 active:opacity-80"
              onPress={() => void loadMore()}
            >
              <Text className="font-label text-xs text-accent">Carregar mais</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View className="mx-5 items-center gap-3 rounded-card bg-surface p-8">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="font-body text-sm text-muted">Carregando observações...</Text>
            </View>
          ) : error ? (
            <View className="mx-5 items-center gap-3 rounded-card border border-border bg-surface p-7">
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
            <View className="mx-5 items-center gap-3 rounded-card border border-border bg-surface p-7">
              <Lucide color={theme.colors.accent} name="telescope" size={28} />
              <Text className="font-display text-lg text-ink">Nenhuma observação ainda</Text>
              <Text className="text-center font-body text-sm leading-5 text-muted">
                Suas fotos e anotações aparecerão aqui após a primeira captura.
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View className="mb-5 gap-5">
            <ImageBackground resizeMode="cover" source={backgroundImage}>
              <View className="gap-2 bg-canvas/40 px-5 pb-6 pt-6">
                <Text className="font-label text-[11px] uppercase tracking-[3px] text-accent">
                  Seu céu registrado
                </Text>
                <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
                  Histórico
                </Text>
                <Text className="font-body text-sm leading-5 text-muted">
                  Suas observações salvas, da mais recente para a mais antiga.
                </Text>
              </View>
            </ImageBackground>

            <View className="flex-row flex-wrap gap-2 px-5">
              <FilterChip
                icon="grid-2x2"
                label="Todos"
                onPress={() => setCategory('all')}
                selected={category === 'all'}
              />
              <FilterChip
                icon="moon"
                label="Lua"
                onPress={() => setCategory('moon')}
                selected={category === 'moon'}
              />
              <FilterChip
                icon="orbit"
                label="Planetas"
                onPress={() => setCategory('planet')}
                selected={category === 'planet'}
              />
              <FilterChip
                icon="sparkles"
                label="Céu profundo"
                onPress={() => setCategory('other')}
                selected={category === 'other'}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-5">
            <ObservationCard observation={item} onPress={() => setSelectedObservation(item)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function FilterChip({
  icon,
  label,
  onPress,
  selected,
}: {
  icon: LucideIconName;
  label: string;
  onPress(): void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-2 rounded-pill border px-4 py-2.5 active:opacity-80 ${
        selected ? 'border-brand bg-brand' : 'border-border bg-surface'
      }`}
      onPress={onPress}
    >
      <Lucide color={selected ? theme.colors.text : theme.colors.muted} name={icon} size={16} />
      <Text className="font-label text-xs text-ink">{label}</Text>
    </Pressable>
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
  const category = categoryConfig[categorize(observation)];

  return (
    <Pressable
      accessibilityLabel={`Abrir observação ${observation.title}`}
      accessibilityRole="button"
      className="overflow-hidden rounded-card border border-border bg-surface active:opacity-90"
      onPress={onPress}
    >
      <View>
        <Thumbnail observation={observation} />
        <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-pill bg-canvas/70 px-2.5 py-1">
          <Lucide color={theme.colors.info} name="image" size={13} />
          <Text className="font-label text-[11px] text-ink">{observation.photos.length}</Text>
        </View>
      </View>

      <View className="gap-3 p-4">
        <View className="gap-1">
          <Text className="font-label text-base text-ink">{observation.title}</Text>
          <Text className="font-body text-xs text-muted">{formatDateTime(observedAt)}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Lucide color={theme.colors.muted} name="map-pin" size={13} />
          <Text className="flex-1 font-body text-xs text-muted">{location}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <Tag icon={category.icon} label={category.label} />
            <Tag icon="camera" label="Câmera" />
          </View>
          <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
        </View>
      </View>
    </Pressable>
  );
}

function Tag({ icon, label }: { icon: LucideIconName; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1">
      <Lucide color={theme.colors.accent} name={icon} size={12} />
      <Text className="font-label text-[11px] text-ink">{label}</Text>
    </View>
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
      className="h-44 w-full bg-surface-2"
      resizeMode="cover"
      source={{ uri: thumbnailUrl }}
    />
  ) : (
    <View className="h-44 w-full items-center justify-center bg-surface-2">
      <Lucide color={theme.colors.accent} name="camera" size={28} />
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
