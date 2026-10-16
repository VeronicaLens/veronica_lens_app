import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildPhotoGallery,
  removeGalleryThumbnail,
  useGalleryThumbnails,
  useObservationHistory,
  type GalleryGrouping,
  type GalleryPhoto,
  type ObservationCategory,
} from '../../../features/observation-history/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { PhotoViewer } from './PhotoViewer.tsx';
import { useImageLoadStatus } from './use-image-load-status.ts';

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
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const {
    observations,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    removePhoto,
    removeObservation,
  } = useObservationHistory(accessToken);

  const gallery = useMemo(
    () => buildPhotoGallery(observations, { grouping, category }),
    [category, grouping, observations],
  );
  const rows = useMemo(() => toRows(gallery.sections), [gallery.sections]);
  const thumbnails = useGalleryThumbnails(gallery.photos);
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
  const requestDelete = useCallback(
    (photo: GalleryPhoto, nextPhotoId: string | null = null) => {
      const hasPhoto = photo.photo !== null;
      Alert.alert(
        hasPhoto ? 'Excluir foto?' : 'Excluir observação?',
        hasPhoto
          ? 'A foto será apagada da sua galeria e do armazenamento. Esta ação não pode ser desfeita.'
          : 'Esta observação não tem foto enviada e será removida da sua galeria.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => {
              setDeletingPhotoId(photo.id);
              void (async () => {
                try {
                  if (photo.photo) {
                    await removePhoto(photo.observation.id, photo.photo.id);
                    void removeGalleryThumbnail(photo.photo.id);
                  } else await removeObservation(photo.observation.id);
                  setViewerPhotoId((current) => (current === photo.id ? nextPhotoId : current));
                } catch {
                  Alert.alert(
                    'Não foi possível excluir',
                    'Verifique sua conexão e tente novamente.',
                  );
                } finally {
                  setDeletingPhotoId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [removeObservation, removePhoto],
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <FlatList
        contentContainerClassName="flex-grow pb-8"
        data={rows}
        extraData={`${deletingPhotoId ?? ''}:${thumbnails.version}`}
        initialNumToRender={12}
        keyExtractor={(row) => row.key}
        maxToRenderPerBatch={8}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.6}
        onRefresh={() => void refresh()}
        refreshing={loading && observations.length > 0}
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
                <GalleryTile
                  key={photo.id}
                  deleting={deletingPhotoId === photo.id}
                  imageUri={thumbnails.uriFor(photo)}
                  photo={photo}
                  size={tileSize}
                  onDelete={requestDelete}
                  onOpen={openPhoto}
                />
              ))}
            </View>
          )
        }
      />

      {viewerIndex >= 0 ? (
        <PhotoViewer
          key={viewerPhotoId}
          deleting={deletingPhotoId !== null}
          initialIndex={viewerIndex}
          photos={gallery.photos}
          onClose={() => setViewerPhotoId(null)}
          onDelete={requestDelete}
        />
      ) : null}
    </SafeAreaView>
  );
}

const GalleryTile = memo(function GalleryTile({
  deleting,
  imageUri,
  photo,
  size,
  onDelete,
  onOpen,
}: {
  deleting: boolean;
  imageUri: string | null;
  photo: GalleryPhoto;
  size: number;
  onDelete(photo: GalleryPhoto): void;
  onOpen(photoId: string): void;
}) {
  const { status, onError } = useImageLoadStatus(imageUri ?? photo.uri);
  const showImage = photo.uri !== null && status !== 'failed';
  return (
    <Pressable
      accessibilityActions={[{ name: 'longpress', label: 'Excluir' }]}
      accessibilityLabel={`Abrir ${photo.observation.title}`}
      accessibilityRole="imagebutton"
      className="active:opacity-80"
      delayLongPress={400}
      disabled={deleting}
      onAccessibilityAction={() => onDelete(photo)}
      onLongPress={() => onDelete(photo)}
      onPress={() => onOpen(photo.id)}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <>
          {/* Rendered behind the image: visible while loading, covered once it appears. */}
          <View
            className="absolute items-center justify-center bg-surface-2"
            style={{ width: size, height: size }}
          >
            <ActivityIndicator color={theme.colors.muted} size="small" />
          </View>
          {imageUri ? (
            <Image
              key={imageUri}
              onError={onError}
              resizeMode="cover"
              source={{ uri: imageUri }}
              style={{ width: size, height: size }}
            />
          ) : null}
        </>
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
      {deleting ? (
        <View
          className="absolute items-center justify-center"
          style={{ width: size, height: size, backgroundColor: 'rgba(8, 11, 20, 0.7)' }}
        >
          <ActivityIndicator color={theme.colors.accent} size="small" />
        </View>
      ) : null}
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
