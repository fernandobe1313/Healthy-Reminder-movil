import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { days } from '../data/mock-data';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { AppointmentCard, GradientButton, IconBadge } from '../components/common';

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const fullDayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function toStoredDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseStoredDate(value = '') {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function startOfWeek(value) {
  const date = new Date(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildWeek(value) {
  const monday = startOfWeek(value);
  return days.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      label,
      dayNumber: date.getDate(),
      month: monthNames[date.getMonth()],
      stored: toStoredDate(date),
      raw: date,
    };
  });
}

function formatAgendaDate(value = '') {
  const date = parseStoredDate(value);
  return `${fullDayNames[date.getDay()]} ${date.getDate()} de ${monthNames[date.getMonth()]}`;
}

function assignedAppointmentDate(item, index, weekDates) {
  return item.date || weekDates[index % weekDates.length]?.stored || '';
}

export function AgendaScreen({ theme, appointments, selectedDay, setSelectedDay, selectedAgendaDate, setSelectedAgendaDate, setSheet }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const activeDate = selectedAgendaDate || toStoredDate(new Date());
  const parsedActiveDate = parseStoredDate(activeDate);
  const weekDates = useMemo(() => buildWeek(parsedActiveDate), [activeDate]);
  const visibleAppointments = appointments.filter((item, index) => assignedAppointmentDate(item, index, weekDates) === activeDate);
  const visibleCount = visibleAppointments.length;

  useEffect(() => {
    if (!selectedAgendaDate) setSelectedAgendaDate(activeDate);
    const activeWeekDay = weekDates.find((day) => day.stored === activeDate);
    if (activeWeekDay && activeWeekDay.label !== selectedDay) setSelectedDay(activeWeekDay.label);
  }, [activeDate, selectedAgendaDate, selectedDay, setSelectedAgendaDate, setSelectedDay, weekDates]);

  const selectDate = (date) => {
    const stored = toStoredDate(date);
    const nextWeek = buildWeek(date);
    const nextDay = nextWeek.find((item) => item.stored === stored);
    setSelectedAgendaDate(stored);
    if (nextDay) setSelectedDay(nextDay.label);
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.calendarJumpCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <View style={{ flex: 1 }}>
            <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Buscar fecha</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{formatAgendaDate(activeDate)}</Text>
          </View>
          <Pressable
            onPress={() => setCalendarOpen(true)}
            style={({ pressed }) => [styles.calendarJumpButton, { backgroundColor: colors.blue }, pressed && styles.pressed]}>
            <Text style={styles.calendarJumpIcon}>Cal</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {weekDates.map((day) => (
            <Pressable
              key={day.stored}
              onPress={() => {
                setSelectedDay(day.label);
                setSelectedAgendaDate(day.stored);
              }}
              style={[styles.dayPill, { backgroundColor: activeDate === day.stored ? colors.blue : theme.card, borderColor: theme.line }]}>
              <Text style={[styles.dayName, { color: activeDate === day.stored ? '#ffffff' : theme.muted }]}>{day.label}</Text>
              <Text style={[styles.dayNum, { color: activeDate === day.stored ? '#ffffff' : theme.text }]}>{day.dayNumber}</Text>
              <Text style={[styles.dayMonth, { color: activeDate === day.stored ? '#dbeafe' : theme.soft }]}>{day.month}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.scheduleHero, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <IconBadge icon="C" color={colors.purple} />
          <View style={{ flex: 1 }}>
            <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Agenda organizada</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{visibleCount} citas para {selectedDay}. {formatAgendaDate(activeDate)}</Text>
          </View>
          <Pressable onPress={() => setSheet({ type: 'appointment', data: { date: activeDate } })} style={styles.miniAdd}>
            <Text style={styles.miniAddText}>+</Text>
          </Pressable>
        </View>

        <View style={{ gap: 12 }}>
          {visibleAppointments.length ? (
            visibleAppointments.map((item) => <AppointmentCard key={item.id} item={item} theme={theme} detailed />)
          ) : (
            <View style={[styles.detailBand, { backgroundColor: theme.card }]}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Sin citas en esta fecha</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Puedes crear una nueva cita con el boton +.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setCalendarOpen(false)} />
        <View style={[styles.datePickerCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Ir a fecha</Text>
          <DateTimePicker
            value={parsedActiveDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            themeVariant={theme.name === 'dark' ? 'dark' : 'light'}
            accentColor={colors.blue}
            onChange={(event, date) => {
              if (date) selectDate(date);
              if (Platform.OS === 'android') setCalendarOpen(false);
            }}
          />
          <GradientButton label="Listo" onPress={() => setCalendarOpen(false)} right="" />
        </View>
      </Modal>
    </>
  );
}
