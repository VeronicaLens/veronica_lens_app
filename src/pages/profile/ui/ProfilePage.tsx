import { useEffect, useMemo, useState } from 'react';
import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../../../features/profile/index.ts';
import {
  deactivateStoredPushDevice,
  requestAndRegisterPushDevice,
  useEventPreferences,
} from '../../../features/notifications/index.ts';
import {
  categorizeObservation,
  useObservationHistory,
} from '../../../features/observation-history/index.ts';
import type { AppLanguage, MeasurementUnit, Profile } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { Button, TextField } from '../../../shared/ui/index.ts';
import { AboutScreen } from './account/AboutScreen.tsx';
import { DevicePermissionsScreen } from './account/DevicePermissionsScreen.tsx';
import { PrivacyScreen } from './account/PrivacyScreen.tsx';

type AccountScreenName = 'privacy' | 'permissions' | 'about';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

interface ProfilePageProps {
  accessToken: string;
  email: string;
  onLogout(): Promise<void>;
  onOpenHistory(): void;
  onSaved(profile: Profile): void;
}

function PreferenceRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  disabled = false,
  onChange,
}: {
  icon: LucideIconName;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  disabled?: boolean;
  onChange?(value: boolean): void;
}) {
  return (
    <View className="min-h-[62px] flex-row items-center gap-3 rounded-control bg-surface px-4 py-3">
      <View className="w-5 items-center">
        <Lucide color={iconColor} name={icon} size={17} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-label text-[13px] text-ink">{title}</Text>
        <Text className="font-body text-[10px] text-muted">{subtitle}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onValueChange={onChange}
        thumbColor={theme.colors.text}
        trackColor={{ false: '#34405E', true: theme.colors.primary }}
        value={value}
      />
    </View>
  );
}

function StatCard({
  icon,
  label,
  onPress,
  value,
}: {
  icon: LucideIconName;
  label: string;
  onPress(): void;
  value: number;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      className="flex-1 gap-3 rounded-card border border-border bg-surface p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <Lucide color={theme.colors.accent} name={icon} size={20} />
        <Lucide color={theme.colors.muted} name="chevron-right" size={14} />
      </View>
      <View className="gap-0.5">
        <Text className="font-display text-xl text-ink">{value}</Text>
        <Text className="font-body text-[10px] leading-3 text-muted" numberOfLines={2}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function Avatar({
  avatarUrl,
  initial,
  size,
}: {
  avatarUrl: string | null;
  initial: string;
  size: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        accessibilityLabel="Foto de perfil"
        className="rounded-full bg-elevated"
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <View
      className="items-center justify-center rounded-full bg-elevated"
      style={{ width: size, height: size }}
    >
      <Text className="font-display text-accent" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: LucideIconName;
  label: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[48px] flex-row items-center rounded-control bg-surface px-4 active:opacity-80"
      onPress={onPress}
    >
      <Lucide color={theme.colors.accent} name={icon} size={16} />
      <Text className="ml-3 flex-1 font-body text-xs text-ink">{label}</Text>
      <Lucide color={theme.colors.muted} name="chevron-right" size={16} />
    </Pressable>
  );
}

export function ProfilePage({
  accessToken,
  email,
  onLogout,
  onOpenHistory,
  onSaved,
}: ProfilePageProps) {
  const { profile, loading, saving, error, load, save, saveAvatar } = useProfile(accessToken);
  const eventPreferences = useEventPreferences(accessToken);
  const history = useObservationHistory(accessToken);
  const [editing, setEditing] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('metric');
  const [language, setLanguage] = useState<AppLanguage>('pt-BR');
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountScreen, setAccountScreen] = useState<AccountScreenName | null>(null);

  useEffect(() => {
    if (!accountScreen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setAccountScreen(null);
      return true;
    });
    return () => subscription.remove();
  }, [accountScreen]);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate editable form from API.
    setDisplayName(profile.displayName ?? '');
    setLocationName(profile.locationName ?? '');
    setLatitude(profile.latitude?.toString() ?? '');
    setLongitude(profile.longitude?.toString() ?? '');
    setNotificationsEnabled(profile.notificationsEnabled);
    setMeasurementUnit(profile.measurementUnit);
    setLanguage(profile.language);
  }, [profile]);

  const persistNotifications = async (value: boolean) => {
    setFormError(null);
    if (value) {
      const registration = await requestAndRegisterPushDevice(accessToken);
      if (registration.status !== 'registered') {
        setFormError(registration.message);
        return;
      }
    }
    const updated = await save({ notificationsEnabled: value });
    if (updated) {
      setNotificationsEnabled(value);
      onSaved(updated);
      if (!value) await deactivateStoredPushDevice(accessToken);
    }
  };

  const changeLocation = async (enabled: boolean) => {
    if (enabled) {
      setEditing(true);
      return;
    }
    const updated = await save({ latitude: null, longitude: null, locationName: null });
    if (updated) onSaved(updated);
  };

  const handleSave = async () => {
    const latitudeValue = latitude.trim() ? Number(latitude.replace(',', '.')) : null;
    const longitudeValue = longitude.trim() ? Number(longitude.replace(',', '.')) : null;
    if (
      (latitudeValue === null) !== (longitudeValue === null) ||
      Number.isNaN(latitudeValue) ||
      Number.isNaN(longitudeValue)
    ) {
      setFormError('Informe latitude e longitude válidas em conjunto.');
      return;
    }
    setFormError(null);
    setSaved(false);
    const updated = await save({
      displayName: displayName.trim() || null,
      locationName: locationName.trim() || null,
      latitude: latitudeValue,
      longitude: longitudeValue,
      notificationsEnabled,
      measurementUnit,
      language,
    });
    if (updated) {
      setSaved(true);
      setEditing(false);
      onSaved(updated);
    }
  };

  const initial = (profile?.displayName?.trim()[0] ?? email.trim()[0] ?? 'V').toUpperCase();

  const pickAvatar = async () => {
    if (uploadingAvatar) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoMessage('Permita o acesso às fotos para trocar sua foto de perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const contentType = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    setUploadingAvatar(true);
    setPhotoMessage(null);
    try {
      const updated = await saveAvatar(asset.uri, contentType);
      if (updated) {
        onSaved(updated);
      } else {
        setPhotoMessage('Não foi possível salvar sua foto de perfil.');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };
  const stats = useMemo(() => {
    const moonCount = history.observations.filter(
      (observation) => categorizeObservation(observation) === 'moon',
    ).length;
    const skyCount = history.observations.filter(
      (observation) => categorizeObservation(observation) !== 'moon',
    ).length;
    return { total: history.observations.length, moonCount, skyCount };
  }, [history.observations]);

  if (accountScreen === 'privacy') {
    return <PrivacyScreen email={email} onBack={() => setAccountScreen(null)} />;
  }
  if (accountScreen === 'permissions') {
    return <DevicePermissionsScreen onBack={() => setAccountScreen(null)} />;
  }
  if (accountScreen === 'about') {
    return <AboutScreen onBack={() => setAccountScreen(null)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="pb-8" keyboardShouldPersistTaps="handled">
          <ImageBackground resizeMode="cover" source={backgroundImage}>
            <View className="gap-2 bg-canvas/40 px-5 pb-6 pt-5">
              {editing ? (
                <Pressable
                  accessibilityLabel="Voltar ao perfil"
                  accessibilityRole="button"
                  className="mb-1 h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
                  onPress={() => setEditing(false)}
                >
                  <Lucide color={theme.colors.text} name="chevron-left" size={19} />
                </Pressable>
              ) : null}
              <Text className="font-label text-[11px] uppercase tracking-[3px] text-accent">
                VeronicaLens
              </Text>
              <Text accessibilityRole="header" className="font-display text-[32px] text-ink">
                {editing ? (
                  <>
                    Editar <Text className="text-accent">perfil</Text>
                  </>
                ) : (
                  'Perfil'
                )}
              </Text>
              <Text className="font-body text-sm leading-5 text-muted">
                {editing
                  ? 'Personalize suas informações e deixe sua jornada ainda mais sua.'
                  : 'Sua jornada pelo universo começa aqui.'}
              </Text>
            </View>
          </ImageBackground>

          <View className="gap-7 px-5 pt-6">
            {loading ? (
              <View className="items-center gap-3 rounded-card bg-surface p-8">
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="font-body text-sm text-muted">Carregando preferências...</Text>
              </View>
            ) : !profile ? (
              <View className="gap-4 rounded-card bg-surface p-5">
                <Text accessibilityLiveRegion="polite" className="font-body text-sm text-muted">
                  {error ?? 'Perfil indisponível.'}
                </Text>
                <Button label="Tentar novamente" onPress={() => void load()} variant="secondary" />
              </View>
            ) : editing ? (
              <View className="gap-5">
                <View className="gap-4 rounded-card bg-surface p-5">
                  <View className="items-center pb-2">
                    <View>
                      <Avatar avatarUrl={profile.avatarUrl} initial={initial} size={80} />
                      {uploadingAvatar ? (
                        <View className="absolute inset-0 items-center justify-center rounded-full bg-canvas/60">
                          <ActivityIndicator color={theme.colors.text} />
                        </View>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityLabel="Alterar foto de perfil"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: uploadingAvatar }}
                      className="absolute bottom-0 right-[calc(50%-40px)] h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 active:opacity-80"
                      disabled={uploadingAvatar}
                      onPress={() => void pickAvatar()}
                    >
                      <Lucide color={theme.colors.muted} name="camera" size={14} />
                    </Pressable>
                  </View>
                  {photoMessage ? (
                    <Text className="text-center font-body text-xs text-muted">{photoMessage}</Text>
                  ) : null}
                  <TextField
                    icon="user"
                    label="Nome"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Como devemos chamar você?"
                  />
                  <TextField
                    icon="map-pin"
                    label="Local"
                    value={locationName}
                    onChangeText={setLocationName}
                    placeholder="Ex.: São Paulo"
                  />
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextField
                        icon="locate-fixed"
                        label="Latitude"
                        value={latitude}
                        onChangeText={setLatitude}
                        keyboardType="numbers-and-punctuation"
                        placeholder="-23.5505"
                      />
                    </View>
                    <View className="flex-1">
                      <TextField
                        icon="locate-fixed"
                        label="Longitude"
                        value={longitude}
                        onChangeText={setLongitude}
                        keyboardType="numbers-and-punctuation"
                        placeholder="-46.6333"
                      />
                    </View>
                  </View>
                </View>
                {(formError || error) && (
                  <Text accessibilityLiveRegion="polite" className="font-body text-sm text-event">
                    {formError ?? error}
                  </Text>
                )}
                <Button
                  busy={saving}
                  icon="arrow-right"
                  label="Salvar alterações"
                  onPress={() => void handleSave()}
                />
                <Button
                  label="Cancelar"
                  disabled={saving}
                  onPress={() => setEditing(false)}
                  variant="ghost"
                />
              </View>
            ) : (
              <>
                <View className="flex-row items-center gap-4">
                  <Avatar avatarUrl={profile.avatarUrl} initial={initial} size={56} />
                  <View className="flex-1 gap-1">
                    <Text className="font-label text-base text-ink">
                      {profile.displayName ?? 'Exploradora do céu'}
                    </Text>
                    <Text className="font-body text-[11px] text-muted">
                      {profile.locationName ?? email}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    className="min-w-[76px] flex-row items-center justify-center gap-2 rounded-pill bg-[#292354] px-4 py-2 active:opacity-80"
                    onPress={() => setEditing(true)}
                  >
                    <Lucide color={theme.colors.accent} name="pencil" size={12} />
                    <Text className="font-label text-[10px] text-accent">Editar</Text>
                  </Pressable>
                </View>

                <View className="flex-row gap-3">
                  <StatCard
                    icon="telescope"
                    label="Observações"
                    onPress={onOpenHistory}
                    value={stats.total}
                  />
                  <StatCard
                    icon="moon"
                    label="Astrofoto de Lua"
                    onPress={onOpenHistory}
                    value={stats.moonCount}
                  />
                  <StatCard
                    icon="sparkles"
                    label="Astrofoto de céu"
                    onPress={onOpenHistory}
                    value={stats.skyCount}
                  />
                </View>

                <View className="gap-3">
                  <Text className="font-label text-base text-ink">Preferências</Text>
                  <PreferenceRow
                    disabled
                    icon="moon"
                    iconColor={theme.colors.accent}
                    title="Modo noturno"
                    subtitle="Preservar visão noturna"
                    value
                  />
                  <PreferenceRow
                    icon="bell"
                    iconColor={theme.colors.info}
                    title="Notificações"
                    subtitle="Eventos e janelas ideais"
                    value={profile.notificationsEnabled}
                    onChange={(value) => void persistNotifications(value)}
                  />
                  <PreferenceRow
                    icon="map-pin"
                    iconColor={theme.colors.info}
                    title="Localização"
                    subtitle={profile.locationName ?? 'Usar durante observação'}
                    value={profile.latitude !== null && profile.longitude !== null}
                    onChange={(value) => void changeLocation(value)}
                  />
                  {profile.notificationsEnabled ? (
                    <View className="gap-3 pt-1">
                      <Text className="font-label text-xs text-ink">Alertas de eventos</Text>
                      {eventPreferences.preferences.map((preference) => (
                        <PreferenceRow
                          key={preference.eventType}
                          disabled={eventPreferences.saving}
                          icon="calendar-clock"
                          iconColor={theme.colors.accent}
                          title={eventLabel(preference.eventType)}
                          subtitle={`Avisar ${preference.leadMinutes} min antes`}
                          value={preference.enabled}
                          onChange={(value) =>
                            void eventPreferences.setEnabled(preference.eventType, value)
                          }
                        />
                      ))}
                      {eventPreferences.error ? (
                        <Text
                          accessibilityLiveRegion="polite"
                          className="font-body text-xs text-event"
                        >
                          {eventPreferences.error}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {saving && <ActivityIndicator color={theme.colors.primary} />}
                  {error && (
                    <Text accessibilityLiveRegion="polite" className="font-body text-xs text-event">
                      {error}
                    </Text>
                  )}
                  {saved && (
                    <Text accessibilityLiveRegion="polite" className="font-body text-xs text-info">
                      Preferências salvas.
                    </Text>
                  )}
                </View>

                <View className="gap-3">
                  <Text className="font-label text-base text-ink">Conta e privacidade</Text>
                  <MenuRow
                    icon="shield-check"
                    label="Dados e privacidade"
                    onPress={() => setAccountScreen('privacy')}
                  />
                  <MenuRow
                    icon="smartphone"
                    label="Permissões do dispositivo"
                    onPress={() => setAccountScreen('permissions')}
                  />
                  <MenuRow
                    icon="info"
                    label="Sobre o VeronicaLens"
                    onPress={() => setAccountScreen('about')}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ busy: loggingOut, disabled: loggingOut }}
                    className="mt-2 min-h-12 flex-row items-center justify-center gap-2 rounded-pill border border-border bg-surface active:opacity-75"
                    disabled={loggingOut}
                    onPress={() => {
                      setLoggingOut(true);
                      void onLogout()
                        .catch(() => undefined)
                        .finally(() => setLoggingOut(false));
                    }}
                  >
                    {loggingOut ? (
                      <ActivityIndicator color={theme.colors.event} />
                    ) : (
                      <>
                        <Lucide color={theme.colors.event} name="log-out" size={17} />
                        <Text className="font-label text-xs text-event">Sair da conta</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function eventLabel(eventType: string): string {
  return (
    {
      rise: 'Nascer de astros',
      transit: 'Trânsito de astros',
      set: 'Ocaso de astros',
    }[eventType] ?? eventType
  );
}
