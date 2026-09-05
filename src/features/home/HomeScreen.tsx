import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSupabaseClient } from '../../config/supabase';
import { checkSupabaseConnectivity } from '../../services/supabase/connectivity';
import { colors } from '../../theme/colors';

export function HomeScreen() {
  const [connectionStatus, setConnectionStatus] = useState('Validando conexão segura...');

  useEffect(() => {
    checkSupabaseConnectivity(getSupabaseClient())
      .then(({ status }) => setConnectionStatus(`Supabase: ${status}`))
      .catch((error: unknown) => {
        setConnectionStatus(
          error instanceof Error ? error.message : 'Não foi possível validar a conexão.',
        );
      });
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          VeronicaLens
        </Text>
        <Text style={styles.subtitle}>Fundação técnica do aplicativo configurada.</Text>
        <Text accessibilityLiveRegion="polite" style={styles.connectionStatus}>
          {connectionStatus}
        </Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  connectionStatus: {
    color: colors.mutedText,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});
