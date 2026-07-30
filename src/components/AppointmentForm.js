import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from '../styles';
import { colors } from '../theme/palette';
import { dentalServices } from '../data/services';
import { GradientButton, Input } from './common';
import { formatDisplayDate, parseSelectedDate } from './PatientForm';

const appointmentTypes = ['Consulta', 'Revision', 'Procedimiento', 'Urgencia', 'Control', 'Seguimiento'];
const appointmentStatuses = ['Confirmada', 'Pendiente', 'En sala', 'Completada', 'Cancelada'];
const rooms = ['Consultorio 1', 'Consultorio 2', 'Rayos X', 'Quirofano', 'Teleconsulta'];

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s+$]/g, ' ')
    .toLocaleLowerCase('es-MX')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toStoredDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTime(value = '09:00') {
  const [hours = 9, minutes = 0] = String(value).split(':').map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}

function toStoredTime(value = new Date()) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function timeToMinutes(value = '00:00') {
  const [hours = 0, minutes = 0] = String(value).split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function addMinutesToTime(value = '09:00', minutes = 30) {
  const date = parseTime(value);
  date.setMinutes(date.getMinutes() + Number(minutes || 0));
  return toStoredTime(date);
}

function formatTime(value = '') {
  if (!value) return '';
  const [rawHours, rawMinutes] = value.split(':').map(Number);
  if (!Number.isFinite(rawHours) || !Number.isFinite(rawMinutes)) return value;
  const period = rawHours >= 12 ? 'p. m.' : 'a. m.';
  const hours = rawHours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(rawMinutes).padStart(2, '0')} ${period}`;
}

function money(value = 0) {
  return `$${Number(value || 0).toLocaleString('en-US')}`;
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
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Fecha de cita</Text>
          <DateTimePicker
            value={parseSelectedDate(value || toStoredDate(new Date()))}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            minimumDate={new Date(2020, 0, 1)}
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
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>{label.replace(' *', '')}</Text>
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

export function AppointmentForm({ theme, form, updateForm, errors, patients = [] }) {
  const [selector, setSelector] = useState(null);

  const patientOptions = useMemo(
    () =>
      patients.map((patient) => ({
        value: patient.id || patient.name,
        label: patient.name,
        meta: patient.phone || 'Sin telefono',
        searchText: `${patient.name} ${patient.phone || ''} ${patient.tag || ''}`,
        raw: patient,
        active: form.patient_id === patient.id || form.name === patient.name,
      })),
    [patients, form.patient_id, form.name]
  );

  const serviceOptions = useMemo(
    () =>
      dentalServices.map((service) => ({
        value: service.id,
        label: `${service.name} - ${money(service.price)}`,
        meta: `${service.duration} min`,
        searchText: `${service.name} ${service.price} ${service.duration}`,
        raw: service,
        active: form.service_id === service.id || form.service === service.name,
      })),
    [form.service, form.service_id]
  );

  const openOptionSelector = (title, options, onSelect) => {
    setSelector({ title, options, onSelect });
  };

  const updateStartTime = (value) => {
    const duration = Number(form.duration || 30);
    updateForm({
      start_time: value,
      time: value,
      end_time: addMinutesToTime(value, duration || 30),
    });
  };

  const updateEndTime = (value) => {
    const diff = timeToMinutes(value) - timeToMinutes(form.start_time || form.time || '09:00');
    updateForm({
      end_time: value,
      duration: diff > 0 ? String(diff) : form.duration,
    });
  };

  const updateDuration = (value) => {
    const clean = String(value || '').replace(/\D/g, '').slice(0, 3);
    const minutes = Number(clean);
    updateForm({
      duration: clean,
      end_time: minutes ? addMinutesToTime(form.start_time || form.time || '09:00', minutes) : form.end_time,
    });
  };

  return (
    <>
      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Datos de agenda</SectionTitle>
        <SelectField
          label="Paciente *"
          value={form.name}
          placeholder="Seleccione paciente"
          theme={theme}
          icon="P"
          error={errors.name}
          onPress={() =>
            openOptionSelector('Seleccionar paciente', patientOptions, (option) =>
              updateForm({ patient_id: option.raw.id, name: option.raw.name, phone: option.raw.phone || '' })
            )
          }
        />
        <SelectField
          label="Servicio"
          value={form.service}
          placeholder="Seleccione servicio"
          theme={theme}
          icon="#"
          meta={form.service_price ? money(form.service_price) : ''}
          onPress={() =>
            openOptionSelector('Seleccionar servicio', serviceOptions, (option) => {
              const service = option.raw;
              updateForm({
                service_id: service.id,
                service: service.name,
                detail: service.name,
                service_price: String(service.price),
                amount: String(service.price),
                duration: String(service.duration),
                end_time: addMinutesToTime(form.start_time || form.time || '09:00', service.duration),
              });
            })
          }
        />
        {form.service ? (
          <View style={[styles.appointmentServicePreview, { backgroundColor: theme.input, borderColor: theme.line }]}>
            <View>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{form.service}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Duracion estimada: {form.duration || 30} min</Text>
            </View>
            <Text selectable style={[styles.appointmentPrice, { color: colors.green }]}>{money(form.service_price || form.amount)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Fecha y hora</SectionTitle>
        <DateField theme={theme} label="Fecha *" value={form.date} error={errors.date} onChange={(value) => updateForm('date', value)} />
        <TimeField theme={theme} label="Hora inicio *" value={form.start_time || form.time} error={errors.start_time} onChange={updateStartTime} />
        <TimeField theme={theme} label="Hora fin" value={form.end_time} error={errors.end_time} onChange={updateEndTime} />
        <Input label="Duracion (min)" value={form.duration} error={errors.duration} onChangeText={updateDuration} theme={theme} icon="D" placeholder="30" keyboardType="number-pad" maxLength={3} />
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Detalles</SectionTitle>
        <SelectField
          label="Tipo"
          value={form.type}
          placeholder="Seleccione tipo"
          theme={theme}
          icon="T"
          onPress={() =>
            openOptionSelector('Tipo de cita', appointmentTypes.map((type) => ({ value: type, label: type, active: form.type === type })), (option) =>
              updateForm('type', option.value)
            )
          }
        />
        <SelectField
          label="Consultorio"
          value={form.room}
          placeholder="Seleccione consultorio"
          theme={theme}
          icon="C"
          onPress={() =>
            openOptionSelector('Consultorio', rooms.map((room) => ({ value: room, label: room, active: form.room === room })), (option) =>
              updateForm('room', option.value)
            )
          }
        />
        <SelectField
          label="Estado"
          value={form.status}
          placeholder="Seleccione estado"
          theme={theme}
          icon="E"
          onPress={() =>
            openOptionSelector('Estado de cita', appointmentStatuses.map((status) => ({ value: status, label: status, active: form.status === status })), (option) =>
              updateForm('status', option.value)
            )
          }
        />
        <Input label="Observaciones" value={form.observations} onChangeText={(value) => updateForm('observations', value)} theme={theme} icon="O" placeholder="Notas visibles de la cita" multiline />
        <Input label="Notas internas" value={form.internal_notes} onChangeText={(value) => updateForm('internal_notes', value)} theme={theme} icon="N" placeholder="Notas administrativas" multiline />
      </View>

      <SearchableOptionSheet theme={theme} selector={selector} onClose={() => setSelector(null)} />
    </>
  );
}
