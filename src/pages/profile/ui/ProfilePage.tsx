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
    // The form is a local editable snapshot of the profile returned by the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(profile.displayName ?? '');
    setLocationName(profile.locationName ?? '');
    setLatitude(profile.latitude?.toString() ?? '');
    setLongitude(profile.longitude?.toString() ?? '');
    setNotificationsEnabled(profile.notificationsEnabled);
    setMeasurementUnit(profile.measurementUnit);
    setLanguage(profile.language);
  }, [profile]);

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
      onSaved(updated);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="gap-6 px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
              Sua conta
            </Text>
            <Text accessibilityRole="header" className="font-display text-[32px] text-ink">
              Perfil
            </Text>
            <Text className="font-body text-sm text-muted">{email}</Text>
          </View>

          {loading ? (
            <View className="items-center gap-3 rounded-card border border-border bg-surface p-8">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="font-body text-sm text-muted">Carregando preferências...</Text>
            </View>
          ) : !profile ? (
            <View className="gap-4 rounded-card border border-border bg-surface p-5">
              <Text accessibilityLiveRegion="polite" className="font-body text-sm text-muted">
                {error ?? 'Perfil indisponível.'}
              </Text>
              <Button label="Tentar novamente" onPress={() => void load()} variant="secondary" />
            </View>
          ) : (
            <View className="gap-6">
              <View className="gap-4 rounded-card border border-border bg-surface p-5">
                <Text className="font-display text-xl text-ink">Identidade</Text>
                <TextField
                  label="Nome"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Como devemos chamar você?"
                />
              </View>

              <View className="gap-4 rounded-card border border-border bg-surface p-5">
                <Text className="font-display text-xl text-ink">Local de observação</Text>
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
              </View>

              <View className="gap-5 rounded-card border border-border bg-surface p-5">
                <View className="flex-row items-center justify-between gap-4">
                  <View className="flex-1 gap-1">
                    <Text className="font-label text-sm text-ink">Notificações</Text>
                    <Text className="font-body text-xs text-muted">
                      Receber alertas astronômicos
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: theme.colors.surface2, true: theme.colors.primary }}
                    thumbColor={theme.colors.text}
                  />
                </View>
                <View className="gap-2">
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
                </View>
                <View className="gap-2">
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
              </View>

              {(formError || error) && (
                <Text accessibilityLiveRegion="polite" className="font-body text-sm text-event">
                  {formError ?? error}
                </Text>
              )}
              {saved && (
                <Text accessibilityLiveRegion="polite" className="font-body text-sm text-info">
                  Preferências salvas.
                </Text>
              )}
              <View className="gap-3">
                <Button label="Salvar alterações" busy={saving} onPress={() => void handleSave()} />
                <Button label="Voltar" disabled={saving} onPress={onBack} variant="ghost" />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
