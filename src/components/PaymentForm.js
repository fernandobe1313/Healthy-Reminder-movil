import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from '../styles';
import { colors } from '../theme/palette';
import { GradientButton, Input } from './common';
import { formatDisplayDate, parseSelectedDate } from './PatientForm';
import { toStoredDate } from './AppointmentForm';

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'];

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s+$]/g, ' ')
    .toLocaleLowerCase('es-MX')
    .replace(/\s+/g, ' ')
    .trim();
}

function currency(value = 0) {
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

function DateField({ theme, value, error, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>Fecha</Text>
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
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Fecha del pago</Text>
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

export function PaymentForm({ theme, form, updateForm, errors, patients = [] }) {
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

  const methodOptions = paymentMethods.map((method) => ({
    value: method,
    label: method,
    active: form.method === method,
  }));

  const paid = Number(String(form.paid_amount || 0).replace(/[^0-9.]/g, '')) || 0;
  const total = Number(String(form.total_amount || 0).replace(/[^0-9.]/g, '')) || 0;
  const pending = Math.max(0, total - paid);

  return (
    <>
      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Datos del pago</SectionTitle>
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
              onSelect: (option) =>
                updateForm({
                  patient_id: option.raw.id,
                  patient: option.raw.name,
                  phone: option.raw.phone || '',
                  tag: option.raw.tag || '',
                  total_amount: form.total_amount || String(option.raw.balance || ''),
                }),
            })
          }
        />
        <Input label="Monto total *" value={form.total_amount} error={errors.total_amount} onChangeText={(value) => updateForm('total_amount', value)} theme={theme} icon="$" placeholder="0" keyboardType="decimal-pad" />
        <Input label="Monto pagado" value={form.paid_amount} error={errors.paid_amount} onChangeText={(value) => updateForm('paid_amount', value)} theme={theme} icon="$" placeholder="0" keyboardType="decimal-pad" />
        <View style={[styles.paymentSummaryBand, { backgroundColor: theme.input, borderColor: theme.line }]}>
          <View>
            <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Pendiente</Text>
            <Text selectable style={[styles.paymentSummaryAmount, { color: pending ? colors.red : colors.green }]}>{currency(pending)}</Text>
          </View>
          <Text selectable style={[styles.smallChip, { color: pending ? colors.amber : colors.green, backgroundColor: pending ? `${colors.amber}18` : `${colors.green}18` }]}>
            {pending ? (paid ? 'Parcial' : 'Pendiente') : 'Pagado'}
          </Text>
        </View>
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Operacion</SectionTitle>
        <SelectField
          label="Metodo de pago"
          value={form.method}
          placeholder="Seleccione metodo"
          theme={theme}
          icon="M"
          onPress={() =>
            setSelector({
              title: 'Metodo de pago',
              options: methodOptions,
              onSelect: (option) => updateForm('method', option.value),
            })
          }
        />
        <DateField theme={theme} value={form.date} onChange={(value) => updateForm('date', value)} />
        <Input label="Referencia" value={form.reference} onChangeText={(value) => updateForm('reference', value)} theme={theme} icon="#" placeholder="Folio, autorizacion o nota de caja" />
        <Input label="Notas" value={form.notes} onChangeText={(value) => updateForm('notes', value)} theme={theme} icon="N" placeholder="Notas visibles del pago" multiline />
      </View>

      <SearchableOptionSheet theme={theme} selector={selector} onClose={() => setSelector(null)} />
    </>
  );
}

export function PaymentInstallmentForm({ theme, form, updateForm, errors }) {
  const [selector, setSelector] = useState(null);
  const methodOptions = paymentMethods.map((method) => ({
    value: method,
    label: method,
    active: form.method === method,
  }));

  return (
    <>
      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Abono</SectionTitle>
        <Input label="Monto del abono *" value={form.amount} error={errors.amount} onChangeText={(value) => updateForm('amount', value)} theme={theme} icon="$" placeholder="0" keyboardType="decimal-pad" />
        <SelectField
          label="Metodo"
          value={form.method}
          placeholder="Seleccione metodo"
          theme={theme}
          icon="M"
          onPress={() =>
            setSelector({
              title: 'Metodo de pago',
              options: methodOptions,
              onSelect: (option) => updateForm('method', option.value),
            })
          }
        />
        <DateField theme={theme} value={form.date} onChange={(value) => updateForm('date', value)} />
        <Input label="Referencia" value={form.reference} onChangeText={(value) => updateForm('reference', value)} theme={theme} icon="#" placeholder="Folio o autorización" />
        <Input label="Notas" value={form.notes} onChangeText={(value) => updateForm('notes', value)} theme={theme} icon="N" placeholder="Detalle del abono" multiline />
      </View>

      <SearchableOptionSheet theme={theme} selector={selector} onClose={() => setSelector(null)} />
    </>
  );
}
