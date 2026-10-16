import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  constellationFigures,
  projectConstellationFigure,
  projectVisibleCelestialObjects,
  type ScreenViewport,
} from '../../../features/celestial-projection/index.ts';
import {
  flushPendingAstroPhotos,
  saveCapturedAstroPhoto,
} from '../../../features/astrophoto-storage/index.ts';
import {
  buildCaptureTips,
  CameraCaptureView,
  cameraFailureMessage,
  CaptureControlsPanel,
  captureProfiles,
  createAssistedCapturePlan,
  describeAppliedCapture,
  findCaptureProfile,
  useCameraAccess,
  type AssistedCaptureSettings,
  type CameraCapabilities,
  type CameraCaptureHandle,
  type CameraZoomRange,
  type CaptureProfile,
  type CaptureProfileId,
  type CaptureTipAction,
  type CaptureTipTopic,
} from '../../../features/camera-capture/index.ts';
import { useDeviceLocation } from '../../../features/device-location/index.ts';
import { useDeviceOrientation } from '../../../features/device-orientation/index.ts';
import { useObservationRecommendation } from '../../../features/observation-planning/index.ts';
import { useSkyGuidePositions } from '../../../features/sky-guide/index.ts';
import type {
  ObservationRecommendation,
  SkyGuideObjectPosition,
} from '../../../shared/api/index.ts';
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

const profileIcons: Record<CaptureProfileId, LucideIconName> = {
  'deep-sky': 'sparkles',
  moon: 'moon',
  landscape: 'mountain',
};

const profileShortLabels: Record<CaptureProfileId, string> = {
  'deep-sky': 'Céu profundo',
  moon: 'Lua e planetas',
  landscape: 'Paisagem',
};

const tipIcons: Record<CaptureTipTopic, LucideIconName> = {
  profile: 'aperture',
  exposure: 'sun',
  zoom: 'zoom-in',
  stability: 'hand',
  framing: 'move-up',
  level: 'move-horizontal',
  focus: 'focus',
};

export function SkyGuidePage({ accessToken, onClose }: SkyGuidePageProps) {
  const {
    granted: cameraGranted,
    canRequest: canRequestCamera,
    request: requestCamera,
  } = useCameraAccess();
  const cameraCapture = useRef<CameraCaptureHandle>(null);
  const cameraRequestStarted = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ScreenViewport | null>(null);
  const [query, setQuery] = useState('');
  const [redNightMode, setRedNightMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [photoCaptureEnabled, setPhotoCaptureEnabled] = useState(true);
  const [assistedCaptureEnabled, setAssistedCaptureEnabled] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<CaptureProfileId>('deep-sky');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipExpanded, setTipExpanded] = useState(false);
  const [skyOverlayEnabled, setSkyOverlayEnabled] = useState(true);
  const [levelEnabled, setLevelEnabled] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraZoomRange, setCameraZoomRange] = useState<CameraZoomRange | null>(null);
  const [cameraCapabilities, setCameraCapabilities] = useState<CameraCapabilities | null>(null);
  const [assistedSettings, setAssistedSettings] = useState<AssistedCaptureSettings>({
    iso: 1600,
    exposureTimeSeconds: 1 / 4,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const location = useDeviceLocation(cameraGranted);
  const orientation = useDeviceOrientation(cameraGranted);
  const sky = useSkyGuidePositions(accessToken, location.location, location.status === 'active');
  const planning = useObservationRecommendation(accessToken, selectedId, location.location);
  const handleCameraError = useCallback((message: string) => {
    setCameraReady(false);
    setCameraError(message);
  }, []);
  const handlePreviewReady = useCallback(() => {
    setCameraError(null);
    setCameraReady(true);
  }, []);

  useEffect(() => {
    if (cameraGranted || !canRequestCamera || cameraRequestStarted.current) return;
    cameraRequestStarted.current = true;
    void requestCamera();
  }, [cameraGranted, canRequestCamera, requestCamera]);

  useEffect(() => {
    if (!captureFeedback) return;
    const timeout = setTimeout(() => setCaptureFeedback(null), 2700);
    return () => clearTimeout(timeout);
  }, [captureFeedback]);

  useEffect(() => {
    if (!showHint) return;
    const timeout = setTimeout(() => setShowHint(false), 2700);
    return () => clearTimeout(timeout);
  }, [showHint]);

  useEffect(() => {
    // Pending photos are retried silently; the camera screen should not show upload alerts.
    void flushPendingAstroPhotos(accessToken).catch(() => undefined);
  }, [accessToken]);

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

  const observerLocation = location.location;
  const projectedFigures = useMemo(() => {
    if (!skyOverlayEnabled || !viewport || !orientation.orientation || !observerLocation) {
      return [];
    }
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const observedAt = new Date();
    const context = {
      orientation: orientation.orientation,
      fieldOfView: CAMERA_FIELD_OF_VIEW,
      viewport,
    };
    return constellationFigures.flatMap((figure) => {
      const name = sky.positions.find(({ id }) => id === figure.id)?.name ?? figure.id;
      if (normalizedQuery && !name.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) return [];
      const projection = projectConstellationFigure(figure, observerLocation, observedAt, context);
      return projection ? [projection] : [];
    });
  }, [
    observerLocation,
    orientation.orientation,
    query,
    sky.positions,
    skyOverlayEnabled,
    viewport,
  ]);

  const selectedObject = sky.positions.find((object) => object.id === selectedId) ?? null;
  const assistedPlan = useMemo(
    () =>
      cameraCapabilities ? createAssistedCapturePlan(cameraCapabilities, assistedSettings) : null,
    [assistedSettings, cameraCapabilities],
  );
  const captureTips = useMemo(
    () =>
      buildCaptureTips({
        profileId: selectedProfileId,
        target: selectedObject ? { name: selectedObject.name, type: selectedObject.type } : null,
        plan: assistedPlan,
        capabilities: cameraCapabilities,
        zoom: cameraZoom,
        zoomRange: cameraZoomRange,
        orientation: orientation.orientation,
      }),
    [
      assistedPlan,
      cameraCapabilities,
      cameraZoom,
      cameraZoomRange,
      orientation.orientation,
      selectedObject,
      selectedProfileId,
    ],
  );
  const currentTip = captureTips.length > 0 ? captureTips[tipIndex % captureTips.length] : null;
  const accent = redNightMode ? '#F34B6B' : theme.colors.accent;
  const surface = redNightMode ? '#310B14' : theme.colors.surface;
  const border = redNightMode ? '#6D1A2B' : theme.colors.border;

  if (!cameraGranted) {
    return (
      <PermissionFallback
        icon="camera-off"
        title="A câmera está bloqueada"
        message="Permita o acesso à câmera para visualizar o guia celeste sobre o céu."
        actionLabel={canRequestCamera ? 'Permitir câmera' : 'Abrir configurações'}
        onAction={() => void (canRequestCamera ? requestCamera() : Linking.openSettings())}
      />
    );
  }

  const notice = captureFeedback
    ? { message: captureFeedback, busy: captureBusy }
    : getGuideNotice({ cameraReady, cameraError, location, orientation, sky });

  async function capturePhoto() {
    if (captureBusy || !photoCaptureEnabled) return;
    setCaptureBusy(true);
    setCaptureFeedback('Capturando o céu...');
    try {
      if (!cameraCapture.current) throw new Error('Camera is not ready');
      const photo = await cameraCapture.current.capture();
      const persistence = await saveCapturedAstroPhoto(accessToken, photo, {
        title: selectedObject ? `Astrofoto de ${selectedObject.name}` : 'Astrofoto do céu',
        notes: '',
        celestialObjectName: selectedObject?.name ?? null,
        latitude: location.location?.latitudeDegrees ?? null,
        longitude: location.location?.longitudeDegrees ?? null,
      });
      if (persistence.status === 'uploaded') {
        setCaptureFeedback(
          `${describeAppliedCapture(photo.metadata.parameters)} Foto salva no histórico.`,
        );
      } else {
        setCaptureFeedback(`${describeAppliedCapture(photo.metadata.parameters)} Foto salva.`);
      }
    } catch (error) {
      setCaptureFeedback(cameraFailureMessage(error));
    } finally {
      setCaptureBusy(false);
    }
  }

  function applyCaptureProfile(profile: CaptureProfile) {
    setSelectedProfileId(profile.id);
    setAssistedCaptureEnabled(true);
    setTipIndex(0);
    setAssistedSettings((current) => ({
      ...current,
      ...(cameraCapabilities?.iso.status === 'supported'
        ? {
            iso: clamp(
              profile.iso,
              cameraCapabilities.iso.minimum ?? profile.iso,
              cameraCapabilities.iso.maximum ?? profile.iso,
            ),
          }
        : {}),
      ...(cameraCapabilities?.exposureTime.status === 'supported'
        ? {
            exposureTimeSeconds: clamp(
              profile.exposureTimeSeconds,
              cameraCapabilities.exposureTime.minimum ?? profile.exposureTimeSeconds,
              cameraCapabilities.exposureTime.maximum ?? profile.exposureTimeSeconds,
            ),
          }
        : {}),
      ...(cameraCapabilities?.exposureCompensation.status === 'supported'
        ? {
            exposureCompensationEv: clamp(
              profile.exposureCompensationEv,
              cameraCapabilities.exposureCompensation.minimum ?? profile.exposureCompensationEv,
              cameraCapabilities.exposureCompensation.maximum ?? profile.exposureCompensationEv,
            ),
          }
        : {}),
    }));
  }

  function applyCaptureTip(action: CaptureTipAction) {
    switch (action.kind) {
      case 'profile':
        applyCaptureProfile(findCaptureProfile(action.profileId));
        return;
      case 'exposure':
        setAssistedSettings((current) => ({
          ...current,
          iso: action.iso,
          exposureTimeSeconds: action.exposureTimeSeconds,
        }));
        break;
      case 'exposure-compensation':
        setAssistedSettings((current) => ({ ...current, exposureCompensationEv: action.value }));
        break;
      case 'zoom':
        setCameraZoom(action.zoom);
        break;
      case 'level':
        setLevelEnabled(true);
        break;
    }
    setTipIndex(0);
  }

  function togglePhotoCapture() {
    const enabled = !photoCaptureEnabled;
    setPhotoCaptureEnabled(enabled);
    if (!enabled) setShowHint(false);
    setCaptureFeedback(`Captura de fotos ${enabled ? 'ativada' : 'desativada'}.`);
  }

  function toggleAssistedCapture() {
    const enabled = !assistedCaptureEnabled;
    setAssistedCaptureEnabled(enabled);
    setTipIndex(0);
    setCaptureFeedback(`Assistente de fotografia ${enabled ? 'ativado' : 'desativado'}.`);
  }

  return (
    <View className="flex-1 bg-canvas" onLayout={(event) => updateViewport(event, setViewport)}>
      <CameraCaptureView
        ref={cameraCapture}
        active
        assistedCaptureEnabled={assistedCaptureEnabled}
        assistedSettings={assistedSettings}
        onCapabilitiesChange={setCameraCapabilities}
        onError={handleCameraError}
        onPreviewReady={handlePreviewReady}
        onZoomRangeChange={(range) => {
          setCameraZoomRange(range);
          if (range) setCameraZoom((current) => clamp(current, range.minZoom, range.maxZoom));
        }}
        zoom={cameraZoom}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.cameraShade]} />
      {redNightMode ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.redNightOverlay]} />
      ) : null}

      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center gap-2 px-4 pt-3">
          <CircleButton
            accessibilityLabel="Voltar ao início"
            color={accent}
            icon="chevron-left"
            onPress={onClose}
          />
          <View
            className="h-11 flex-1 flex-row items-center rounded-pill px-4"
            style={{ backgroundColor: 'rgba(17, 24, 43, 0.82)' }}
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
            accessibilityLabel={toolsOpen ? 'Fechar configurações' : 'Abrir configurações'}
            active={toolsOpen}
            color={accent}
            icon="settings"
            onPress={() => setToolsOpen((value) => !value)}
          />
          <CircleButton
            accessibilityLabel="Mostrar dica de uso"
            color={accent}
            icon="circle-help"
            onPress={() => setShowHint((value) => !value)}
          />
        </View>

        {showHint || notice ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="mt-2 max-w-[86%] flex-row items-center gap-2 self-center rounded-pill px-3 py-1.5"
            style={{ backgroundColor: 'rgba(8, 11, 20, 0.72)' }}
          >
            {!showHint && notice?.busy ? (
              <ActivityIndicator color={accent} size="small" />
            ) : (
              <Lucide color={accent} name="info" size={13} />
            )}
            <Text
              accessibilityLiveRegion="polite"
              className="shrink font-body text-[11px] text-ink"
              numberOfLines={2}
            >
              {showHint
                ? 'Aponte para o céu e toque em um astro para ver detalhes'
                : notice?.message}
            </Text>
          </Animated.View>
        ) : null}

        {photoCaptureEnabled && cameraZoomRange ? (
          <View
            className="absolute left-3 gap-1 rounded-pill p-1"
            style={{ backgroundColor: 'rgba(17, 24, 43, 0.72)', top: '40%' }}
          >
            {zoomStops(cameraZoomRange).map((zoom) => {
              const selected = Math.abs(cameraZoom - zoom) < 0.01;
              return (
                <Pressable
                  key={zoom}
                  accessibilityLabel={`Zoom ${formatZoom(zoom)}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="h-11 w-11 items-center justify-center rounded-full active:opacity-75"
                  onPress={() => setCameraZoom(zoom)}
                  style={{ backgroundColor: selected ? accent : 'transparent' }}
                >
                  <Text
                    className="font-label text-xs"
                    style={{ color: selected ? theme.colors.background : theme.colors.text }}
                  >
                    {formatZoom(zoom)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {toolsOpen ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="absolute right-3 top-[76px] gap-1 rounded-card p-1.5"
            style={{ backgroundColor: 'rgba(17, 24, 43, 0.92)', elevation: 8 }}
          >
            <CameraToolButton
              accessibilityLabel={skyOverlayEnabled ? 'Ocultar mapa do céu' : 'Mostrar mapa do céu'}
              active={skyOverlayEnabled}
              color={accent}
              icon="sparkles"
              label="Céu"
              onPress={() => setSkyOverlayEnabled((value) => !value)}
            />
            <CameraToolButton
              accessibilityLabel={
                redNightMode ? 'Desativar modo noturno vermelho' : 'Ativar modo noturno vermelho'
              }
              active={redNightMode}
              color={accent}
              icon="moon"
              label="Noturno"
              onPress={() => setRedNightMode((value) => !value)}
            />
            <CameraToolButton
              accessibilityLabel={
                photoCaptureEnabled ? 'Desativar captura de fotos' : 'Ativar captura de fotos'
              }
              active={photoCaptureEnabled}
              color={accent}
              icon="camera"
              label="Câmera"
              onPress={togglePhotoCapture}
            />
            {photoCaptureEnabled ? (
              <CameraToolButton
                accessibilityLabel={
                  assistedCaptureEnabled
                    ? 'Desativar assistente de fotografia'
                    : 'Ativar assistente de fotografia'
                }
                active={assistedCaptureEnabled}
                color={accent}
                icon="wand-sparkles"
                label="Assistente"
                onPress={toggleAssistedCapture}
              />
            ) : null}
            {photoCaptureEnabled ? (
              <CameraToolButton
                accessibilityLabel={levelEnabled ? 'Ocultar nível' : 'Mostrar nível'}
                active={levelEnabled}
                color={accent}
                icon="move-horizontal"
                label="Nível"
                onPress={() => setLevelEnabled((value) => !value)}
              />
            ) : null}
          </Animated.View>
        ) : null}

        {photoCaptureEnabled && levelEnabled ? (
          <View
            className="absolute self-center flex-row items-center gap-2 rounded-pill border px-3 py-2"
            style={{
              top: '57%',
              backgroundColor: surface,
              borderColor: border,
            }}
          >
            <View
              className="h-4 w-12 justify-center"
              style={{
                transform: [{ rotate: `${orientation.orientation?.rollDegrees ?? 0}deg` }],
              }}
            >
              <View
                className="h-px w-full"
                style={{
                  backgroundColor:
                    orientation.orientation && Math.abs(orientation.orientation.rollDegrees) < 2
                      ? theme.colors.info
                      : accent,
                }}
              />
            </View>
            <Text className="font-label text-[10px] text-ink">
              {orientation.orientation
                ? `${Math.round(orientation.orientation.rollDegrees)}°`
                : 'Nível indisponível'}
            </Text>
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.reticle}>
          <View style={[styles.reticleCircle, { borderColor: accent }]} />
          <View style={[styles.reticleHorizontal, { backgroundColor: accent }]} />
          <View style={[styles.reticleVertical, { backgroundColor: accent }]} />
        </View>

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {projectedFigures.map((figure) => (
            <View key={figure.id} style={StyleSheet.absoluteFill}>
              {figure.segments.map((segment) => {
                const length = Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1);
                const angle = Math.atan2(segment.y2 - segment.y1, segment.x2 - segment.x1);
                return (
                  <View
                    key={segment.key}
                    style={[
                      styles.constellationLine,
                      {
                        backgroundColor: accent,
                        left: (segment.x1 + segment.x2) / 2 - length / 2,
                        top: (segment.y1 + segment.y2) / 2,
                        width: length,
                        transform: [{ rotate: `${angle}rad` }],
                      },
                    ]}
                  />
                );
              })}
              {figure.stars.map((figureStar) => {
                const size = clamp(6.5 - figureStar.magnitude * 1.3, 3, 7);
                return (
                  <View
                    key={figureStar.key}
                    style={[
                      styles.constellationStar,
                      {
                        left: figureStar.x - size / 2,
                        top: figureStar.y - size / 2,
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        shadowColor: accent,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {skyOverlayEnabled
            ? projectedObjects.map(({ celestialObject, x, y }) => (
                <Pressable
                  key={celestialObject.id}
                  accessibilityLabel={`${celestialObject.object.name}, altitude ${Math.round(celestialObject.altitudeDegrees)} graus`}
                  className="absolute items-center active:opacity-70"
                  onPress={() => {
                    setSelectedId(celestialObject.id);
                    setDetailsExpanded(false);
                  }}
                  style={{ left: x - 56, top: y - 14, width: 112 }}
                >
                  <CelestialMarker accent={accent} object={celestialObject.object} />
                  <View
                    className="mt-1 rounded-pill px-2 py-0.5"
                    style={{ backgroundColor: 'rgba(8, 11, 20, 0.55)' }}
                  >
                    <Text
                      className={
                        celestialObject.object.type === 'constellation'
                          ? 'font-label text-[10px] uppercase tracking-[1.5px]'
                          : 'font-label text-[10px] text-ink'
                      }
                      numberOfLines={1}
                      style={
                        celestialObject.object.type === 'constellation'
                          ? { color: accent }
                          : undefined
                      }
                    >
                      {celestialObject.object.name}
                    </Text>
                  </View>
                </Pressable>
              ))
            : null}
        </View>

        {selectedObject ? (
          <View pointerEvents="box-none" style={styles.objectLabel}>
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center gap-2 rounded-pill border px-3 py-1.5 active:opacity-80"
              onPress={() => setDetailsExpanded((value) => !value)}
              style={{ backgroundColor: surface, borderColor: border }}
            >
              <Text className="font-label text-sm" style={{ color: accent }}>
                {selectedObject.name}
              </Text>
              <Lucide color={theme.colors.muted} name="info" size={14} />
            </Pressable>
          </View>
        ) : null}

        <View className="mt-auto gap-2">
          {selectedObject && detailsExpanded ? (
            <View
              className="mx-3 gap-3 rounded-panel p-4"
              style={{ backgroundColor: 'rgba(17, 24, 43, 0.94)' }}
            >
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
                  onPress={() => {
                    setSelectedId(null);
                    setDetailsExpanded(false);
                  }}
                >
                  <Lucide color={theme.colors.muted} name="x" size={18} />
                </Pressable>
              </View>
              <View className="gap-1 rounded-control bg-surface-2 px-3 py-2">
                {planning.loading ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color={accent} size="small" />
                    <Text className="font-body text-[11px] text-muted">
                      Calculando melhor janela nas próximas 24 horas...
                    </Text>
                  </View>
                ) : planning.error ? (
                  <View className="flex-row items-center gap-2">
                    <Text className="flex-1 font-body text-[11px] text-muted">
                      {planning.error}
                    </Text>
                    <Pressable accessibilityRole="button" onPress={planning.refresh}>
                      <Text className="font-label text-[10px]" style={{ color: accent }}>
                        Tentar novamente
                      </Text>
                    </Pressable>
                  </View>
                ) : planning.recommendation ? (
                  <>
                    <Text className="font-label text-[11px]" style={{ color: accent }}>
                      {recommendationTitle(planning.recommendation)}
                    </Text>
                    <Text className="font-body text-[10px] leading-4 text-muted">
                      {planning.recommendation.summary}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
          ) : null}

          {photoCaptureEnabled && assistedCaptureEnabled && currentTip ? (
            <Animated.View
              key={currentTip.id}
              entering={FadeIn.duration(180)}
              className="mx-3 flex-row items-center gap-2 rounded-card py-1.5 pl-3 pr-1.5"
              style={{ backgroundColor: 'rgba(17, 24, 43, 0.92)' }}
            >
              <Lucide
                color={currentTip.severity === 'warning' ? theme.colors.event : accent}
                name={tipIcons[currentTip.topic]}
                size={15}
              />
              <Pressable
                accessibilityHint="Toque para ver o motivo da dica"
                accessibilityLabel={`${currentTip.title}. ${currentTip.detail}`}
                accessibilityRole="button"
                className="flex-1 py-1"
                onPress={() => setTipExpanded((value) => !value)}
              >
                <Text
                  accessibilityLiveRegion="polite"
                  className="font-label text-[11px] text-ink"
                  numberOfLines={tipExpanded ? 2 : 1}
                >
                  {currentTip.title}
                </Text>
                {tipExpanded ? (
                  <Text className="mt-0.5 font-body text-[10px] leading-4 text-muted">
                    {currentTip.detail}
                  </Text>
                ) : null}
              </Pressable>
              {currentTip.action ? (
                <Pressable
                  accessibilityRole="button"
                  className="rounded-pill px-3 py-1.5 active:opacity-75"
                  onPress={() => currentTip.action && applyCaptureTip(currentTip.action.value)}
                  style={{ backgroundColor: accent }}
                >
                  <Text
                    className="font-label text-[10px]"
                    style={{ color: theme.colors.background }}
                  >
                    {currentTip.action.label}
                  </Text>
                </Pressable>
              ) : null}
              {captureTips.length > 1 ? (
                <Pressable
                  accessibilityLabel={`Próxima dica (${(tipIndex % captureTips.length) + 1} de ${captureTips.length})`}
                  accessibilityRole="button"
                  className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
                  onPress={() => {
                    setTipExpanded(false);
                    setTipIndex((value) => value + 1);
                  }}
                >
                  <Lucide color={theme.colors.muted} name="chevron-right" size={16} />
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}

          {photoCaptureEnabled ? (
            <View
              className="gap-3 rounded-t-panel px-4 pt-3"
              style={{
                backgroundColor: 'rgba(8, 11, 20, 0.88)',
                paddingBottom: insets.bottom + 8,
              }}
            >
              <View className="flex-row rounded-pill p-1" style={{ backgroundColor: surface }}>
                {captureProfiles.map((profile) => {
                  const selected = selectedProfileId === profile.id;
                  return (
                    <Pressable
                      key={profile.id}
                      accessibilityHint={profile.description}
                      accessibilityLabel={`Perfil ${profile.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-pill active:opacity-75"
                      onPress={() => applyCaptureProfile(profile)}
                      style={{ backgroundColor: selected ? accent : 'transparent' }}
                    >
                      <Lucide
                        color={selected ? theme.colors.background : theme.colors.muted}
                        name={profileIcons[profile.id]}
                        size={13}
                      />
                      <Text
                        className="font-label text-[11px]"
                        numberOfLines={1}
                        style={{ color: selected ? theme.colors.background : theme.colors.text }}
                      >
                        {profileShortLabels[profile.id]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <CaptureControlsPanel
                accent={accent}
                capabilities={cameraCapabilities}
                enabled={assistedCaptureEnabled}
                plan={assistedPlan}
                onSettingsChange={(settings) => {
                  setAssistedCaptureEnabled(true);
                  setAssistedSettings((current) => ({ ...current, ...settings }));
                }}
              />

              <View className="items-center">
                <Pressable
                  accessibilityLabel="Capturar foto do céu"
                  accessibilityRole="button"
                  accessibilityState={{ busy: captureBusy, disabled: !cameraReady || captureBusy }}
                  className="h-[72px] w-[72px] items-center justify-center rounded-full border-2 active:opacity-75"
                  disabled={!cameraReady || captureBusy}
                  onPress={() => void capturePhoto()}
                  style={{ borderColor: accent }}
                >
                  {captureBusy ? (
                    <ActivityIndicator color={accent} />
                  ) : (
                    <View
                      className="h-[58px] w-[58px] rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={{ height: insets.bottom + 8 }} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const planetColors: Record<string, string> = {
  mercury: '#C9C1B6',
  venus: '#F4DFA8',
  mars: '#E2795B',
  jupiter: '#E6C79C',
  saturn: '#EBD69F',
  uranus: '#A5E3E8',
  neptune: '#7D93F2',
};

function CelestialMarker({ accent, object }: { accent: string; object: SkyGuideObjectPosition }) {
  if (object.type === 'constellation') {
    return (
      <View style={styles.markerBox}>
        <Lucide color={accent} name="sparkles" size={14} />
      </View>
    );
  }

  if (object.type === 'moon') {
    return (
      <View style={styles.markerBox}>
        <View
          style={[
            styles.markerHalo,
            { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F2EEE3' },
          ]}
        />
        <View
          className="items-center justify-center"
          style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ECE8DC' }}
        >
          <Lucide color="#8D8A82" name="moon" size={12} />
        </View>
      </View>
    );
  }

  if (object.type === 'planet') {
    const color = planetColors[object.id] ?? '#E6C79C';
    return (
      <View style={styles.markerBox}>
        <View
          style={[
            styles.markerHalo,
            { width: 24, height: 24, borderRadius: 12, backgroundColor: color },
          ]}
        />
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
        {object.id === 'saturn' ? (
          <View style={[styles.saturnRing, { borderColor: color }]} />
        ) : null}
      </View>
    );
  }

  const magnitude = object.magnitude ?? 2;
  const core = clamp(7 - magnitude * 1.6, 3, 8);
  const ray = core * 3.2;
  return (
    <View style={styles.markerBox}>
      <View style={[styles.starRayHorizontal, { width: ray, backgroundColor: '#DCE6FF' }]} />
      <View style={[styles.starRayVertical, { height: ray, backgroundColor: '#DCE6FF' }]} />
      <View
        style={[
          styles.constellationStar,
          {
            position: 'relative',
            width: core,
            height: core,
            borderRadius: core / 2,
            shadowColor: accent,
          },
        ]}
      />
    </View>
  );
}

function CameraToolButton({
  accessibilityLabel,
  active,
  color,
  icon,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  active: boolean;
  color: string;
  icon: LucideIconName;
  label: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="h-[58px] w-[58px] items-center justify-center gap-1 rounded-control active:opacity-75"
      onPress={onPress}
      style={{ backgroundColor: active ? theme.colors.surface2 : 'transparent' }}
    >
      <Lucide color={active ? color : theme.colors.muted} name={icon} size={18} />
      <Text className="font-body text-[9px] text-ink">{label}</Text>
    </Pressable>
  );
}

// Mirrors native camera apps: telephoto (3x), standard (1x) and the widest lens available (≥ 0.5x).
function zoomStops(range: CameraZoomRange): number[] {
  return [3, 1, Math.max(0.5, range.minZoom)]
    .map((zoom) => clamp(zoom, range.minZoom, range.maxZoom))
    .filter(
      (zoom, index, values) => values.findIndex((value) => Math.abs(value - zoom) < 0.01) === index,
    );
}

function formatZoom(value: number): string {
  return `${Number(value.toFixed(1)).toLocaleString('pt-BR')}x`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function CircleButton({
  accessibilityLabel,
  active = false,
  color,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  active?: boolean;
  color: string;
  icon: LucideIconName;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="h-11 w-11 items-center justify-center rounded-full border active:opacity-70"
      onPress={onPress}
      style={{
        backgroundColor: active ? color : theme.colors.surface,
        borderColor: active ? color : theme.colors.border,
      }}
    >
      <Lucide color={active ? theme.colors.text : color} name={icon} size={18} />
    </Pressable>
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
    <SafeAreaView
      className="flex-1 items-center justify-center bg-canvas px-6"
      edges={['top', 'left', 'right']}
    >
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

function recommendationTitle(recommendation: ObservationRecommendation): string {
  if (recommendation.status !== 'recommended' || !recommendation.recommendedWindow) {
    return recommendation.status === 'insufficient_data'
      ? 'Dados insuficientes para recomendar'
      : 'Sem janela favorável nas próximas 24 horas';
  }
  const from = new Date(recommendation.recommendedWindow.from).toLocaleString('pt-BR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const to = new Date(recommendation.recommendedWindow.to).toLocaleString('pt-BR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Melhor janela: ${from}–${to}`;
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
  constellationLine: { position: 'absolute', height: 1, opacity: 0.55 },
  constellationStar: {
    position: 'absolute',
    backgroundColor: '#F5F7FB',
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  markerBox: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  markerHalo: { position: 'absolute', opacity: 0.28 },
  starRayHorizontal: { position: 'absolute', height: 1, opacity: 0.8 },
  starRayVertical: { position: 'absolute', width: 1, opacity: 0.8 },
  saturnRing: {
    position: 'absolute',
    width: 26,
    height: 9,
    borderRadius: 13,
    borderWidth: 1.5,
    transform: [{ rotate: '-20deg' }],
  },
  objectLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '44%',
    marginTop: 58,
    alignItems: 'center',
  },
});
