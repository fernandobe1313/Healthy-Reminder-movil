import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../styles';
import { colors } from '../theme/palette';
import { ModuleIcon } from './ModuleIcon';

export function BottomNav({ theme, active, setScreen, bottomInset = 0, compact = false }) {
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: 'dashboard' },
    { id: 'patients', label: 'Pacientes', icon: 'patients' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar' },
    { id: 'clinical', label: 'Clinico', icon: 'tooth' },
    { id: 'more', label: 'Mas', icon: 'more' },
  ];
  const normalizedActive = ['payments', 'reminders', 'followups', 'assistant', 'settings'].includes(active) ? 'more' : active;

  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: theme.nav,
          borderColor: theme.line,
          bottom: Math.max(12, bottomInset + 8),
          left: compact ? 10 : 12,
          right: compact ? 10 : 12,
        },
      ]}>
      {items.map((item) => {
        const isActive = normalizedActive === item.id;
        return (
          <Pressable key={item.id} onPress={() => setScreen(item.id)} style={styles.navItem}>
            <View style={[styles.navIcon, { backgroundColor: isActive ? colors.blue : 'transparent' }]}>
              <ModuleIcon name={item.icon} color={isActive ? '#ffffff' : theme.soft} />
            </View>
            <Text style={[styles.navLabel, { color: isActive ? colors.blue : theme.soft }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
