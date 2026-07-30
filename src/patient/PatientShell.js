import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/palette';
import { useAppState } from '../navigation/AppStateContext';
import { LedText } from '../components/common';
import { BellIcon, MoonIcon, SunIcon } from '../navigation/AppShell';
import { ModuleIcon } from '../components/ModuleIcon';
import { patientStyles as s } from './patient-ui';

const routes = {
  'patient-home': '/patient-home',
  'patient-appointments': '/patient-appointments',
  'patient-health': '/patient-health',
  'patient-recovery': '/patient-recovery',
  'patient-payments': '/patient-payments',
  'patient-profile': '/patient-profile',
};

const items = [
  { id: 'patient-home', label: 'Inicio', icon: 'home' },
  { id: 'patient-appointments', label: 'Citas', icon: 'calendar' },
  { id: 'patient-health', label: 'Mi salud', icon: 'health' },
  { id: 'patient-recovery', label: 'Recuperación', icon: 'recovery' },
  { id: 'patient-payments', label: 'Pagos', icon: 'payments' },
  { id: 'patient-profile', label: 'Perfil', icon: 'profile' },
];

const titles = {
  'patient-home': 'Mi espacio',
  'patient-appointments': 'Mis citas',
  'patient-health': 'Mi salud dental',
  'patient-payments': 'Mis pagos',
  'patient-profile': 'Mi perfil',
  'patient-recovery': 'Mi recuperación',
};

export function PatientShell() {
  const state = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const active = pathname.replace(/^\/+/, '').split('/')[0] || 'patient-home';
  const patientNotifications = state.notificationItems;

  return (
    <View style={{ flex: 1, backgroundColor: state.theme.bg }}>
      <StatusBar style={state.theme.name === 'dark' ? 'light' : 'dark'} />
      <View style={[s.header, {
        paddingTop: Math.max(18, insets.top + 10),
        paddingHorizontal: 18,
        backgroundColor: state.theme.veil,
        borderColor: state.theme.line,
      }]}>
        <View>
          <LedText selectable style={s.headerTitle}>{titles[active] || 'HealthyReminder'}</LedText>
          <Text selectable style={[s.headerMeta, { color: state.theme.muted }]}>
            {state.currentPatient?.name || 'Paciente'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          <Pressable
            onPress={state.openNotifications}
            style={[s.headerButton, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}>
            <BellIcon color={state.theme.text} />
            {state.unreadNotificationCount ? (
              <View style={[s.badge, { backgroundColor: colors.red }]}>
                <Text style={s.badgeText}>{state.unreadNotificationCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => state.setThemeMode(state.theme.name === 'dark' ? 'light' : 'dark')}
            style={[s.headerButton, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}>
            {state.theme.name === 'dark' ? (
              <SunIcon color={colors.amber} />
            ) : (
              <MoonIcon color={colors.blue} cutoutColor={state.theme.input} />
            )}
          </Pressable>
        </View>
      </View>

      <Slot />

      <View style={[s.nav, {
        bottom: Math.max(10, insets.bottom + 7),
        backgroundColor: state.theme.nav,
        borderColor: state.theme.line,
      }]}>
        {items.map((item) => {
          const selected = active === item.id;
          return (
            <Pressable key={item.id} onPress={() => router.replace(routes[item.id])} style={s.navItem}>
              <View style={[s.navIcon, { backgroundColor: selected ? colors.blue : 'transparent' }]}>
                <ModuleIcon name={item.icon} color={selected ? '#fff' : state.theme.soft} />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={[s.navLabel, { color: selected ? colors.blue : state.theme.soft }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={state.sheet?.type === 'notifications'}
        transparent
        animationType="slide"
        onRequestClose={() => state.setSheet(null)}>
        <View style={s.modalRoot}>
          <ScrollView contentContainerStyle={[s.modalCard, { backgroundColor: state.theme.surface }]}>
            <View style={s.between}>
              <Text selectable style={[s.sectionTitle, { color: state.theme.text }]}>Notificaciones</Text>
              <Pressable onPress={() => state.setSheet(null)}>
                <Text style={{ color: state.theme.muted, fontSize: 22 }}>×</Text>
              </Pressable>
            </View>
            {patientNotifications.length ? patientNotifications.map((item) => (
              <Pressable
                key={item.id}
                onPress={async () => {
                  await state.markNotificationRead(item);
                  state.setSheet(null);
                  if (routes[item.target]) router.replace(routes[item.target]);
                }}
                style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line, opacity: item.is_read ? 0.62 : 1 }]}>
                <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{item.title}</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{item.body}</Text>
                {item.target ? <Text selectable style={[s.cardCopy, { color: colors.blue }]}>Abrir detalle</Text> : null}
              </Pressable>
            )) : (
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>No tienes notificaciones nuevas.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {state.toast ? (
        <View style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: Math.max(102, insets.bottom + 94),
          padding: 14,
          borderRadius: 16,
          backgroundColor: state.theme.name === 'dark' ? '#e8ecf4' : '#0f172a',
        }}>
          <Text style={{ color: state.theme.name === 'dark' ? '#0f172a' : '#fff', fontWeight: '800', textAlign: 'center' }}>{state.toast}</Text>
        </View>
      ) : null}
    </View>
  );
}
