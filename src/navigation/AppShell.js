import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionSheet } from '../components/ActionSheet';
import { BottomNav } from '../components/BottomNav';
import { SoftOrb } from '../components/common';
import { styles } from '../styles';
import { colors } from '../theme/palette';
import { useAppState } from './AppStateContext';
import { pathForScreen, screenFromPath, titleByScreen } from './routes';

function BackIcon({ color }) {
  return (
    <View style={styles.backIcon}>
      <View style={[styles.backIconLine, styles.backIconLineTop, { backgroundColor: color }]} />
      <View style={[styles.backIconLine, styles.backIconLineBottom, { backgroundColor: color }]} />
    </View>
  );
}

export function BellIcon({ color }) {
  return (
    <View style={styles.bellIcon}>
      <View style={[styles.bellHandle, { borderColor: color }]} />
      <View style={[styles.bellDome, { borderColor: color }]} />
      <View style={[styles.bellBase, { backgroundColor: color }]} />
      <View style={[styles.bellClapper, { backgroundColor: color }]} />
    </View>
  );
}

export function SunIcon({ color }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <View style={styles.themeIcon}>
      <View style={[styles.sunIconCore, { borderColor: color }]} />
      {rays.map((degree) => (
        <View
          key={degree}
          style={[
            styles.sunRay,
            { backgroundColor: color, transform: [{ rotate: `${degree}deg` }, { translateY: -12 }] },
          ]}
        />
      ))}
    </View>
  );
}

export function MoonIcon({ color, cutoutColor }) {
  return (
    <View style={styles.themeIcon}>
      <View style={[styles.moonIcon, { backgroundColor: color }]} />
      <View style={[styles.moonCutout, { backgroundColor: cutoutColor }]} />
    </View>
  );
}

export function AppShell() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const activeScreen = screenFromPath(pathname);
  const canGoBack = activeScreen !== 'dashboard';
  const activeTitle = titleByScreen[activeScreen] || 'Dashboard';
  const state = useAppState();
  const { theme } = state;

  const navigateToScreen = (screen) => {
    router.replace(pathForScreen(screen));
  };

  return (
    <View style={[styles.appRoot, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <SoftOrb color={theme.name === 'dark' ? '#172554' : '#dbeafe'} style={{ top: -90, right: -80, width: 190, height: 190 }} />
      <View
        style={[
          styles.appHeader,
          {
            backgroundColor: theme.veil,
            borderColor: theme.line,
            paddingTop: Math.max(18, insets.top + 10),
            paddingHorizontal: compact ? 14 : 18,
          },
        ]}>
        <View style={styles.headerLeft}>
          {canGoBack ? (
            <Pressable
              onPress={() => navigateToScreen('dashboard')}
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: theme.line, backgroundColor: theme.input },
                pressed && styles.pressed,
              ]}>
              <BackIcon color={colors.blue} />
            </Pressable>
          ) : null}
          <View>
            <Text selectable style={[styles.headerTitle, { color: theme.text }]}>{activeTitle}</Text>
            <Text selectable style={[styles.headerMeta, { color: theme.muted }]}>lun 6 de jul</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={state.openNotifications}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: theme.input, borderColor: theme.line },
              pressed && styles.pressed,
            ]}>
            <BellIcon color={theme.text} />
            {state.notificationItems.length ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{state.notificationItems.length}</Text></View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => state.setThemeMode(theme.name === 'dark' ? 'light' : 'dark')}
            style={({ pressed }) => [
              styles.roundButton,
              { backgroundColor: theme.input, borderColor: theme.line },
              pressed && styles.pressed,
            ]}>
            {theme.name === 'dark' ? (
              <SunIcon color={colors.amber} />
            ) : (
              <MoonIcon color={colors.blue} cutoutColor={theme.input} />
            )}
          </Pressable>
        </View>
      </View>

      <Slot />

      <BottomNav theme={theme} active={activeScreen} setScreen={navigateToScreen} bottomInset={insets.bottom} compact={compact} />
      <ActionSheet
        theme={theme}
        sheet={state.sheet}
        patients={state.patients}
        onClose={() => state.setSheet(null)}
        onAddPatient={state.addPatient}
        onAddAppointment={state.addAppointment}
        onAddReminder={state.addReminder}
        onDeleteReminder={state.deleteReminder}
        onRegisterPayment={state.registerPayment}
        onAddPaymentInstallment={state.addPaymentInstallment}
        onDeletePayment={state.deletePayment}
        onUpdatePatient={state.updatePatient}
        onDeletePatient={state.deletePatient}
        onOpenPatientEdit={(patient) => state.setSheet({ type: 'patientEdit', data: patient })}
        onOpenNotificationTarget={(target) => {
          state.setSheet(null);
          if (target) navigateToScreen(target);
        }}
        notify={state.notify}
      />
      {state.toast ? (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: theme.name === 'dark' ? '#e8ecf4' : '#0f172a',
              bottom: Math.max(96, insets.bottom + 94),
            },
          ]}>
          <Text style={[styles.toastText, { color: theme.name === 'dark' ? '#0f172a' : '#ffffff' }]}>{state.toast}</Text>
        </View>
      ) : null}
    </View>
  );
}
