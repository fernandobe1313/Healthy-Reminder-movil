import React from 'react';
import { useRouter } from 'expo-router';
import { MoreScreen } from '../../src/screens/MoreScreen';
import { useAppState } from '../../src/navigation/AppStateContext';
import { pathForScreen } from '../../src/navigation/routes';

export default function MoreRoute() {
  const router = useRouter();
  const state = useAppState();

  return (
    <MoreScreen
      theme={state.theme}
      setScreen={(screen) => router.replace(pathForScreen(screen))}
      setSheet={state.setSheet}
    />
  );
}
