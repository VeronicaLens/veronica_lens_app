import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildPhotoGallery,
  useObservationHistory,
  type GalleryGrouping,
  type GalleryPhoto,
  type ObservationCategory,
} from '../../../features/observation-history/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { PhotoViewer } from './PhotoViewer.tsx';

const GRID_COLUMNS = 3;
const GRID_GAP = 2;

type Category = ObservationCategory | 'all';
type GalleryRow =
  | { type: 'header'; key: string; title: string; count: number }
  | { type: 'row'; key: string; photos: GalleryPhoto[] };

const groupingOptions: { id: GalleryGrouping; label: string }[] = [
  { id: 'day', label: 'Dias' },
  { id: 'month', label: 'Meses' },
  { id: 'year', label: 'Anos' },
];

const categoryOptions: { id: Category; label: string; icon: LucideIconName }[] = [
  { id: 'all', label: 'Todas', icon: 'images' },
  { id: 'moon', label: 'Lua', icon: 'moon' },
  { id: 'planet', label: 'Planetas', icon: 'orbit' },
  { id: 'other', label: 'Céu profundo', icon: 'sparkles' },
];

interface ObservationHistoryPageProps {
  accessToken: string;
}

export function ObservationHistoryPage({ accessToken }: ObservationHistoryPageProps) {
  const { width } = useWindowDimensions();
  const [grouping, setGrouping] = useState<GalleryGrouping>('day');
  const [category, setCategory] = useState<Category>('all');
  const [viewerPhotoId, setViewerPhotoId] = useState<string | null>(null);
  const { observations, loading, loadingMore, hasMore, error, refresh, loadMore } =
    useObservationHistory(accessToken);

  const gallery = useMemo(
    () => buildPhotoGallery(observations, { grouping, category }),
    [category, grouping, observations],
  );
  const rows = useMemo(() => toRows(gallery.sections), [gallery.sections]);
  // FlatList counts ListHeaderComponent as index 0, so section headers start at index 1.
  const stickyHeaderIndices = useMemo(
    () => rows.flatMap((row, index) => (row.type === 'header' ? [index + 1] : [])),
    [rows],
  );
  const tileSize = Math.floor((width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
  const viewerIndex = viewerPhotoId
    ? gallery.photos.findIndex((photo) => photo.id === viewerPhotoId)
    : -1;
  const openPhoto = useCallback((photoId: string) => setViewerPhotoId(photoId), []);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <FlatList
        contentContainerClassName="flex-grow pb-8"
        data={rows}
        initialNumToRender={12}
        keyExtractor={(row) => row.key}
        maxToRenderPerBatch={8}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.6}
        onRefresh={() => void refresh()}
        refreshing={loading && observations.length > 0}
        removeClippedSubviews={Platform.OS === 'android'}
        stickyHeaderIndices={stickyHeaderIndices}
        windowSize={7}
        ListHeaderComponent={
          <View className="gap-4 px-4 pb-3 pt-4">
            <View className="flex-row items-end justify-between">
              <View className="gap-0.5">
                <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
                  Galeria
                </Text>
                <Text className="font-body text-xs text-muted">
                  {gallery.photos.length === 1 ? '1 foto' : `${gallery.photos.length} fotos`}
                </Text>
              </View>
              <View className="flex-row rounded-pill bg-surface p-1">
                {groupingOptions.map((option) => {
                  const selected = grouping === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      accessibilityLabel={`Agrupar por ${option.label.toLocaleLowerCase('pt-BR')}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      className="rounded-pill px-3 py-1.5 active:opacity-75"
                      onPress={() => setGrouping(option.id)}
                      style={{ backgroundColor: selected ? theme.colors.accent : 'transparent' }}
                    >
                      <Text
                        className="font-label text-[11px]"
                        style={{ color: selected ? theme.colors.background : theme.colors.text }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ScrollView
              horizontal
              contentContainerClassName="gap-2"
              showsHorizontalScrollIndicator={false}
            >
              {categoryOptions.map((option) => {
                const selected = category === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className="h-8 flex-row items-center gap-1.5 rounded-pill px-3 active:opacity-75"
                    onPress={() => setCategory(option.id)}
                    style={{
                      backgroundColor: selected ? theme.colors.surface2 : 'transparent',
                      borderColor: selected ? theme.colors.accent : theme.colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <Lucide
                      color={selected ? theme.colors.accent : theme.colors.muted}
                      name={option.icon}
                      size={13}
                    />
                    <Text className="font-label text-[11px] text-ink">{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="mx-4 items-center gap-3 rounded-card bg-surface p-8">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="font-body text-sm text-muted">Carregando suas fotos...</Text>
            </View>
          ) : error ? (
            <View className="mx-4 items-center gap-3 rounded-card bg-surface p-7">
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
            <View className="mx-4 items-center gap-3 rounded-card bg-surface p-7">
              <Lucide color={theme.colors.accent} name="telescope" size={28} />
              <Text className="font-display text-lg text-ink">
                {category === 'all' ? 'Nenhuma foto ainda' : 'Nenhuma foto nesta categoria'}
              </Text>
              <Text className="text-center font-body text-sm leading-5 text-muted">
                {category === 'all'
                  ? 'Suas astrofotos aparecerão aqui após a primeira captura.'
                  : 'Escolha outra categoria para ver mais fotos.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-6">
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : hasMore ? (
            <Pressable
              accessibilityRole="button"
              className="mx-4 mt-4 items-center rounded-pill bg-surface px-5 py-3 active:opacity-80"
              onPress={() => void loadMore()}
            >
              <Text className="font-label text-xs text-accent">Carregar mais fotos</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <View className="flex-row items-baseline justify-between bg-canvas px-4 pb-2 pt-4">
              <Text accessibilityRole="header" className="font-label text-sm text-ink">
                {item.title}
              </Text>
              <Text className="font-body text-[11px] text-muted">
                {item.count === 1 ? '1 foto' : `${item.count} fotos`}
              </Text>
            </View>
          ) : (
            <View className="flex-row" style={{ gap: GRID_GAP, marginBottom: GRID_GAP }}>
              {item.photos.map((photo) => (
                <GalleryTile key={photo.id} photo={photo} size={tileSize} onOpen={openPhoto} />
              ))}
            </View>
          )
        }
      />

      {viewerIndex >= 0 ? (
        <PhotoViewer
          initialIndex={viewerIndex}
          photos={gallery.photos}
          onClose={() => setViewerPhotoId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const GalleryTile = memo(function GalleryTile({
  photo,
  size,
  onOpen,
}: {
  photo: GalleryPhoto;
  size: number;
  onOpen(photoId: string): void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable
      accessibilityLabel={`Abrir ${photo.observation.title}`}
      accessibilityRole="imagebutton"
      className="active:opacity-80"
      onPress={() => onOpen(photo.id)}
      style={{ width: size, height: size }}
    >
      {photo.uri && !failed ? (
        <Image
          className="bg-surface-2"
          fadeDuration={120}
          onError={() => setFailed(true)}
          resizeMethod="resize"
          resizeMode="cover"
          source={{ uri: photo.uri }}
          style={{ width: size, height: size }}
        />
      ) : (
        <View
          className="items-center justify-center gap-1 bg-surface-2 px-2"
          style={{ width: size, height: size }}
        >
          <Lucide
            color={theme.colors.muted}
            name={photo.photo ? 'image-off' : 'camera-off'}
            size={20}
          />
          <Text className="text-center font-label text-[10px] text-ink" numberOfLines={2}>
            {photo.observation.celestialObjectName ?? photo.observation.title}
          </Text>
          <Text className="text-center font-body text-[9px] text-muted">
            {photo.photo ? 'Foto indisponível' : 'Sem foto enviada'}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

function toRows(sections: ReturnType<typeof buildPhotoGallery>['sections']): GalleryRow[] {
  return sections.flatMap<GalleryRow>((section) => {
    const rows: GalleryRow[] = [
      {
        type: 'header',
        key: `header:${section.key}`,
        title: section.title,
        count: section.photos.length,
      },
    ];
    for (let start = 0; start < section.photos.length; start += GRID_COLUMNS) {
      rows.push({
        type: 'row',
        key: `row:${section.key}:${start}`,
        photos: section.photos.slice(start, start + GRID_COLUMNS),
      });
    }
    return rows;
  });
}
