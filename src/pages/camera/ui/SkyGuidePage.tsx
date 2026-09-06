import { Lucide } from '@react-native-vector-icons/lucide';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  projectVisibleCelestialObjects,
  type ScreenViewport,
} from '../../../features/celestial-projection/index.ts';
import { useDeviceLocation } from '../../../features/device-location/index.ts';
import { useDeviceOrientation } from '../../../features/device-orientation/index.ts';
import { useSkyGuidePositions } from '../../../features/sky-guide/index.ts';
import type { SkyGuideObjectPosition } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

const CAMERA_FIELD_OF_VIEW = { horizontalDegrees: 45, verticalDegrees: 60 } as const;

interface SkyGuidePageProps {
  accessToken: string;
  onClose(): void;
}

interface ProjectionCandidate {
  id: string;
  altitudeDegrees: number;
  azimuthDegrees: number;
  object: SkyGuideObjectPosition;
}

export function SkyGuidePage({ accessToken, onClose }: SkyGuidePageProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRequestStarted = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ScreenViewport | null>(null);
  const [query, setQuery] = useState('');
  const [redNightMode, setRedNightMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cameraGranted = cameraPermission?.granted === true;
  const location = useDeviceLocation(cameraGranted);
  const orientation = useDeviceOrientation(cameraGranted);
  const sky = useSkyGuidePositions(accessToken, location.location, location.status === 'active');

  useEffect(() => {
    if (!cameraPermission || cameraPermission.granted || cameraRequestStarted.current) return;
    cameraRequestStarted.current = true;
    void requestCameraPermission();
  }, [cameraPermission, requestCameraPermission]);

  const projectedObjects = useMemo(() => {
    if (!viewport || !orientation.orientation) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const candidates: ProjectionCandidate[] = sky.positions
      .filter((object) => object.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
      .map((object) => ({
        id: object.id,
        altitudeDegrees: object.horizontal.altitudeDegrees,
        azimuthDegrees: object.horizontal.azimuthDegrees,
        object,
      }));

    return projectVisibleCelestialObjects(candidates, {
      orientation: orientation.orientation,
      fieldOfView: CAMERA_FIELD_OF_VIEW,
      viewport,
    });
  }, [orientation.orientation, query, sky.positions, viewport]);

  const selectedObject = sky.positions.find((object) => object.id === selectedId) ?? null;
  const accent = redNightMode ? '#F34B6B' : theme.colors.accent;
  const surface = redNightMode ? '#310B14' : theme.colors.surface;
  const border = redNightMode ? '#6D1A2B' : theme.colors.border;

  if (!cameraPermission) {
    return <LoadingFallback message="Preparando a câmera..." />;
  }

  if (!cameraPermission.granted) {
    return (
      <PermissionFallback
        icon="camera-off"
        title="A câmera está bloqueada"
        message="Permita o acesso à câmera para visualizar o guia celeste sobre o céu."
        actionLabel={cameraPermission.canAskAgain ? 'Permitir câmera' : 'Abrir configurações'}
        onAction={() =>
          void (cameraPermission.canAskAgain ? requestCameraPermission() : Linking.openSettings())
        }
      />
    );
  }

  const notice = getGuideNotice({ cameraReady, cameraError, location, orientation, sky });

  return (
    <View className="flex-1 bg-canvas" onLayout={(event) => updateViewport(event, setViewport)}>
      <CameraView
        active
        facing="back"
        mode="picture"
        mute
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => setCameraError('Não foi possível iniciar o preview da câmera.')}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.cameraShade]} />
      {redNightMode ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.redNightOverlay]} />
      ) : null}

      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center gap-3 px-4 pt-3">
          <CircleButton
            accessibilityLabel="Voltar ao início"
            color={accent}
            icon="chevron-left"
            onPress={onClose}
          />
          <View
            className="h-11 flex-1 flex-row items-center rounded-pill border px-4"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <Lucide color={theme.colors.muted} name="search" size={16} />
            <TextInput
              accessibilityLabel="Buscar objeto celeste"
              className="ml-2 flex-1 font-body text-xs text-ink"
              onChangeText={setQuery}
              placeholder="Buscar estrela, planeta..."
              placeholderTextColor={theme.colors.muted}
              value={query}
            />
          </View>
          <CircleButton
            accessibilityLabel={
              redNightMode ? 'Desativar modo noturno vermelho' : 'Ativar modo noturno vermelho'
            }
            color={accent}
            icon="moon"
            onPress={() => setRedNightMode((value) => !value)}
          />
        </View>

        {notice ? (
          <View
            className="mx-4 mt-3 flex-row items-center gap-2 rounded-control border px-3 py-2"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            {notice.busy ? (
              <ActivityIndicator color={accent} size="small" />
            ) : (
              <Lucide color={accent} name="info" size={15} />
            )}
            <Text
              accessibilityLiveRegion="polite"
              className="flex-1 font-body text-[11px] leading-4 text-ink"
            >
              {notice.message}
            </Text>
            {notice.retry ? (
              <Pressable
                accessibilityRole="button"
                className="p-1 active:opacity-70"
                onPress={notice.retry}
              >
                <Lucide color={accent} name="refresh-cw" size={16} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.reticle}>
          <View style={[styles.reticleCircle, { borderColor: accent }]} />
          <View style={[styles.reticleHorizontal, { backgroundColor: accent }]} />
          <View style={[styles.reticleVertical, { backgroundColor: accent }]} />
        </View>

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {projectedObjects.map(({ celestialObject, x, y }) => (
            <Pressable
              key={celestialObject.id}
              accessibilityLabel={`${celestialObject.object.name}, altitude ${Math.round(celestialObject.altitudeDegrees)} graus`}
              className="absolute items-center active:opacity-70"
              onPress={() => setSelectedId(celestialObject.id)}
              style={{ left: x - 48, top: y - 14, width: 96 }}
            >
              <View
                className="h-3 w-3 rounded-full border-2"
                style={{ backgroundColor: accent, borderColor: theme.colors.text }}
              />
              <View
                className="mt-1 rounded-pill border px-2 py-1"
                style={{ backgroundColor: surface, borderColor: border }}
              >
                <Text className="font-label text-[10px] text-ink" numberOfLines={1}>
                  {celestialObject.object.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {!selectedObject ? (
          <View
            className="absolute bottom-5 self-center rounded-pill border px-4 py-2"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <Text className="font-body text-[11px] text-ink">
              Mova lentamente para explorar o céu
            </Text>
          </View>
        ) : (
          <View
            className="absolute bottom-3 left-3 right-3 gap-3 rounded-panel border p-4"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <View
              className="h-1 w-12 self-center rounded-pill"
              style={{ backgroundColor: border }}
            />
            <View className="flex-row items-start">
              <View className="flex-1 gap-1">
                <Text className="font-display text-xl" style={{ color: accent }}>
                  {selectedObject.name}
                </Text>
                <Text className="font-body text-[11px] text-muted">
                  {objectTypeLabel(selectedObject.type)} · altitude{' '}
                  {Math.round(selectedObject.horizontal.altitudeDegrees)}° · azimute{' '}
                  {Math.round(selectedObject.horizontal.azimuthDegrees)}°
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Fechar detalhes"
                className="p-2"
                onPress={() => setSelectedId(null)}
              >
                <Lucide color={theme.colors.muted} name="x" size={18} />
              </Pressable>
            </View>
            <Text className="font-body text-xs leading-5 text-ink">
              Objeto identificado no campo atual da câmera.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function CircleButton({
  accessibilityLabel,
  color,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  color: string;
  icon: 'chevron-left' | 'moon';
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
      onPress={onPress}
    >
      <Lucide color={color} name={icon} size={18} />
    </Pressable>
  );
}

function LoadingFallback({ message }: { message: string }) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-canvas px-8">
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text className="text-center font-body text-sm text-muted">{message}</Text>
    </SafeAreaView>
  );
}

function PermissionFallback({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: 'camera-off';
  title: string;
  message: string;
  actionLabel: string;
  onAction(): void;
}) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-canvas px-6">
      <View className="w-full max-w-md items-center gap-4 rounded-panel border border-border bg-surface p-6">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-2">
          <Lucide color={theme.colors.accent} name={icon} size={26} />
        </View>
        <Text accessibilityRole="header" className="font-display text-xl text-ink">
          {title}
        </Text>
        <Text className="text-center font-body text-sm leading-5 text-muted">{message}</Text>
        <Pressable
          accessibilityRole="button"
          className="mt-2 min-h-11 w-full items-center justify-center rounded-pill bg-brand px-5 active:opacity-80"
          onPress={onAction}
        >
          <Text className="font-label text-xs text-ink">{actionLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function updateViewport(event: LayoutChangeEvent, setViewport: (viewport: ScreenViewport) => void) {
  const { width, height } = event.nativeEvent.layout;
  if (width > 0 && height > 0) setViewport({ width, height });
}

function getGuideNotice({
  cameraReady,
  cameraError,
  location,
  orientation,
  sky,
}: {
  cameraReady: boolean;
  cameraError: string | null;
  location: ReturnType<typeof useDeviceLocation>;
  orientation: ReturnType<typeof useDeviceOrientation>;
  sky: ReturnType<typeof useSkyGuidePositions>;
}) {
  if (cameraError) return { message: cameraError, busy: false };
  if (!cameraReady) return { message: 'Iniciando preview da câmera...', busy: true };
  if (location.fallbackMessage)
    return { message: location.fallbackMessage, busy: false, retry: location.retry };
  if (location.status !== 'active') return { message: 'Obtendo sua localização...', busy: true };
  if (orientation.fallbackMessage)
    return { message: orientation.fallbackMessage, busy: false, retry: orientation.retry };
  if (orientation.status !== 'active')
    return { message: 'Alinhando sensores do aparelho...', busy: true };
  if (sky.error) return { message: sky.error, busy: false, retry: sky.refresh };
  if (sky.loading) return { message: 'Calculando o céu para sua localização...', busy: true };
  if (sky.unavailableObjectIds.length > 0)
    return {
      message: 'Algumas efemérides estão temporariamente indisponíveis.',
      busy: false,
      retry: sky.refresh,
    };
  return null;
}

function objectTypeLabel(type: SkyGuideObjectPosition['type']): string {
  return { moon: 'Lua', planet: 'Planeta', star: 'Estrela', constellation: 'Constelação' }[type];
}

const styles = StyleSheet.create({
  cameraShade: { backgroundColor: 'rgba(8, 11, 20, 0.22)' },
  redNightOverlay: { backgroundColor: 'rgba(92, 0, 18, 0.55)' },
  reticle: {
    position: 'absolute',
    left: '50%',
    top: '44%',
    width: 82,
    height: 82,
    marginLeft: -41,
    marginTop: -41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleCircle: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    opacity: 0.72,
  },
  reticleHorizontal: { position: 'absolute', width: 94, height: 1, opacity: 0.72 },
  reticleVertical: { position: 'absolute', width: 1, height: 94, opacity: 0.72 },
});
