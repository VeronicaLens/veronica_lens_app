import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { checkSupabaseConnectivity } from '../../../shared/api/index.ts';
interface HomePageProps {
  displayName: string | null;
  email: string;
}

export function HomePage({ displayName, email }: HomePageProps) {
  const [connectionStatus, setConnectionStatus] = useState('Validando conexão segura...');

  useEffect(() => {
    checkSupabaseConnectivity()
      .then(({ status }) => setConnectionStatus(`Supabase: ${status}`))
      .catch((error: unknown) => {
        setConnectionStatus(
          error instanceof Error ? error.message : 'Não foi possível validar a conexão.',
        );
      });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 px-6 py-8">
        <View className="gap-8">
          <View className="gap-2">
            <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
              VeronicaLens
            </Text>
            <Text accessibilityRole="header" className="font-display text-[32px] text-ink">
              Descubra o céu.
            </Text>
            <Text className="font-body text-sm leading-5 text-muted">
              Olá, {displayName ?? email}. Sua experiência de observação está pronta.
            </Text>
          </View>

          <View className="gap-3 rounded-card border border-border bg-surface p-5">
            <Text className="font-display text-[22px] text-ink">Conexão segura</Text>
            <View className="flex-row items-center gap-3">
              <View className="h-2.5 w-2.5 rounded-full bg-info" />
              <Text
                accessibilityLiveRegion="polite"
                className="flex-1 font-body text-sm text-muted"
              >
                {connectionStatus}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
