import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { GradientButton, IconBadge, Input } from './common';
import { AppointmentForm, addMinutesToTime, toStoredDate } from './AppointmentForm';
import { formatDisplayDate, formatPersonName, formatUpper, PatientForm } from './PatientForm';
import { PaymentForm, PaymentInstallmentForm } from './PaymentForm';
import { PatientRecord } from './PatientRecord';
import { ReminderForm } from './ReminderForm';
import { colors } from '../theme/palette';

const compactFormDefaults = { name: '', phone: '', tag: '', detail: '', time: '', amount: '' };

const patientFormDefaults = {
  first_name: '',
  last_name_paternal: '',
  last_name_maternal: '',
  gender: 'Otro',
  birth_date: '',
  curp: '',
  rfc: '',
  occupation: '',
  occupation_other: '',
  marital_status: '',
  phone_primary: '',
  phone_secondary: '',
  email: '',
  street: '',
  ext_number: '',
  int_number: '',
  neighborhood: '',
  city: '',
  state: '',
  state_code: '',
  country: 'M\u00E9xico',
  country_code: 'MX',
  country_phone_code: '+52',
  zip_code: '',
  blood_type: '',
  allergies: '',
  chronic_diseases: '',
  current_medications: '',
  medical_history: '',
  dental_history: '',
  insurance: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_phone: '',
  consultation_reason: '',
  observations: '',
  internal_notes: '',
  status: 'activo',
  photo_url: '',
};

const appointmentFormDefaults = {
  patient_id: '',
  name: '',
  phone: '',
  service_id: '',
  service: '',
  service_price: '',
  detail: '',
  date: toStoredDate(new Date()),
  time: '09:00',
  start_time: '09:00',
  end_time: '09:30',
  duration: '30',
  type: 'Consulta',
  room: 'Consultorio 1',
  status: 'Confirmada',
  observations: '',
  internal_notes: '',
  amount: '',
};

const paymentFormDefaults = {
  patient_id: '',
  patient: '',
  phone: '',
  tag: '',
  total_amount: '',
  paid_amount: '',
  method: 'Efectivo',
  date: toStoredDate(new Date()),
  reference: '',
  notes: '',
};

const paymentInstallmentDefaults = {
  amount: '',
  method: 'Efectivo',
  date: toStoredDate(new Date()),
  notes: '',
};

const reminderFormDefaults = {
  patient_id: '',
  patient: '',
  phone: '',
  title: '',
  type: 'Recordatorio 24h antes',
  area: 'Agenda',
  date: toStoredDate(new Date()),
  time: '09:00',
  message: '',
};

const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

const cleanCode = (value = '') => formatUpper(value).replace(/\s/g, '');

const hasSubscriberPhone = (value = '', dialCode = '') => {
  const digits = onlyDigits(value);
  const dialDigits = onlyDigits(dialCode);
  if (!digits) return false;
  return !dialDigits || digits !== dialDigits;
};

const cleanPhone = (value = '', dialCode = '') => {
  const trimmed = String(value || '').trim();
  return hasSubscriberPhone(trimmed, dialCode) ? trimmed : '';
};

const validatePhone = (value = '', dialCode = '') => {
  if (!hasSubscriberPhone(value, dialCode)) return '';
  const digits = onlyDigits(value);
  if (digits.length < 8 || digits.length > 15) return 'El telefono debe tener entre 8 y 15 digitos.';
  return '';
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const curpPattern = /^[A-Z\u00D1]{4}\d{6}[HM][A-Z\u00D1]{5}[A-Z0-9]\d$/;
const rfcPattern = /^[A-Z\u00D1&]{3,4}\d{6}[A-Z0-9]{3}$/;

const parseMoney = (value = 0) => Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;

const money = (value = 0) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const paymentStatusColor = (status = '') => {
  if (status === 'Pagado') return colors.green;
  if (status === 'Parcial') return colors.amber;
  return colors.red;
};

function hydratePatientForm(patient = {}) {
  const nameParts = String(patient.name || '').trim().split(/\s+/).filter(Boolean);
  return {
    ...patientFormDefaults,
    ...patient,
    first_name: patient.first_name || nameParts[0] || '',
    last_name_paternal: patient.last_name_paternal || nameParts.slice(1, 2).join(' ') || '',
    last_name_maternal: patient.last_name_maternal || nameParts.slice(2).join(' ') || '',
    phone_primary: patient.phone_primary || patient.phone || '',
    country: patient.country || patientFormDefaults.country,
    country_code: patient.country_code || patientFormDefaults.country_code,
    country_phone_code: patient.country_phone_code || patientFormDefaults.country_phone_code,
    status: patient.status || patientFormDefaults.status,
  };
}

export function ActionSheet({ theme, sheet, patients, onClose, onAddPatient, onUpdatePatient, onDeletePatient, onOpenPatientEdit, onOpenNotificationTarget, onAddAppointment, onAddReminder, onDeleteReminder, onRegisterPayment, onAddPaymentInstallment, onDeletePayment, notify }) {
  const [form, setForm] = useState(compactFormDefaults);
  const [errors, setErrors] = useState({});
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!sheet) return;
    const defaults = {
      patient: patientFormDefaults,
      patientEdit: hydratePatientForm(sheet.data),
      appointment: { ...appointmentFormDefaults, date: sheet.data?.date || toStoredDate(new Date()) },
      reminder: reminderFormDefaults,
      payment: paymentFormDefaults,
      paymentInstallment: paymentInstallmentDefaults,
    };
    setForm(defaults[sheet.type] || compactFormDefaults);
    setErrors({});
  }, [sheet]);

  const updateForm = (key, value) => {
    if (typeof key === 'object') {
      setForm((prev) => ({ ...prev, ...key }));
      setErrors((prev) => {
        const next = { ...prev };
        Object.keys(key).forEach((field) => delete next[field]);
        return next;
      });
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const title = {
    patient: 'Nuevo paciente',
    patientEdit: 'Editar expediente',
    appointment: 'Nueva cita',
    payment: 'Registrar pago',
    paymentInstallment: 'Registrar abono',
    paymentDetail: 'Detalle del pago',
    deletePayment: 'Eliminar pago',
    reminder: 'Nuevo recordatorio',
    reminderDetail: 'Detalle del recordatorio',
    deleteReminder: 'Eliminar recordatorio',
    notifications: 'Notificaciones',
    patientDetail: sheet?.data?.name,
    patientRecord: 'Expediente',
    deletePatient: 'Eliminar',
    stat: sheet?.data?.label,
  }[sheet?.type] || '';

  const validatePatient = () => {
    const nextErrors = {};
    const curp = cleanCode(form.curp);
    const rfc = cleanCode(form.rfc);
    const email = form.email?.trim();
    const primaryPhoneError = validatePhone(form.phone_primary, form.country_phone_code);
    const secondaryPhoneError = validatePhone(form.phone_secondary, form.country_phone_code);
    const emergencyPhoneError = validatePhone(form.emergency_contact_phone, form.country_phone_code);

    if (!form.first_name?.trim()) nextErrors.first_name = 'El nombre es obligatorio.';
    if (!form.last_name_paternal?.trim()) nextErrors.last_name_paternal = 'El apellido paterno es obligatorio.';
    if (curp && (!curpPattern.test(curp) || curp.length !== 18)) nextErrors.curp = 'La CURP debe tener 18 caracteres y formato valido.';
    if (rfc && (!rfcPattern.test(rfc) || ![12, 13].includes(rfc.length))) nextErrors.rfc = 'El RFC debe tener 12 o 13 caracteres y formato valido.';
    if (primaryPhoneError) nextErrors.phone_primary = primaryPhoneError;
    if (secondaryPhoneError) nextErrors.phone_secondary = secondaryPhoneError;
    if (emergencyPhoneError) nextErrors.emergency_contact_phone = emergencyPhoneError;
    if (email && !emailPattern.test(email)) nextErrors.email = 'Ingresa un correo electronico valido.';
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      notify(nextErrors.first_name || nextErrors.last_name_paternal ? 'Completa los campos obligatorios' : 'Revisa los datos marcados');
      return false;
    }

    return true;
  };

  const validateAppointment = () => {
    const nextErrors = {};
    const duration = Number(form.duration || 0);
    const start = form.start_time || form.time;

    if (!form.name?.trim()) nextErrors.name = 'Selecciona un paciente.';
    if (!form.date?.trim()) nextErrors.date = 'Selecciona la fecha de la cita.';
    if (!start?.trim()) nextErrors.start_time = 'Selecciona la hora de inicio.';
    if (duration <= 0) nextErrors.duration = 'La duracion debe ser mayor a 0.';
    if (form.end_time && start && form.end_time <= start) nextErrors.end_time = 'La hora fin debe ser posterior al inicio.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify(nextErrors.name ? 'Selecciona el paciente de la cita' : 'Revisa los datos de la cita');
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    const nextErrors = {};
    const total = parseMoney(form.total_amount);
    const paid = parseMoney(form.paid_amount);
    if (!form.patient?.trim()) nextErrors.patient = 'Selecciona un paciente.';
    if (total <= 0) nextErrors.total_amount = 'El monto total debe ser mayor a 0.';
    if (paid < 0) nextErrors.paid_amount = 'El monto pagado no puede ser negativo.';
    if (paid > total) nextErrors.paid_amount = 'El monto pagado no puede superar el total.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify(nextErrors.patient ? 'Selecciona el paciente del pago' : 'Revisa los importes del pago');
      return false;
    }
    return true;
  };

  const validateInstallment = () => {
    const nextErrors = {};
    const amount = parseMoney(form.amount);
    const pending = Number(sheet?.data?.pending || 0);
    if (amount <= 0) nextErrors.amount = 'El abono debe ser mayor a 0.';
    if (pending && amount > pending) nextErrors.amount = `El abono no puede superar ${money(pending)}.`;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify('Revisa el monto del abono');
      return false;
    }
    return true;
  };

  const validateReminder = () => {
    const nextErrors = {};
    const phoneDigits = onlyDigits(form.phone);
    if (!form.patient?.trim()) nextErrors.patient = 'Selecciona un paciente.';
    if (!phoneDigits || phoneDigits.length < 8 || phoneDigits.length > 15) nextErrors.phone = 'Ingresa un telefono valido.';
    if (!form.message?.trim()) nextErrors.message = 'El mensaje es obligatorio.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify(nextErrors.patient ? 'Selecciona el paciente del recordatorio' : 'Revisa el recordatorio');
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (sheet?.type === 'patient' || sheet?.type === 'patientEdit') {
      if (!validatePatient()) return;
      const payload = {
        ...form,
        first_name: formatPersonName(form.first_name).trim(),
        last_name_paternal: formatPersonName(form.last_name_paternal).trim(),
        last_name_maternal: formatPersonName(form.last_name_maternal).trim(),
        curp: cleanCode(form.curp),
        rfc: cleanCode(form.rfc),
        occupation: form.occupation === 'Otro' && form.occupation_other?.trim() ? formatPersonName(form.occupation_other).trim() : form.occupation,
        phone_primary: cleanPhone(form.phone_primary, form.country_phone_code),
        phone_secondary: cleanPhone(form.phone_secondary, form.country_phone_code),
        emergency_contact_phone: cleanPhone(form.emergency_contact_phone, form.country_phone_code),
        email: form.email?.trim() || '',
      };
      if (sheet?.type === 'patientEdit') await onUpdatePatient(sheet.data.id, payload);
      else await onAddPatient(payload);
    }
    else if (sheet?.type === 'appointment') {
      if (!validateAppointment()) return;
      const payload = {
        ...form,
        time: form.start_time || form.time,
        end_time: form.end_time || addMinutesToTime(form.start_time || form.time, Number(form.duration || 30)),
        detail: form.service || form.detail || 'Revision',
        service: form.service || form.detail || 'Revision',
        service_price: form.service_price || form.amount || '',
      };
      await onAddAppointment(payload);
    }
    else if (sheet?.type === 'reminder') {
      if (!validateReminder()) return;
      await onAddReminder(form);
    }
    else if (sheet?.type === 'payment') {
      if (!validatePayment()) return;
      await onRegisterPayment(form);
    }
    else if (sheet?.type === 'paymentInstallment') {
      if (!validateInstallment()) return;
      await onAddPaymentInstallment(sheet.data.id, form);
    }
    else {
      onClose();
      notify('Listo');
    }
  };

  const renderEditableFields = () => {
    if (sheet?.type === 'patient' || sheet?.type === 'patientEdit') {
      return <PatientForm theme={theme} form={form} updateForm={updateForm} errors={errors} notify={notify} />;
    }

    if (sheet?.type === 'appointment') {
      return <AppointmentForm theme={theme} form={form} updateForm={updateForm} errors={errors} patients={patients} />;
    }

    if (sheet?.type === 'reminder') {
      return <ReminderForm theme={theme} form={form} updateForm={updateForm} errors={errors} patients={patients} notify={notify} />;
    }

    if (sheet?.type === 'payment') {
      return <PaymentForm theme={theme} form={form} updateForm={updateForm} errors={errors} patients={patients} />;
    }

    if (sheet?.type === 'paymentInstallment') {
      return <PaymentInstallmentForm theme={theme} form={form} updateForm={updateForm} errors={errors} />;
    }

    return null;
  };

  return (
    <Modal visible={Boolean(sheet)} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.line,
              paddingBottom: Math.max(28, insets.bottom + 18),
            },
          ]}>
          <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
          <View style={styles.sheetHeader}>
            <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
            </Pressable>
          </View>

          {sheet?.type === 'patientRecord' ? (
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            <PatientRecord patient={sheet.data} theme={theme} />
            <GradientButton label="Cerrar expediente" onPress={onClose} right="" />
          </ScrollView>
        ) : sheet?.type === 'deletePatient' ? (
          <View style={{ gap: 14 }}>
            <View style={[styles.detailBand, { backgroundColor: theme.input }]}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Eliminar paciente</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>
                Esta accion quitara a {sheet.data.name} de la lista movil.
              </Text>
            </View>
            <Pressable
              onPress={() => Promise.resolve(onDeletePatient(sheet.data.id)).catch(() => {})}
              style={({ pressed }) => [
                styles.dangerButton,
                { backgroundColor: `${colors.red}18`, borderColor: `${colors.red}40` },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.dangerButtonText}>Eliminar paciente</Text>
            </Pressable>
            <GradientButton label="Cancelar" onPress={onClose} right="" />
          </View>
        ) : sheet?.type === 'deletePayment' ? (
          <View style={styles.deleteConfirmWrap}>
            <View style={[styles.deleteWarningIcon, { backgroundColor: `${colors.red}18` }]}>
              <Text style={[styles.deleteWarningText, { color: colors.red }]}>!</Text>
            </View>
            <Text selectable style={[styles.sheetTitle, { color: theme.text, textAlign: 'center' }]}>Eliminar pago</Text>
            <Text selectable style={[styles.mutedCopy, { color: theme.muted, textAlign: 'center' }]}>
              Eliminar este registro quitara su historial de abonos.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.confirmButton,
                  { backgroundColor: theme.input, borderColor: theme.line },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.confirmButtonText, { color: theme.text }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => Promise.resolve(onDeletePayment(sheet.data.id)).catch(() => {})}
                style={({ pressed }) => [
                  styles.confirmButton,
                  { backgroundColor: colors.red, borderColor: colors.red },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.confirmButtonText, { color: '#ffffff' }]}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ) : sheet?.type === 'deleteReminder' ? (
          <View style={styles.deleteConfirmWrap}>
            <View style={[styles.deleteWarningIcon, { backgroundColor: `${colors.red}18` }]}>
              <Text style={[styles.deleteWarningText, { color: colors.red }]}>!</Text>
            </View>
            <Text selectable style={[styles.sheetTitle, { color: theme.text, textAlign: 'center' }]}>Eliminar recordatorio</Text>
            <Text selectable style={[styles.mutedCopy, { color: theme.muted, textAlign: 'center' }]}>
              Se quitara el recordatorio de {sheet.data.patient || sheet.data.title}.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.confirmButton,
                  { backgroundColor: theme.input, borderColor: theme.line },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.confirmButtonText, { color: theme.text }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => Promise.resolve(onDeleteReminder(sheet.data.id)).catch(() => {})}
                style={({ pressed }) => [
                  styles.confirmButton,
                  { backgroundColor: colors.red, borderColor: colors.red },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.confirmButtonText, { color: '#ffffff' }]}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ) : sheet?.type === 'patientDetail' ? (
          <View style={{ gap: 14 }}>
            <View style={[styles.detailBand, { backgroundColor: theme.input }]}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{sheet.data.phone}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Proxima cita: {sheet.data.next}</Text>
            </View>
            <GradientButton label="Abrir expediente" onPress={() => onOpenPatientEdit(sheet.data)} right=">" />
          </View>
        ) : sheet?.type === 'notifications' ? (
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            {(sheet.data?.items || []).length ? (
              (sheet.data?.items || []).map((item) => (
                <View key={item.id} style={[styles.notificationRow, { backgroundColor: theme.input, borderColor: theme.line }]}>
                  <IconBadge icon={item.icon} color={item.tone} size={48} />
                  <View style={styles.notificationBody}>
                    <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{item.body}</Text>
                    <Pressable
                      onPress={() => onOpenNotificationTarget?.(item.target)}
                      style={({ pressed }) => [
                        styles.notificationAction,
                        { backgroundColor: `${item.tone}18`, borderColor: `${item.tone}40` },
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.notificationActionText, { color: item.tone }]}>{item.action || 'Abrir'}</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.notificationEmpty, { backgroundColor: theme.input, borderColor: theme.line }]}>
                <IconBadge icon="✓" color={colors.green} size={54} />
                <Text selectable style={[styles.cardTitle, { color: theme.text, textAlign: 'center' }]}>Todo al dia</Text>
                <Text selectable style={[styles.cardSub, { color: theme.muted, textAlign: 'center' }]}>
                  No hay alertas importantes por ahora.
                </Text>
              </View>
            )}
            <GradientButton label="Cerrar" onPress={onClose} right="" />
          </ScrollView>
        ) : sheet?.type === 'stat' ? (
          <View style={{ gap: 14 }}>
            <IconBadge icon={sheet.data.icon} color={sheet.data.tone} size={62} />
            <Text selectable style={[styles.bigTitle, { color: theme.text }]}>{sheet.data.value}</Text>
            <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>Este indicador viene del resumen movil y puede conectarse a /dashboard.</Text>
          </View>
        ) : sheet?.type === 'paymentDetail' ? (
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.paymentDetailHero, { backgroundColor: theme.input, borderColor: theme.line }]}>
              <View>
                <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Paciente</Text>
                <Text selectable style={[styles.recordName, { color: theme.text }]}>{sheet.data.patient}</Text>
                <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{sheet.data.tag || 'Tratamiento dental'}</Text>
              </View>
              <Text selectable style={[styles.paymentStatusChip, { color: paymentStatusColor(sheet.data.status), backgroundColor: `${paymentStatusColor(sheet.data.status)}18` }]}>
                {sheet.data.status}
              </Text>
            </View>
            <View style={styles.paymentDetailGrid}>
              {[
                ['Total', money(sheet.data.total), theme.text],
                ['Pagado', money(sheet.data.paid), colors.green],
                ['Pendiente', money(sheet.data.pending), colors.red],
                ['Metodo', sheet.data.method || 'Efectivo', theme.text],
                ['Fecha', formatDisplayDate(sheet.data.date), theme.text],
                ['Referencia', sheet.data.reference || 'Sin referencia', theme.text],
              ].map(([label, value, color]) => (
                <View key={label} style={[styles.paymentDetailCell, { backgroundColor: theme.input, borderColor: theme.line }]}>
                  <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>{label}</Text>
                  <Text selectable style={[styles.paymentDetailValue, { color }]}>{value}</Text>
                </View>
              ))}
            </View>
            {sheet.data.notes ? (
              <View style={[styles.detailBand, { backgroundColor: theme.input }]}>
                <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Notas</Text>
                <Text selectable style={[styles.cardSub, { color: theme.text }]}>{sheet.data.notes}</Text>
              </View>
            ) : null}
            <Text selectable style={[styles.formSectionTitle, { marginTop: 4 }]}>Historial de transacciones</Text>
            {(sheet.data.history || []).length ? (
              (sheet.data.history || []).map((item) => (
                <View key={item.id} style={[styles.paymentHistoryRow, { backgroundColor: theme.input, borderColor: theme.line }]}>
                  <View>
                    <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{money(item.amount)}</Text>
                    <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{item.method} - {formatDisplayDate(item.date)}</Text>
                  </View>
                  <Text selectable style={[styles.cardSub, { color: theme.muted, textAlign: 'right' }]}>{item.notes || 'Abono'}</Text>
                </View>
              ))
            ) : (
              <View style={[styles.detailBand, { backgroundColor: theme.input }]}>
                <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Aun no hay abonos registrados.</Text>
              </View>
            )}
            <GradientButton label="Cerrar detalle" onPress={onClose} right="" />
          </ScrollView>
        ) : sheet?.type === 'reminderDetail' ? (
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.reminderDetailHero, { backgroundColor: theme.input, borderColor: theme.line }]}>
              <View style={{ flex: 1 }}>
                <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Paciente</Text>
                <Text selectable style={[styles.recordName, { color: theme.text }]}>{sheet.data.patient || 'Sin paciente'}</Text>
                <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{sheet.data.phone || 'Sin telefono'}</Text>
              </View>
              <Text selectable style={[styles.paymentStatusChip, { color: sheet.data.status === 'Enviado' ? colors.green : colors.amber, backgroundColor: sheet.data.status === 'Enviado' ? `${colors.green}18` : `${colors.amber}18` }]}>
                {sheet.data.status || 'Pendiente'}
              </Text>
            </View>
            <View style={styles.paymentDetailGrid}>
              {[
                ['Titulo', sheet.data.title || 'Recordatorio', theme.text],
                ['Tipo', sheet.data.type || sheet.data.area || 'Agenda', theme.text],
                ['Fecha', formatDisplayDate(sheet.data.date), theme.text],
                ['Hora', sheet.data.time || '--:--', theme.text],
              ].map(([label, value, color]) => (
                <View key={label} style={[styles.paymentDetailCell, { backgroundColor: theme.input, borderColor: theme.line }]}>
                  <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>{label}</Text>
                  <Text selectable style={[styles.paymentDetailValue, { color }]}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.reminderMessageBox, { backgroundColor: theme.input, borderColor: theme.line }]}>
              <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Mensaje</Text>
              <Text selectable style={[styles.reminderMessageText, { color: theme.text }]}>{sheet.data.message}</Text>
            </View>
            <GradientButton label="Cerrar detalle" onPress={onClose} right="" />
          </ScrollView>
        ) : sheet?.type === 'patient' || sheet?.type === 'patientEdit' || sheet?.type === 'appointment' || sheet?.type === 'payment' || sheet?.type === 'paymentInstallment' || sheet?.type === 'reminder' ? (
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {renderEditableFields()}
            <GradientButton
              label={sheet?.type === 'appointment' ? 'Crear cita' : sheet?.type === 'patientEdit' ? 'Guardar cambios' : sheet?.type === 'payment' ? 'Registrar pago' : sheet?.type === 'paymentInstallment' ? 'Registrar abono' : sheet?.type === 'reminder' ? 'Crear recordatorio' : 'Guardar paciente'}
              onPress={() => submit().catch(() => {})}
              right=""
            />
          </ScrollView>
        ) : (
          <View style={{ gap: 14 }}>
            {renderEditableFields()}
            <GradientButton label={sheet?.type === 'payment' ? 'Confirmar pago' : 'Guardar'} onPress={() => submit().catch(() => {})} right="" />
          </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
