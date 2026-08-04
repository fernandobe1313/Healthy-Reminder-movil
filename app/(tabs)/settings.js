import React from 'react';
import { SettingsScreen } from '../../src/screens/SettingsScreen';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function SettingsRoute() {
  const state = useAppState();

  return (
    <SettingsScreen
      theme={state.theme}
      themeMode={state.themeMode}
      setThemeMode={state.setThemeMode}
      onLogout={state.logout}
      notify={state.notify}
      currentUser={state.currentUser}
      notificationsEnabled={state.staffNotificationsEnabled}
      setNotificationsEnabled={state.setStaffNotificationsEnabled}
      biometricEnabled={state.biometricEnabled}
      biometricCapability={state.biometricCapability}
      setBiometricEnabled={state.setBiometricEnabled}
    />
  );
}
