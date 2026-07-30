import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { GradientButton, IconBadge } from '../components/common';

export function MoreScreen({ theme, setScreen, setSheet }) {
  const items = [
    { title: 'Seguimientos', subtitle: 'Recuperación y alertas clínicas', screen: 'followups', icon: 'S', color: colors.red },
    { title: 'Pagos', subtitle: 'Cobros y saldos', screen: 'payments', icon: '$', color: colors.green },
    { title: 'Recordatorios', subtitle: 'Alertas inteligentes', screen: 'reminders', icon: '!', color: colors.amber },
    { title: 'Asistente IA', subtitle: 'Notas clinicas rapidas', screen: 'assistant', icon: 'AI', color: colors.pink },
    { title: 'Ajustes', subtitle: 'Tema y consultorio', screen: 'settings', icon: 'A', color: colors.purple },
  ];
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <IconBadge icon="+" color={colors.blue} size={54} />
        <View style={{ flex: 1 }}>
          <Text selectable style={[styles.tipTitle, { color: theme.text }]}>Acciones rapidas</Text>
          <Text selectable style={[styles.tipCopy, { color: theme.muted }]}>Crea pacientes, citas o recordatorios desde una hoja inferior.</Text>
        </View>
      </View>
      <View style={styles.quickGrid}>
        <GradientButton label="Paciente" right="+" onPress={() => setSheet({ type: 'patient' })} style={styles.quickButton} />
        <GradientButton label="Cita" right="+" onPress={() => setSheet({ type: 'appointment' })} style={styles.quickButton} />
      </View>
      <View style={{ gap: 12 }}>
        {items.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => setScreen(item.screen)}
            style={({ pressed }) => [styles.moreCard, { backgroundColor: theme.card, borderColor: theme.line }, pressed && styles.pressed]}>
            <IconBadge icon={item.icon} color={item.color} />
            <View style={{ flex: 1 }}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{item.subtitle}</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.soft }]}>{'>'}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function SettingRow({ theme, title, subtitle, value, onValueChange }) {
  return (
    <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={{ flex: 1 }}>
        <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: theme.line, true: `${colors.blue}80` }} thumbColor={value ? colors.blue : '#f8fafc'} />
    </View>
  );
}

function AppointmentCard({ item, theme, detailed = false }) {
  return (
    <View style={[styles.appointmentCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={[styles.timeBlock, { backgroundColor: `${item.color}16` }]}>
        <Text selectable style={[styles.timeText, { color: item.color }]}>{item.time}</Text>
      </View>
      <View style={[styles.timeline, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{item.patient}</Text>
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{item.service}</Text>
        {detailed ? <Text selectable style={[styles.cardSub, { color: theme.soft }]}>Consultorio 1 - Dra. Sanchez</Text> : null}
      </View>
      <Text style={[styles.smallChip, { color: item.color, backgroundColor: `${item.color}14` }]}>{item.status}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onPress, theme }) {
  return (
    <View style={styles.sectionHeader}>
      <Text selectable style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
