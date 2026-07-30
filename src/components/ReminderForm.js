import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from '../styles';
import { colors } from '../theme/palette';
import { GradientButton, Input } from './common';
import { formatDisplayDate, parseSelectedDate } from './PatientForm';
import { toStoredDate } from './AppointmentForm';

const reminderTypes = [
  'Recordatorio 24h antes',
  'Confirmacion de cita',
  'Recordatorio de pago',
  'Seguimiento clinico',
  'Indicaciones postoperatorias',
  'Recordatorio personalizado',
];

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s+]/g, ' ')
    .toLocaleLowerCase('es-MX')
    .replace(/\s+/g, ' ')
    .trim();
}

function toStoredTime(value = new Date()) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function parseTime(value = '09:00') {
  const [hours = 9, minutes = 0] = String(value).split(':').map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}

function formatTime(value = '') {
  if (!value) return '';
  const [rawHours, rawMinutes] = value.split(':').map(Number);
  if (!Number.isFinite(rawHours) || !Number.isFinite(rawMinutes)) return value;
  const period = rawHours >= 12 ? 'p. m.' : 'a. m.';
  const hours = rawHours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(rawMinutes).padStart(2, '0')} ${period}`;
}

function SectionTitle({ children, theme }) {
  return (
    <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
      <Text selectable style={styles.formSectionTitle}>{children}</Text>
    </View>
  );
}

function SelectField({ label, value, placeholder, theme, icon, error, meta, onPress }) {
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.inputShell,
          styles.selectShell,
          { backgroundColor: theme.input, borderColor: error ? colors.red : theme.line },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.inputIcon, { color: theme.muted }]}>{icon}</Text>
        <View style={styles.selectValueWrap}>
          <Text selectable numberOfLines={1} style={[styles.selectValue, { color: value ? theme.text : theme.soft }]}>
            {value || placeholder}
          </Text>
        </View>
        {meta ? <Text selectable numberOfLines={1} style={[styles.selectMeta, { color: theme.muted }]}>{meta}</Text> : null}
        <Text style={[styles.selectChevron, { color: theme.muted }]}>v</Text>
      </Pressable>
      {error ? <Text selectable style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

function SearchableOptionSheet({ theme, selector, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery('');
  }, [selector]);

  const filtered = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return selector?.options || [];
    return (selector?.options || []).filter((option) =>
      normalizeSearchText(option.searchText || `${option.label} ${option.meta || ''}`).includes(term)
    );
  }, [query, selector]);

  return (
    <Modal visible={Boolean(selector)} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.selectorBackdrop} onPress={onClose} />
      <View style={[styles.selectorSheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
        <View style={styles.sheetHeader}>
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>{selector?.title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
          </Pressable>
        </View>
        <View style={[styles.searchBox, styles.selectorSearchBox, { backgroundColor: theme.input, borderColor: theme.line }]}>
          <Text style={[styles.searchIcon, { color: theme.muted }]}>?</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar..."
            placeholderTextColor={theme.soft}
            style={[styles.searchInput, { color: theme.text }]}
            autoCapitalize="none"
          />
        </View>
        <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorListContent} keyboardShouldPersistTaps="handled">
          {filtered.length ? (
            filtered.map((option) => (
              <Pressable
                key={String(option.value)}
                onPress={() => {
                  selector.onSelect(option);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.selectorRow,
                  { backgroundColor: option.active ? `${colors.blue}18` : theme.input, borderColor: option.active ? colors.blue : theme.line },
                  pressed && styles.pressed,
                ]}>
                <Text selectable numberOfLines={1} style={[styles.selectorLabel, { color: option.active ? colors.blue : theme.text }]}>
                  {option.label}
                </Text>
                {option.meta ? <Text selectable style={[styles.selectorMeta, { color: theme.muted }]}>{option.meta}</Text> : null}
              </Pressable>
            ))
          ) : (
            <View style={[styles.selectorEmpty, { backgroundColor: theme.input, borderColor: theme.line }]}>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>No hay opciones para esta busqueda.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function DateField({ theme, label, value, error, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.inputShell,
          styles.selectShell,
          { backgroundColor: theme.input, borderColor: error ? colors.red : theme.line },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.inputIcon, { color: colors.blue }]}>{'\uD83D\uDCC5'}</Text>
        <View style={styles.selectValueWrap}>
          <Text selectable numberOfLines={1} style={[styles.selectValue, { color: value ? theme.text : theme.soft }]}>
            {value ? formatDisplayDate(value) : 'dd/mm/aaaa'}
          </Text>
        </View>
        <Text style={[styles.selectChevron, { color: colors.blue }]}>+</Text>
      </Pressable>
      {error ? <Text selectable style={styles.inputError}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.datePickerCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Fecha del recordatorio</Text>
          <DateTimePicker
            value={parseSelectedDate(value || toStoredDate(new Date()))}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={(event, date) => {
              if (date) onChange(toStoredDate(date));
              if (Platform.OS === 'android') setOpen(false);
            }}
          />
          <GradientButton label="Listo" onPress={() => setOpen(false)} right="" />
        </View>
      </Modal>
    </View>
  );
}

function TimeField({ theme, label, value, error, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.inputShell,
          styles.selectShell,
          { backgroundColor: theme.input, borderColor: error ? colors.red : theme.line },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.inputIcon, { color: colors.purple }]}>{'\u23F0'}</Text>
        <View style={styles.selectValueWrap}>
          <Text selectable numberOfLines={1} style={[styles.selectValue, { color: value ? theme.text : theme.soft }]}>
            {value ? formatTime(value) : '--:--'}
          </Text>
        </View>
        <Text style={[styles.selectChevron, { color: colors.purple }]}>+</Text>
      </Pressable>
      {error ? <Text selectable style={styles.inputError}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.datePickerCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>{label}</Text>
          <DateTimePicker
            value={parseTime(value || '09:00')}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minuteInterval={5}
            onChange={(event, date) => {
              if (date) onChange(toStoredTime(date));
              if (Platform.OS === 'android') setOpen(false);
            }}
          />
          <GradientButton label="Listo" onPress={() => setOpen(false)} right="" />
        </View>
      </Modal>
    </View>
  );
}

export function buildReminderMessage({ patient = '', phone = '', type = 'Recordatorio 24h antes', date = '', time = '' } = {}) {
  const name = patient || 'paciente';
  const dateLine = date ? ` el ${formatDisplayDate(date)}` : '';
  const timeLine = time ? ` a las ${formatTime(time)}` : '';
  if (type === 'Recordatorio de pago') {
    return `Hola ${name}, te recordamos que tienes un saldo pendiente en HealthyReminder Dental. Puedes responder este mensaje si necesitas apoyo con tu pago.`;
  }
  if (type === 'Seguimiento clinico') {
    return `Hola ${name}, esperamos que te encuentres muy bien. Damos seguimiento a tu tratamiento y quedamos atentos a cualquier molestia o duda.`;
  }
  if (type === 'Indicaciones postoperatorias') {
    return `Hola ${name}, recuerda seguir tus indicaciones postoperatorias y contactarnos si presentas molestias fuera de lo esperado. HealthyReminder Dental.`;
  }
  return `Hola ${name}, te recordamos que tienes una cita programada en HealthyReminder Dental${dateLine}${timeLine}. Si tienes alguna duda, no dudes en contactarnos. Te esperamos.`;
}

export function ReminderForm({ theme, form, updateForm, errors, patients = [], notify }) {
  const [selector, setSelector] = useState(null);

  const patientOptions = useMemo(
    () =>
      patients.map((patient) => ({
        value: patient.id || patient.name,
        label: patient.name,
        meta: patient.phone || 'Sin telefono',
        searchText: `${patient.name} ${patient.phone || ''} ${patient.tag || ''}`,
        raw: patient,
        active: form.patient_id === patient.id || form.patient === patient.name,
      })),
    [patients, form.patient_id, form.patient]
  );

  const typeOptions = reminderTypes.map((type) => ({
    value: type,
    label: type,
    active: form.type === type,
  }));

  const generateMessage = () => {
    const message = buildReminderMessage(form);
    updateForm({
      title: form.title || (form.type === 'Recordatorio de pago' ? 'Recordatorio de pago' : `Recordatorio para ${form.patient || 'paciente'}`),
      message,
    });
    notify('Mensaje generado');
  };

  return (
    <>
      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Datos del recordatorio</SectionTitle>
        <SelectField
          label="Paciente *"
          value={form.patient}
          placeholder="Seleccione paciente"
          theme={theme}
          icon="P"
          error={errors.patient}
          onPress={() =>
            setSelector({
              title: 'Seleccionar paciente',
              options: patientOptions,
              onSelect: (option) => {
                const next = {
                  patient_id: option.raw.id,
                  patient: option.raw.name,
                  phone: option.raw.phone || '',
                };
                updateForm({
                  ...next,
                  message: form.message || buildReminderMessage({ ...form, ...next }),
                });
              },
            })
          }
        />
        <Input label="Titulo" value={form.title} onChangeText={(value) => updateForm('title', value)} theme={theme} icon="!" placeholder="Confirmar cita..." />
        <SelectField
          label="Tipo de recordatorio"
          value={form.type}
          placeholder="Seleccione tipo"
          theme={theme}
          icon="T"
          onPress={() =>
            setSelector({
              title: 'Tipo de recordatorio',
              options: typeOptions,
              onSelect: (option) => updateForm({ type: option.value, message: buildReminderMessage({ ...form, type: option.value }) }),
            })
          }
        />
        <Input label="Telefono *" value={form.phone} error={errors.phone} onChangeText={(value) => updateForm('phone', value)} theme={theme} icon="#" placeholder="55 0000 0000" keyboardType="phone-pad" maxLength={18} />
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Programacion</SectionTitle>
        <DateField theme={theme} label="Fecha" value={form.date} onChange={(value) => updateForm({ date: value, message: buildReminderMessage({ ...form, date: value }) })} />
        <TimeField theme={theme} label="Hora" value={form.time} onChange={(value) => updateForm({ time: value, message: buildReminderMessage({ ...form, time: value }) })} />
        <Pressable
          onPress={generateMessage}
          style={({ pressed }) => [
            styles.reminderAiButton,
            { backgroundColor: theme.input, borderColor: theme.line },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.reminderAiIcon, { color: colors.purple }]}>IA</Text>
          <Text selectable style={[styles.reminderAiText, { color: theme.text }]}>Generar con IA</Text>
        </Pressable>
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Mensaje</SectionTitle>
        <Input
          label="Mensaje *"
          value={form.message}
          error={errors.message}
          onChangeText={(value) => updateForm('message', value.slice(0, 300))}
          theme={theme}
          icon="M"
          placeholder="El mensaje se puede generar automaticamente..."
          multiline
        />
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{String(form.message || '').length}/300 caracteres</Text>
      </View>

      <SearchableOptionSheet theme={theme} selector={selector} onClose={() => setSelector(null)} />
    </>
  );
}

