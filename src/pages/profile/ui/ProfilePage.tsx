import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import type { AppLanguage, MeasurementUnit, Profile } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { Button, TextField } from '../../../shared/ui/index.ts';

interface ProfilePageProps {
  accessToken: string;
  email: string;
  onBack(): void;
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
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  disabled?: boolean;
  onChange?(value: boolean): void;
}) {
  return (
    <View className="min-h-[62px] flex-row items-center gap-3 rounded-control bg-surface px-4 py-3">
      <Text className="w-5 text-center text-base" style={{ color: iconColor }}>
        {icon}
      </Text>
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

function MenuRow({ label }: { label: string }) {
  return (
    <View
      accessibilityLabel={`${label}. Disponível em breve.`}
      accessibilityState={{ disabled: true }}
      className="min-h-[48px] flex-row items-center rounded-control bg-surface px-4"
    >
      <Text className="flex-1 font-body text-xs text-ink">{label}</Text>
      <Text className="font-body text-lg text-muted">›</Text>
    </View>
  );
}

function NavigationItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress, selected: active }}
      className="flex-1 items-center gap-1 py-2"
      disabled={!onPress}
      onPress={onPress}
    >
      <Text className={`text-base ${active ? 'text-accent' : 'text-muted'}`}>{icon}</Text>
      <Text className={`font-body text-[9px] ${active ? 'text-accent' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function Choice<T extends string>({
  value,
  selected,
  label,
  onSelect,
}: {
  value: T;
  selected: boolean;
  label: string;
  onSelect(value: T): void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`flex-1 items-center rounded-pill border px-3 py-3 ${selected ? 'border-brand bg-brand' : 'border-border bg-surface-2'}`}
      onPress={() => onSelect(value)}
    >
      <Text className="font-label text-xs text-ink">{label}</Text>
    </Pressable>
  );
}

export function ProfilePage({ accessToken, email, onBack, onSaved }: ProfilePageProps) {
  const { profile, loading, saving, error, load, save } = useProfile(accessToken);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('metric');
  const [language, setLanguage] = useState<AppLanguage>('pt-BR');
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
    setNotificationsEnabled(value);
    const updated = await save({ notificationsEnabled: value });
    if (updated) onSaved(updated);
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

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="gap-7 px-5 pb-28 pt-5"
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
            Perfil
          </Text>

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
                <Text className="font-display text-lg text-ink">Editar perfil</Text>
                <TextField
                  label="Nome"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Como devemos chamar você?"
                />
                <TextField
                  label="Local"
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="Ex.: São Paulo"
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextField
                      label="Latitude"
                      value={latitude}
                      onChangeText={setLatitude}
                      keyboardType="numbers-and-punctuation"
                      placeholder="-23.5505"
                    />
                  </View>
                  <View className="flex-1">
                    <TextField
                      label="Longitude"
                      value={longitude}
                      onChangeText={setLongitude}
                      keyboardType="numbers-and-punctuation"
                      placeholder="-46.6333"
                    />
                  </View>
                </View>
                <Text className="font-label text-[11px] uppercase tracking-wide text-accent">
                  Unidades
                </Text>
                <View accessibilityRole="radiogroup" className="flex-row gap-2">
                  <Choice<MeasurementUnit>
                    value="metric"
                    label="Métricas"
                    selected={measurementUnit === 'metric'}
                    onSelect={setMeasurementUnit}
                  />
                  <Choice<MeasurementUnit>
                    value="imperial"
                    label="Imperiais"
                    selected={measurementUnit === 'imperial'}
                    onSelect={setMeasurementUnit}
                  />
                </View>
                <Text className="font-label text-[11px] uppercase tracking-wide text-accent">
                  Idioma
                </Text>
                <View accessibilityRole="radiogroup" className="flex-row gap-2">
                  <Choice<AppLanguage>
                    value="pt-BR"
                    label="Português"
                    selected={language === 'pt-BR'}
                    onSelect={setLanguage}
                  />
                  <Choice<AppLanguage>
                    value="en"
                    label="English"
                    selected={language === 'en'}
                    onSelect={setLanguage}
                  />
                </View>
              </View>
              {(formError || error) && (
                <Text accessibilityLiveRegion="polite" className="font-body text-sm text-event">
                  {formError ?? error}
                </Text>
              )}
              <Button label="Salvar alterações" busy={saving} onPress={() => void handleSave()} />
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
                <View className="h-14 w-14 items-center justify-center rounded-full bg-elevated">
                  <Text className="font-display text-xl text-accent">{initial}</Text>
                </View>
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
                  className="min-w-[66px] items-center rounded-pill bg-[#292354] px-4 py-2 active:opacity-80"
                  onPress={() => setEditing(true)}
                >
                  <Text className="font-label text-[10px] text-accent">Editar</Text>
                </Pressable>
              </View>

              <View className="gap-3">
                <Text className="font-label text-base text-ink">Preferências</Text>
                <PreferenceRow
                  disabled
                  icon="◐"
                  iconColor={theme.colors.accent}
                  title="Modo noturno"
                  subtitle="Preservar visão noturna"
                  value
                />
                <PreferenceRow
                  icon="◇"
                  iconColor={theme.colors.info}
                  title="Notificações"
                  subtitle="Eventos e janelas ideais"
                  value={profile.notificationsEnabled}
                  onChange={(value) => void persistNotifications(value)}
                />
                <PreferenceRow
                  icon="⌖"
                  iconColor={theme.colors.info}
                  title="Localização"
                  subtitle={profile.locationName ?? 'Usar durante observação'}
                  value={profile.latitude !== null && profile.longitude !== null}
                  onChange={(value) => void changeLocation(value)}
                />
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
                <MenuRow label="Dados e privacidade" />
                <MenuRow label="Permissões do dispositivo" />
                <MenuRow label="Sobre o VeronicaLens" />
              </View>
            </>
          )}
        </ScrollView>

        {!editing && (
          <View className="absolute inset-x-0 bottom-0 flex-row border-t border-border bg-surface px-2 pb-1 pt-1">
            <NavigationItem icon="⌂" label="Início" onPress={onBack} />
            <NavigationItem icon="✦" label="Explorar" />
            <NavigationItem icon="◉" label="Câmera" />
            <NavigationItem icon="◇" label="Aprender" />
            <NavigationItem active icon="○" label="Perfil" />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
