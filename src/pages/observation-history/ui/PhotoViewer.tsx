import { Lucide } from '@react-native-vector-icons/lucide';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  categorizeObservation,
  describeCapture,
  observationCategoryConfig,
  usePlaceName,
  type GalleryPhoto,
} from '../../../features/observation-history/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { useImageLoadStatus } from './use-image-load-status.ts';

interface PhotoViewerProps {
  photos: GalleryPhoto[];
  initialIndex: number;
  deleting: boolean;
  onClose(): void;
  onDelete(photo: GalleryPhoto, nextPhotoId: string | null): void;
}

export function PhotoViewer({
  photos,
  initialIndex,
  deleting,
  onClose,
  onDelete,
}: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const current = photos[Math.min(index, photos.length - 1)];

  useEffect(() => {
    // Warm the cache for the neighbours so swiping shows the next photo immediately.
    for (const neighbour of [photos[index - 1], photos[index + 1]]) {
      if (neighbour?.uri) void Image.prefetch(neighbour.uri).catch(() => undefined);
    }
  }, [index, photos]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent visible>
      <View className="flex-1 bg-black">
        <FlatList
          data={photos}
          getItemLayout={(_, itemIndex) => ({
            length: width,
            offset: width * itemIndex,
            index: itemIndex,
          })}
          horizontal
          initialNumToRender={1}
          initialScrollIndex={initialIndex}
          keyExtractor={(photo) => photo.id}
          maxToRenderPerBatch={2}
          onMomentumScrollEnd={(event) => {
            setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
            setDetailsOpen(false);
          }}
          pagingEnabled
          renderItem={({ item }) => (
            <ViewerPage
              height={height}
              photo={item}
              width={width}
              onPress={() => setChromeVisible((value) => !value)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          windowSize={3}
        />

        {chromeVisible && current ? (
          <>
            <View
              className="absolute left-0 right-0 flex-row items-center justify-between px-4"
              style={{ top: insets.top + 8 }}
            >
              <ViewerButton accessibilityLabel="Fechar foto" icon="x" onPress={onClose} />
              <View className="rounded-pill bg-black/60 px-3 py-1.5">
                <Text className="font-label text-xs text-ink">
                  {index + 1} de {photos.length}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <ViewerButton
                  accessibilityLabel="Excluir foto"
                  disabled={deleting}
                  icon="trash-2"
                  onPress={() =>
                    onDelete(current, photos[index + 1]?.id ?? photos[index - 1]?.id ?? null)
                  }
                />
                <ViewerButton
                  accessibilityLabel={detailsOpen ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                  active={detailsOpen}
                  icon="info"
                  onPress={() => setDetailsOpen((value) => !value)}
                />
              </View>
            </View>

            <View
              className="absolute bottom-0 left-0 right-0 rounded-t-panel px-5 pt-4"
              style={{
                backgroundColor: 'rgba(8, 11, 20, 0.92)',
                paddingBottom: insets.bottom + 16,
                maxHeight: height * 0.6,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: detailsOpen }}
                className="flex-row items-center gap-3"
                onPress={() => setDetailsOpen((value) => !value)}
              >
                <View className="flex-1 gap-0.5">
                  <Text className="font-label text-base text-ink" numberOfLines={1}>
                    {current.observation.title}
                  </Text>
                  <Text className="font-body text-xs text-muted">
                    {formatDateTime(new Date(current.takenAt))}
                  </Text>
                </View>
                <Lucide
                  color={theme.colors.muted}
                  name={detailsOpen ? 'chevron-down' : 'chevron-up'}
                  size={18}
                />
              </Pressable>

              {detailsOpen ? <PhotoDetails photo={current} /> : null}
            </View>
          </>
        ) : null}

        {deleting ? (
          <View className="absolute inset-0 items-center justify-center gap-3 bg-black/60">
            <ActivityIndicator color={theme.colors.accent} size="large" />
            <Text className="font-label text-sm text-ink">Excluindo foto...</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function ViewerPage({
  height,
  photo,
  width,
  onPress,
}: {
  height: number;
  photo: GalleryPhoto;
  width: number;
  onPress(): void;
}) {
  const { status, onError } = useImageLoadStatus(photo.uri);

  return (
    <Pressable
      accessibilityHint="Mostra ou oculta os controles"
      accessibilityLabel={`Astrofoto de ${photo.observation.title}`}
      className="items-center justify-center"
      onPress={onPress}
      style={{ width, height }}
    >
      {photo.uri && status !== 'failed' ? (
        <>
          {/* Rendered behind the photo: visible while loading, covered once it appears. */}
          <View className="absolute items-center gap-3">
            <ActivityIndicator color={theme.colors.accent} size="large" />
            <Text className="font-body text-xs text-muted">Carregando foto...</Text>
          </View>
          <Image
            onError={onError}
            resizeMode="contain"
            source={{ uri: photo.uri }}
            style={{ width, height }}
          />
        </>
      ) : null}
      {status === 'failed' ? (
        <View className="absolute items-center gap-3">
          <Lucide color={theme.colors.muted} name="image-off" size={36} />
          <Text className="font-body text-sm text-muted">
            {photo.photo ? 'Foto indisponível' : 'Esta observação não tem foto enviada'}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function PhotoDetails({ photo }: { photo: GalleryPhoto }) {
  const { observation } = photo;
  const category = observationCategoryConfig[categorizeObservation(observation)];
  const captureDetails = describeCapture(photo.photo?.capture ?? null);
  const place = usePlaceName(observation.latitude, observation.longitude);
  const coordinates =
    observation.latitude === null || observation.longitude === null
      ? null
      : `${observation.latitude.toFixed(4)}, ${observation.longitude.toFixed(4)}`;

  return (
    <ScrollView
      className="mt-4"
      contentContainerClassName="gap-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-2.5">
        <DetailRow
          icon={category.icon}
          label="Objeto"
          value={observation.celestialObjectName ?? category.label}
        />
        <View className="flex-row items-start gap-3">
          <Lucide color={theme.colors.accent} name="map-pin" size={15} />
          <Text className="w-14 font-body text-xs text-muted">Local</Text>
          <View className="flex-1 gap-0.5">
            {coordinates === null ? (
              <Text className="font-label text-xs text-ink">Localização não registrada</Text>
            ) : place.status === 'ready' ? (
              <>
                <Text className="font-label text-xs text-ink" numberOfLines={2}>
                  {place.label}
                </Text>
                <Text className="font-body text-[10px] text-muted">{coordinates}</Text>
              </>
            ) : place.status === 'loading' ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color={theme.colors.muted} size="small" />
                <Text className="font-body text-[11px] text-muted">{coordinates}</Text>
              </View>
            ) : (
              <Text className="font-label text-xs text-ink">{coordinates}</Text>
            )}
          </View>
        </View>
      </View>

      {captureDetails.length > 0 ? (
        <View className="gap-2">
          <Text className="font-label text-[10px] uppercase tracking-[1.5px] text-muted">
            Ajustes da câmera
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {captureDetails.map((detail) => (
              <View
                key={detail.label}
                className="min-w-[30%] flex-1 gap-0.5 rounded-control bg-surface px-3 py-2"
              >
                <Text className="font-body text-[10px] text-muted">{detail.label}</Text>
                <Text className="font-label text-xs text-ink" numberOfLines={1}>
                  {detail.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text className="font-body text-xs text-muted">
          Ajustes da câmera não registrados para esta foto.
        </Text>
      )}

      {observation.notes ? (
        <View className="gap-1">
          <Text className="font-label text-[10px] uppercase tracking-[1.5px] text-muted">
            Anotações
          </Text>
          <Text className="font-body text-sm leading-5 text-ink">{observation.notes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Lucide>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Lucide color={theme.colors.accent} name={icon} size={15} />
      <Text className="w-14 font-body text-xs text-muted">{label}</Text>
      <Text className="flex-1 font-label text-xs text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ViewerButton({
  accessibilityLabel,
  active = false,
  disabled = false,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  active?: boolean;
  disabled?: boolean;
  icon: 'x' | 'info' | 'trash-2';
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      className="h-10 w-10 items-center justify-center rounded-full active:opacity-75"
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: active ? theme.colors.accent : 'rgba(0, 0, 0, 0.6)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Lucide color={active ? theme.colors.background : theme.colors.text} name={icon} size={18} />
    </Pressable>
  );
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
