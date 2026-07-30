import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme/palette';
import { GradientButton, LedText } from '../components/common';
import { patientStyles as s } from './patient-ui';

export function StatusChip({ label, tone = colors.blue }) {
  return (
    <View style={[s.chip, { backgroundColor: `${tone}18` }]}>
      <Text selectable style={[s.chipText, { color: tone }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children, theme, action, onPress }) {
  return (
    <View style={s.between}>
      <LedText selectable style={s.sectionTitle}>{children}</LedText>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={{ color: colors.blue, fontSize: 13, fontWeight: '850' }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, tone = colors.blue, disabled = false, style }) {
  return <GradientButton label={label} right="" onPress={onPress} disabled={disabled} style={[{ minHeight: 44 }, style]} />;
}

export function OutlineButton({ label, onPress, theme, tone = colors.blue, style }) {
  return (
    <Pressable onPress={onPress} style={[s.outlineButton, { borderColor: `${tone}55`, backgroundColor: theme.input }, style]}>
      <Text style={[s.outlineText, { color: tone }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, copy, theme }) {
  return (
    <View style={[s.empty, { borderColor: theme.line, backgroundColor: theme.card }]}>
      <Text selectable style={[s.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text selectable style={[s.cardCopy, { color: theme.muted, textAlign: 'center' }]}>{copy}</Text>
    </View>
  );
}

export function money(value = 0) {
  return `$${Number(value || 0).toLocaleString('es-MX')} MXN`;
}

export function appointmentDate(item = {}) {
  return item.date || item.appointment_date || 'Fecha por confirmar';
}

export function toneForStatus(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('complet') || normalized.includes('pagad') || normalized.includes('confirm')) return colors.green;
  if (normalized.includes('cancel') || normalized.includes('rechaz')) return colors.red;
  if (normalized.includes('pend') || normalized.includes('solicit') || normalized.includes('parcial')) return colors.amber;
  return colors.blue;
}
