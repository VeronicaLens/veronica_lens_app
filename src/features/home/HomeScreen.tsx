import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          VeronicaLens
        </Text>
        <Text style={styles.subtitle}>Fundação técnica do aplicativo configurada.</Text>
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
});
