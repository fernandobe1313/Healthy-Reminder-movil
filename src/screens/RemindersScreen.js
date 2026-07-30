import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { GradientButton, IconBadge, LedText } from '../components/common';
import { formatDisplayDate } from '../components/PatientForm';

const reminderFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'Pendiente', label: 'Pendientes' },
  { value: 'Enviado', label: 'Enviados' },
];

function statusTone(status = '') {
  return status === 'Enviado' ? colors.green : colors.amber;
}

function TrashIcon() {
  return (
    <View style={styles.trashIcon}>
      <View style={styles.trashLid} />
      <View style={styles.trashHandle} />
      <View style={styles.trashCan}>
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
      </View>
    </View>
  );
}

function reminderDateLine(reminder = {}) {
  const date = reminder.date ? formatDisplayDate(reminder.date) : '';
  const time = reminder.time || '';
  return [date, time].filter(Boolean).join(' - ') || reminder.time || 'Sin programar';
}

export function RemindersScreen({ theme, reminders, setSheet, onSendReminder, onMarkReminderSent, onCopyReminder, onRefreshReminders }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilter = reminderFilters.find((item) => item.value === statusFilter) || reminderFilters[0];
  const filteredReminders = useMemo(
    () => reminders.filter((reminder) => statusFilter === 'all' || reminder.status === statusFilter),
    [reminders, statusFilter]
  );
  const pendingCount = reminders.filter((reminder) => reminder.status !== 'Enviado').length;
  const sentCount = reminders.filter((reminder) => reminder.status === 'Enviado').length;
  const filterCount = (value) => value === 'all' ? reminders.length : reminders.filter((reminder) => reminder.status === value).length;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.reminderHeaderBlock}>
        <View style={{ flex: 1 }}>
          <LedText selectable style={styles.heroEyebrow}>Recordatorios WhatsApp</LedText>
          <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>Mensajes listos para enviar a tus pacientes.</Text>
        </View>
        <GradientButton label="Crear" right="!" onPress={() => setSheet({ type: 'reminder' })} style={styles.heroButton} />
      </View>

      <View style={styles.paymentMetricRow}>
        <View style={[styles.paymentMetricCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Pendientes</Text>
          <Text selectable style={[styles.paymentMetricValue, { color: colors.amber }]}>{pendingCount}</Text>
        </View>
        <View style={[styles.paymentMetricCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Enviados</Text>
          <Text selectable style={[styles.paymentMetricValue, { color: colors.green }]}>{sentCount}</Text>
        </View>
      </View>

      <View style={[styles.paymentFilterCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.reminderFilterTop}>
          <View style={{ flex: 1 }}>
            <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Buscar por estado</Text>
            <Pressable
              onPress={() => setFilterOpen(true)}
              style={({ pressed }) => [
                styles.paymentFilterButton,
                { backgroundColor: theme.input, borderColor: theme.line },
                pressed && styles.pressed,
              ]}>
              <Text selectable numberOfLines={1} style={[styles.paymentFilterText, { color: theme.text }]}>{activeFilter.label}</Text>
              <Text selectable style={[styles.paymentFilterCount, { color: colors.blue }]}>{filterCount(statusFilter)}</Text>
              <Text style={[styles.selectChevron, { color: theme.muted }]}>v</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onRefreshReminders}
            style={({ pressed }) => [
              styles.reminderRefreshButton,
              { backgroundColor: theme.input, borderColor: theme.line },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.reminderRefreshText, { color: colors.blue }]}>R</Text>
          </Pressable>
        </View>
      </View>

      <LedText selectable style={styles.heroEyebrow}>Proximos avisos ({filteredReminders.length})</LedText>
      <View style={{ gap: 12 }}>
        {filteredReminders.length ? filteredReminders.map((reminder) => {
          const tone = statusTone(reminder.status);
          return (
            <Pressable
              key={reminder.id}
              onLongPress={() => setSheet({ type: 'reminderDetail', data: reminder })}
              delayLongPress={360}
              style={({ pressed }) => [
                styles.reminderCard,
                { backgroundColor: theme.card, borderColor: theme.line },
                pressed && styles.pressed,
              ]}>
              <IconBadge icon={reminder.status === 'Enviado' ? 'OK' : '!'} color={tone} />
              <View style={styles.reminderCardBody}>
                <View style={styles.reminderCardTop}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text selectable numberOfLines={1} style={[styles.cardTitle, { color: theme.text }]}>{reminder.patient || reminder.title}</Text>
                    <Text selectable numberOfLines={1} style={[styles.cardSub, { color: theme.muted }]}>{reminder.phone || 'Sin telefono'}</Text>
                  </View>
                  <Text style={[styles.smallChip, { color: tone, backgroundColor: `${tone}14` }]}>{reminder.status || 'Pendiente'}</Text>
                </View>
                <View style={[styles.reminderMessagePreview, { backgroundColor: theme.input }]}>
                  <Text selectable numberOfLines={3} style={[styles.cardSub, { color: theme.muted }]}>{reminder.message || reminder.title}</Text>
                </View>
                <Text selectable style={[styles.cardSub, { color: theme.soft }]}>{reminderDateLine(reminder)} - {reminder.type || reminder.area}</Text>
                <View style={styles.reminderActionRow}>
                  <Pressable
                    onPress={() => onSendReminder(reminder.id)}
                    style={({ pressed }) => [
                      styles.reminderPrimaryAction,
                      { backgroundColor: colors.blue, borderColor: colors.blue },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.reminderPrimaryActionText}>Enviar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onMarkReminderSent(reminder.id)}
                    style={({ pressed }) => [
                      styles.reminderSecondaryAction,
                      { backgroundColor: theme.input, borderColor: theme.line },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.reminderSecondaryActionText, { color: theme.text }]}>Ya envie</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onCopyReminder(reminder.id)}
                    style={({ pressed }) => [
                      styles.reminderSecondaryAction,
                      { backgroundColor: theme.input, borderColor: theme.line },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.reminderSecondaryActionText, { color: theme.text }]}>Copiar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSheet({ type: 'deleteReminder', data: reminder })}
                    hitSlop={10}
                    style={({ pressed }) => [styles.deletePatientButton, pressed && styles.pressed]}>
                    <TrashIcon />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }) : (
          <View style={[styles.detailBand, { backgroundColor: theme.card }]}>
            <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Sin recordatorios en este estado</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Cambia el filtro o crea un nuevo aviso.</Text>
          </View>
        )}
      </View>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setFilterOpen(false)} />
        <View style={[styles.selectorSheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
          <View style={styles.sheetHeader}>
            <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Estado del recordatorio</Text>
            <Pressable onPress={() => setFilterOpen(false)} hitSlop={12}>
              <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
            </Pressable>
          </View>
          <View style={styles.selectorListContent}>
            {reminderFilters.map((option) => {
              const active = statusFilter === option.value;
              const tone = option.value === 'all' ? colors.blue : statusTone(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setStatusFilter(option.value);
                    setFilterOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.selectorRow,
                    { backgroundColor: active ? `${tone}18` : theme.input, borderColor: active ? tone : theme.line },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.paymentFilterOptionRow}>
                    <Text selectable style={[styles.selectorLabel, { color: active ? tone : theme.text }]}>{option.label}</Text>
                    <Text selectable style={[styles.paymentFilterOptionCount, { color: tone, backgroundColor: `${tone}18` }]}>{filterCount(option.value)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

