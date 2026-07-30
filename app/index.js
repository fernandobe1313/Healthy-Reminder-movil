import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { AuthScreen } from '../src/screens/AuthScreen';
import { useAppState } from '../src/navigation/AppStateContext';

export default function IndexRoute() {
  const { loggedIn, authLoading, currentRole, login, setThemeMode, theme } = useAppState();

  if (authLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}><ActivityIndicator /></View>;
  }

  if (loggedIn) return <Redirect href={currentRole === 'patient' ? '/patient-home' : '/dashboard'} />;

  return <AuthScreen theme={theme} setThemeMode={setThemeMode} onEnter={login} />;
}
