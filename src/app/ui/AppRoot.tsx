import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getRecoveryAccessToken, useAuthSession } from '../../features/auth/index.ts';
import { getEventIdFromUrl } from '../../features/astronomical-events/index.ts';
import {
  clearStoredPushDevice,
  deactivateStoredPushDevice,
  getEventIdFromNotificationData,
} from '../../features/notifications/index.ts';
import { AuthPage } from '../../pages/auth/index.ts';
import { SkyGuidePage } from '../../pages/camera/index.ts';
import { EventsPage } from '../../pages/events/index.ts';
import { HomePage } from '../../pages/home/index.ts';
import { ObservationHistoryPage } from '../../pages/observation-history/index.ts';
import { ProfilePage } from '../../pages/profile/index.ts';
import { BottomNavigation, type AuthenticatedPage } from '../../widgets/bottom-navigation/index.ts';
import { LoadingScreen } from '../../widgets/loading-screen/index.ts';

export function AppRoot() {
  const auth = useAuthSession();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(false);
  const [recoveryAccessToken, setRecoveryAccessToken] = useState<string | null>(null);
  const [authenticatedPage, setAuthenticatedPage] = useState<AuthenticatedPage>('home');
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [notificationEventId, setNotificationEventId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingElapsed(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      setRecoveryAccessToken(getRecoveryAccessToken(url));
      const eventId = getEventIdFromUrl(url);
      if (eventId) {
        setNotificationEventId(eventId);
        setAuthenticatedPage('events');
      }
    };
    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      const eventId = getEventIdFromNotificationData(response?.notification.request.content.data);
      if (!eventId) return;
      setNotificationEventId(eventId);
      setAuthenticatedPage('events');
    };
    let active = true;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active) handleResponse(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (auth.status === 'anonymous') void clearStoredPushDevice();
  }, [auth.status]);

  return (
    <SafeAreaProvider>
      {!minLoadingElapsed || (!fontsLoaded && !fontError) ? (
        <LoadingScreen />
      ) : auth.status === 'restoring' ? (
        <LoadingScreen />
      ) : auth.status === 'authenticated' && auth.session ? (
        <View className="flex-1 bg-canvas">
          {authenticatedPage === 'profile' ? (
            <ProfilePage
              accessToken={auth.session.accessToken}
              email={auth.session.user.email}
              onLogout={async () => {
                setAuthenticatedPage('home');
                setProfileDisplayName(null);
                if (auth.session?.accessToken) {
                  await deactivateStoredPushDevice(auth.session.accessToken);
                }
                await auth.logout();
              }}
              onSaved={(profile) => setProfileDisplayName(profile.displayName)}
            />
          ) : authenticatedPage === 'history' ? (
            <ObservationHistoryPage accessToken={auth.session.accessToken} />
          ) : authenticatedPage === 'camera' ? (
            <SkyGuidePage
              accessToken={auth.session.accessToken}
              onClose={() => setAuthenticatedPage('home')}
            />
          ) : authenticatedPage === 'events' ? (
            <EventsPage
              accessToken={auth.session.accessToken}
              initialEventId={notificationEventId}
              onInitialEventHandled={() => setNotificationEventId(null)}
            />
          ) : (
            <HomePage
              accessToken={auth.session.accessToken}
              displayName={profileDisplayName ?? auth.session.user.displayName}
              email={auth.session.user.email}
              onOpenCamera={() => setAuthenticatedPage('camera')}
              onOpenEvents={() => setAuthenticatedPage('events')}
              onOpenHistory={() => setAuthenticatedPage('history')}
            />
          )}
          <BottomNavigation activePage={authenticatedPage} onNavigate={setAuthenticatedPage} />
        </View>
      ) : (
        <AuthPage
          key={recoveryAccessToken ?? 'authentication'}
          onGoogleSignIn={auth.authenticateWithGoogle}
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
