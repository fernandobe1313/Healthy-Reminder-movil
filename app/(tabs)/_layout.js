import React from 'react';
import { Redirect } from 'expo-router';
import { AppShell } from '../../src/navigation/AppShell';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function TabsLayout() {
  const { loggedIn, currentRole } = useAppState();

  if (!loggedIn) return <Redirect href="/" />;
  if (currentRole === 'patient') return <Redirect href="/patient-home" />;

  return <AppShell />;
}
