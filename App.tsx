import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import i18n from './src/i18n/index';
import AppNavigator from './src/navigation/index';
import { useAuthStore } from './src/store/authStore';
import { useBabyStore } from './src/store/babyStore';
import { revenueCat } from './src/services/subscription/revenueCat';
import { offlineQueue } from './src/services/offline/offlineQueue';
import {
  requestNotificationPermission,
  setupNotificationResponseHandler,
} from './src/services/notifications/notificationService';
import { ErrorBoundary, ToastProvider, OfflineBanner } from './src/components/common/index';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppRoot() {
  const { initialize, isAuthenticated, user } = useAuthStore();
  const { fetchBabies } = useBabyStore();

  useEffect(() => {
    const unsubscribe = initialize();

    SecureStore.getItemAsync('user_language').then((lang) => {
      if (lang) i18n.changeLanguage(lang);
    }).catch(() => {});

    revenueCat.initialize().catch(() => {});
    offlineQueue.init();
    requestNotificationPermission().catch(() => {});

    const cleanupNotifications = setupNotificationResponseHandler((screen) => {
      // Navigation will be available via ref once navigator mounts
      // This handler is stored and navigation is best-effort
      console.log('[Notifications] Tapped:', screen);
    });

    return () => {
      offlineQueue.destroy();
      cleanupNotifications();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBabies(user.uid);
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <AppNavigator />
      <OfflineBanner />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <ErrorBoundary>
            <ToastProvider>
              <AppRoot />
            </ToastProvider>
          </ErrorBoundary>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
