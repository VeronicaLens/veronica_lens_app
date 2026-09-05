import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getRecoveryAccessToken, useAuthSession } from '../../features/auth/index.ts';
import { AuthPage } from '../../pages/auth/index.ts';
import { HomePage } from '../../pages/home/index.ts';
import { ProfilePage } from '../../pages/profile/index.ts';
import { theme } from '../../shared/config/index.ts';

export function AppRoot() {
  const auth = useAuthSession();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [recoveryAccessToken, setRecoveryAccessToken] = useState<string | null>(null);
  const [authenticatedPage, setAuthenticatedPage] = useState<'home' | 'profile'>('home');
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  useEffect(() => {
    void Linking.getInitialURL().then((url) => setRecoveryAccessToken(getRecoveryAccessToken(url)));
    const subscription = Linking.addEventListener('url', ({ url }) => {
      setRecoveryAccessToken(getRecoveryAccessToken(url));
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      {!fontsLoaded && !fontError ? (
        <View className="flex-1 items-center justify-center bg-canvas">
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : auth.status === 'restoring' ? (
        <View className="flex-1 items-center justify-center bg-canvas">
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : auth.status === 'authenticated' && auth.session && authenticatedPage === 'profile' ? (
        <ProfilePage
          accessToken={auth.session.accessToken}
          email={auth.session.user.email}
          onBack={() => setAuthenticatedPage('home')}
          onSaved={(profile) => setProfileDisplayName(profile.displayName)}
        />
      ) : auth.status === 'authenticated' && auth.session ? (
        <HomePage
          displayName={profileDisplayName ?? auth.session.user.displayName}
          email={auth.session.user.email}
          onLogout={async () => {
            setAuthenticatedPage('home');
            setProfileDisplayName(null);
            await auth.logout();
          }}
          onOpenProfile={() => setAuthenticatedPage('profile')}
        />
      ) : (
        <AuthPage
          key={recoveryAccessToken ?? 'authentication'}
          recoveryAccessToken={recoveryAccessToken}
          onRequestRecovery={auth.requestPasswordRecovery}
          onResetComplete={() => setRecoveryAccessToken(null)}
          onSignIn={auth.authenticate}
          onSignUp={auth.register}
          onUpdatePassword={auth.updatePassword}
        />
      )}
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
