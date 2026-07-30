import React, { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '../src/navigation/AppStateContext';
import { VisualEffectsProvider } from '../src/theme/visual-effects';

function NotificationObserver() {
  useEffect(() => {
    if (process.env.EXPO_OS === 'web' || Constants.executionEnvironment === 'storeClient') return undefined;
    const Notifications = require('expo-notifications');
    const openTarget = (notification) => {
      const url = notification?.request?.content?.data?.url;
      if (typeof url === 'string') router.push(url);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) openTarget(last.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => openTarget(response.notification));
    return () => subscription.remove();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <VisualEffectsProvider>
        <AppStateProvider>
          <NotificationObserver />
          <Stack screenOptions={{ headerShown: false }} />
        </AppStateProvider>
      </VisualEffectsProvider>
    </SafeAreaProvider>
  );
}
