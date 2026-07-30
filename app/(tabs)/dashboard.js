import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { useAppState } from '../../src/navigation/AppStateContext';
import { pathForScreen } from '../../src/navigation/routes';

export default function DashboardRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const state = useAppState();

  return (
    <DashboardScreen
      theme={state.theme}
      setScreen={(screen) => router.replace(pathForScreen(screen))}
      patients={state.patients}
      appointments={state.appointments}
      dashboardData={state.dashboardData}
      setSheet={state.setSheet}
      compact={width < 390}
    />
  );
}
