import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import 'expo-sqlite/localStorage/install';
import { appointmentsSeed, patientsSeed, paymentsSeed, remindersSeed } from '../data/mock-data';
import { colors, themes } from '../theme/palette';
import { loginMobile, logoutMobile, restoreMobileSession } from '../api/auth';
import { api } from '../api/client';

const AppStateContext = createContext(null);

function patientListFields(form = {}) {
  const fullName = [form.first_name, form.last_name_paternal, form.last_name_maternal]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const name = fullName || form.name?.trim() || 'Nuevo Paciente';
  const phone = form.phone_primary?.trim() || form.phone?.trim() || '55 0000 0000';
  const tag = form.consultation_reason?.trim() || form.occupation?.trim() || form.tag?.trim() || 'Nuevo';
  return { name, phone, tag };
}

function parseMoney(value = 0) {
  return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
}

function paymentStatus(total = 0, paid = 0) {
  const pending = Math.max(0, Number(total || 0) - Number(paid || 0));
  if (pending <= 0) return 'Pagado';
  if (Number(paid || 0) > 0) return 'Parcial';
  return 'Pendiente';
}

function formatMoney(value = 0) {
  return `$${Number(value || 0).toLocaleString('en-US')}`;
}

function pendingForPatient(records = [], patientId, patientName = '') {
  return records
    .filter((payment) => payment.patient_id === patientId || payment.patient.toLowerCase() === patientName.toLowerCase())
    .reduce((sum, payment) => sum + Number(payment.pending || 0), 0);
}

function whatsappPhone(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

export function AppStateProvider({ children }) {
  const [themeMode, setThemeMode] = useState('light');
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('dentist');
  const [currentPatientId, setCurrentPatientId] = useState(1);
  const [selectedDay, setSelectedDay] = useState('Lun');
  const [selectedAgendaDate, setSelectedAgendaDate] = useState('');
  const [patients, setPatients] = useState(patientsSeed);
  const [payments, setPayments] = useState(paymentsSeed);
  const [appointments, setAppointments] = useState(appointmentsSeed);
  const [reminders, setReminders] = useState(remindersSeed);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [selectedClinicalPatientId, setSelectedClinicalPatientId] = useState('');
  const [selectedTooth, setSelectedTooth] = useState('11');
  const [odontogramByPatient, setOdontogramByPatient] = useState({
    1: { 11: 'sano', 12: 'restauracion', 26: 'caries', 36: 'endodoncia' },
  });
  const [clinicalRecords, setClinicalRecords] = useState([
    { id: 1, patient_id: 1, date: '2026-06-18', diagnosis: 'Caries en pieza 26', treatment: 'Limpieza y preparación', evolution: 'Sin molestias posteriores', follow_up: 'Restauración definitiva en próxima cita', visible: true },
    { id: 2, patient_id: 1, date: '2026-05-20', diagnosis: 'Revisión general', treatment: 'Profilaxis dental', evolution: 'Higiene adecuada', follow_up: 'Control en 6 meses', visible: true },
    { id: 3, patient_id: 2, date: '2026-06-28', diagnosis: 'Acumulación de sarro', treatment: 'Limpieza dental', evolution: 'Favorable', follow_up: 'Control semestral', visible: true },
  ]);
  const [treatmentPlans, setTreatmentPlans] = useState([
    {
      id: 1,
      patient_id: 1,
      name: 'Plan restaurativo',
      dentist: 'Dra. Mariana Torres',
      started_at: '2026-05-20',
      status: 'En proceso',
      progress: 60,
      next_step: 'Restauración definitiva de pieza 26',
      items: [
        { id: 11, name: 'Valoración y diagnóstico', tooth: 'General', status: 'Completado', price: 600 },
        { id: 12, name: 'Profilaxis dental', tooth: 'General', status: 'Completado', price: 850 },
        { id: 13, name: 'Restauración con resina', tooth: '26', status: 'En proceso', price: 1700 },
        { id: 14, name: 'Revisión de control', tooth: '26', status: 'Pendiente', price: 600 },
      ],
    },
  ]);
  const [patientDocuments] = useState([
    { id: 1, patient_id: 1, type: 'Receta', title: 'Indicaciones posteriores a profilaxis', date: '2026-05-20', detail: 'Enjuague bucal sin alcohol, dos veces al día durante 7 días.', status: 'Vigente' },
    { id: 2, patient_id: 1, type: 'Presupuesto', title: 'Plan restaurativo', date: '2026-05-20', detail: 'Total estimado $3,750 MXN.', status: 'Aceptado' },
    { id: 3, patient_id: 1, type: 'Consentimiento', title: 'Consentimiento para restauración', date: '2026-06-18', detail: 'Documento aceptado digitalmente.', status: 'Firmado' },
  ]);
  const [patientPreferences, setPatientPreferences] = useState({
    push: true,
    email: true,
    whatsapp: true,
    appointmentReminders: true,
    paymentReminders: true,
  });
  const [followUps, setFollowUps] = useState([
    {
      id: 1,
      patient_id: 1,
      patient: 'Alan Ramirez',
      procedure: 'Restauración con resina',
      treatment_date: '2026-07-06',
      next_check_at: '2026-07-07T18:00:00',
      status: 'Pendiente',
      instructions: 'Evita alimentos duros durante 24 horas. Mantén higiene suave y no mastiques del lado tratado mientras exista sensibilidad.',
      medication: 'Paracetamol únicamente si fue indicado por tu dentista.',
      responses: [],
      reviewed: false,
    },
    {
      id: 2,
      patient_id: 2,
      patient: 'Sofia Aguilar',
      procedure: 'Limpieza dental',
      treatment_date: '2026-07-05',
      next_check_at: '2026-07-06T17:00:00',
      status: 'Alerta',
      instructions: 'Evita bebidas muy frías durante las primeras horas.',
      medication: 'Sin medicamento.',
      responses: [{ id: 21, date: '2026-07-06T17:15:00', pain: 8, swelling: true, bleeding: false, sensitivity: true, fever: false, medicationTaken: true, comment: 'Dolor fuerte al masticar.', photoUri: '', priority: 'Alta' }],
      reviewed: false,
    },
  ]);
  const [emergencyVisibility, setEmergencyVisibility] = useState(() => {
    try {
      return JSON.parse(globalThis.localStorage?.getItem('hr_emergency_visibility')) || {
        bloodType: true,
        allergies: true,
        diseases: true,
        medications: true,
        emergencyContact: true,
        clinic: true,
      };
    } catch {
      return { bloodType: true, allergies: true, diseases: true, medications: true, emergencyContact: true, clinic: true };
    }
  });
  const [calendarEvents, setCalendarEvents] = useState({});

  const hydratePatientData = async (patientId) => {
    const [profile, appointmentResult, paymentResult, followUpResult] = await Promise.all([
      api.get('/me'),
      api.get('/me/appointments'),
      api.get('/me/payments'),
      api.get('/follow-ups'),
    ]);
    const fullName = [profile.first_name, profile.last_name_paternal, profile.last_name_maternal].filter(Boolean).join(' ');
    const mobilePatient = {
      ...profile,
      id: patientId,
      name: fullName,
      phone: profile.phone_primary || '',
      tag: 'Paciente',
      next: appointmentResult.data?.[0]?.appointment_date || 'Sin cita',
      balance: (paymentResult.data || []).reduce((sum, item) => sum + Number(item.remaining_balance || 0), 0),
    };
    setPatients((current) => [mobilePatient, ...current.filter((item) => item.id !== patientId)]);
    setAppointments((appointmentResult.data || []).map((item) => ({
      ...item,
      patient_id: patientId,
      patient: fullName,
      time: item.start_time,
      date: item.appointment_date,
      service: item.service_name || item.appointment_type,
      status: item.status,
      color: colors.blue,
    })));
    setPayments((paymentResult.data || []).map((item) => ({
      ...item,
      patient_id: patientId,
      patient: fullName,
      total: Number(item.total_amount || 0),
      paid: Number(item.amount_paid || 0),
      pending: Number(item.remaining_balance || 0),
      method: item.payment_method,
      date: item.payment_date,
    })));
    setFollowUps(followUpResult.data || []);
  };

  useEffect(() => {
    restoreMobileSession()
      .then(async (user) => {
        if (!user) return;
        setCurrentUser(user);
        setCurrentRole(user.role);
        if (user.patient_id) {
          setCurrentPatientId(user.patient_id);
          await hydratePatientData(user.patient_id);
        }
        setLoggedIn(true);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem('hr_emergency_visibility', JSON.stringify(emergencyVisibility));
      const patient = patients.find((item) => item.id === currentPatientId);
      if (patient) globalThis.localStorage?.setItem('hr_emergency_patient', JSON.stringify(patient));
    } catch {
      // El estado sigue disponible en memoria cuando el almacenamiento no existe.
    }
  }, [emergencyVisibility, patients, currentPatientId]);

  const theme = themes[themeMode];
  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const login = async (username, password) => {
    const user = await loginMobile(username, password);
    setCurrentUser(user);
    setCurrentRole(user.role);
    if (user.role === 'patient') {
      setCurrentPatientId(user.patient_id);
      await hydratePatientData(user.patient_id);
    }
    setLoggedIn(true);
    return user;
  };

  const logout = async () => {
    await logoutMobile();
    setLoggedIn(false);
    setCurrentUser(null);
    setSheet(null);
  };

  const updateAppointment = (id, changes = {}) => {
    setAppointments((prev) => prev.map((appointment) => (
      appointment.id === id
        ? {
            ...appointment,
            ...changes,
            color: changes.status === 'Confirmada'
              ? colors.blue
              : changes.status === 'Completada'
                ? colors.green
                : changes.status === 'Cancelada'
                  ? colors.red
                  : appointment.color,
          }
        : appointment
    )));
    notify(changes.status ? `Cita ${changes.status.toLowerCase()}` : 'Cita actualizada');
  };

  const requestPatientAppointment = (form = {}) => {
    const patient = patients.find((item) => item.id === currentPatientId);
    if (!patient) return;
    addAppointment({
      patient_id: patient.id,
      name: patient.name,
      date: form.date,
      start_time: form.time,
      end_time: form.end_time || '',
      service: form.service || 'Consulta general',
      detail: form.reason || '',
      status: 'Solicitada',
      room: 'Por asignar',
      type: 'Solicitud del paciente',
    });
  };

  const updateCurrentPatient = (changes = {}) => {
    updatePatient(currentPatientId, changes);
  };

  const createFollowUp = (form = {}) => {
    const patient = patients.find((item) => item.id === form.patient_id);
    if (!patient) {
      notify('Selecciona un paciente');
      return;
    }
    setFollowUps((prev) => [{
      id: Date.now(),
      patient_id: patient.id,
      patient: patient.name,
      procedure: form.procedure || 'Procedimiento dental',
      treatment_date: form.treatment_date || new Date().toISOString().slice(0, 10),
      next_check_at: form.next_check_at || new Date(Date.now() + 86400000).toISOString(),
      status: 'Pendiente',
      instructions: form.instructions || 'Sigue las indicaciones de tu dentista.',
      medication: form.medication || 'Sin medicamento registrado.',
      responses: [],
      reviewed: false,
    }, ...prev]);
    notify('Seguimiento programado');
  };

  const submitFollowUp = (followUpId, response = {}) => {
    const pain = Number(response.pain || 0);
    const warning = pain >= 7 || response.fever || (response.swelling && response.bleeding);
    const priority = warning ? 'Alta' : pain >= 4 || response.swelling || response.bleeding ? 'Media' : 'Baja';
    setFollowUps((prev) => prev.map((item) => item.id === followUpId ? {
      ...item,
      status: warning ? 'Alerta' : 'Respondido',
      reviewed: false,
      responses: [...(item.responses || []), { ...response, id: Date.now(), date: new Date().toISOString(), pain, priority }],
    } : item));
    notify(warning ? 'Reporte enviado para revisión prioritaria' : 'Seguimiento enviado');
    return priority;
  };

  const reviewFollowUp = (followUpId, note = '') => {
    setFollowUps((prev) => prev.map((item) => item.id === followUpId ? {
      ...item,
      reviewed: true,
      status: item.status === 'Alerta' ? 'Revisado' : item.status,
      dentist_note: note || 'Revisado por el equipo dental.',
      reviewed_at: new Date().toISOString(),
    } : item));
    notify('Seguimiento marcado como revisado');
  };

  const closeFollowUp = (followUpId) => {
    setFollowUps((prev) => prev.map((item) => item.id === followUpId ? { ...item, status: 'Cerrado', reviewed: true } : item));
    notify('Seguimiento cerrado');
  };

  const pendingPaymentsTotal = payments.reduce((sum, payment) => sum + Number(payment.pending || 0), 0);
  const pendingReminderCount = reminders.filter((reminder) => reminder.status !== 'Enviado').length;
  const notificationItems = [
    followUps.some((item) => item.status === 'Alerta' && !item.reviewed)
      ? {
          id: 'followups-alert',
          icon: '!',
          tone: colors.red,
          title: `${followUps.filter((item) => item.status === 'Alerta' && !item.reviewed).length} seguimientos requieren atención`,
          body: 'Hay reportes del paciente con síntomas que deben ser revisados.',
          target: 'followups',
          action: 'Revisar casos',
        }
      : null,
    appointments.length
      ? {
          id: 'appointments',
          icon: 'C',
          tone: colors.blue,
          title: `${appointments.length} citas en agenda`,
          body: 'Revisa la agenda para confirmar horarios y pacientes programados.',
          target: 'agenda',
          action: 'Abrir agenda',
        }
      : null,
    pendingPaymentsTotal > 0
      ? {
          id: 'payments',
          icon: '$',
          tone: colors.red,
          title: `${formatMoney(pendingPaymentsTotal)} pendientes`,
          body: 'Hay saldos abiertos que conviene revisar antes de cerrar el dia.',
          target: 'payments',
          action: 'Ver pagos',
        }
      : null,
    pendingReminderCount
      ? {
          id: 'reminders',
          icon: 'W',
          tone: colors.amber,
          title: `${pendingReminderCount} recordatorios pendientes`,
          body: 'Tienes avisos de WhatsApp listos para enviar o marcar como enviados.',
          target: 'reminders',
          action: 'Ver recordatorios',
        }
      : null,
  ].filter(Boolean);

  const openNotifications = () => {
    setSheet({ type: 'notifications', data: { items: notificationItems } });
  };

  const addPatient = (form = {}) => {
    const { name, phone, tag } = patientListFields(form);
    setPatients((prev) => [
      { ...form, id: Date.now(), name, phone, next: 'Sin cita', balance: 0, tag },
      ...prev,
    ]);
    setSheet(null);
    notify('Paciente agregado');
  };

  const updatePatient = (id, form = {}) => {
    const listFields = patientListFields(form);
    const previousPatient = patients.find((patient) => patient.id === id);
    setPatients((prev) =>
      prev.map((patient) => (
        patient.id === id
          ? { ...patient, ...form, ...listFields, id: patient.id, next: form.next || patient.next, balance: form.balance ?? patient.balance }
          : patient
      ))
    );
    if (previousPatient && previousPatient.name !== listFields.name) {
      setAppointments((prev) =>
        prev.map((appointment) => (
          appointment.patient.toLowerCase() === previousPatient.name.toLowerCase()
            ? { ...appointment, patient: listFields.name }
            : appointment
        ))
      );
    }
    setPayments((prev) =>
      prev.map((payment) => (
        payment.patient_id === id || payment.patient.toLowerCase() === previousPatient?.name?.toLowerCase()
          ? { ...payment, patient: listFields.name, phone: listFields.phone, tag: listFields.tag }
          : payment
      ))
    );
    setSheet(null);
    notify('Expediente actualizado');
  };

  const deletePatient = (id) => {
    const removedPatient = patients.find((patient) => patient.id === id);
    setPatients((prev) => prev.filter((patient) => patient.id !== id));
    setOdontogramByPatient((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedClinicalPatientId === id) setSelectedClinicalPatientId('');
    if (removedPatient) {
      setAppointments((prev) =>
        prev.filter((appointment) => appointment.patient.toLowerCase() !== removedPatient.name.toLowerCase())
      );
      setPayments((prev) =>
        prev.filter((payment) => payment.patient_id !== id && payment.patient.toLowerCase() !== removedPatient.name.toLowerCase())
      );
    }
    setSheet(null);
    notify('Paciente eliminado');
  };

  const addAppointment = (form = {}) => {
    const time = form.start_time?.trim() || form.time?.trim() || '09:00';
    const patient = form.name?.trim() || 'Nuevo Paciente';
    const service = form.service?.trim() || form.detail?.trim() || 'Revision';
    const status = form.status?.trim() || 'Nueva';
    setAppointments((prev) => [
      {
        ...form,
        id: Date.now(),
        time,
        patient,
        service,
        status,
        color: status === 'Confirmada' ? colors.blue : status === 'Completada' ? colors.green : status === 'Cancelada' ? colors.red : colors.purple,
      },
      ...prev,
    ]);
    setPatients((prev) =>
      prev.map((item) => (
        item.id === form.patient_id || item.name.toLowerCase() === patient.toLowerCase()
          ? { ...item, next: form.date ? `${form.date} ${time}` : time }
          : item
      ))
    );
    setSheet(null);
    notify('Cita programada');
  };

  const addReminder = (form = {}) => {
    const type = form.type?.trim() || 'Recordatorio 24h antes';
    const patient = form.patient?.trim() || 'Paciente';
    const title = form.title?.trim() || (type === 'Recordatorio de pago' ? 'Recordatorio de pago' : `Recordatorio para ${patient}`);
    const area = type.includes('pago') || type.includes('Pago') ? 'Finanzas' : type.includes('clinico') || type.includes('Clinico') ? 'Clinico' : 'Agenda';
    setReminders((prev) => [
      {
        ...form,
        id: Date.now(),
        title,
        patient,
        phone: form.phone?.trim() || '',
        type,
        area,
        status: 'Pendiente',
        message: form.message?.trim() || title,
      },
      ...prev,
    ]);
    setSheet(null);
    notify('Recordatorio creado');
  };

  const sendReminder = async (id) => {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder) return;
    const phone = whatsappPhone(reminder.phone);
    const text = encodeURIComponent(reminder.message || reminder.title || '');
    if (!phone || !text) {
      notify('Falta telefono o mensaje');
      return;
    }
    const appUrl = `whatsapp://send?phone=${phone}&text=${text}`;
    const webUrl = `https://wa.me/${phone}?text=${text}`;
    try {
      await Linking.openURL(appUrl);
    } catch (error) {
      await Linking.openURL(webUrl);
    }
    notify('WhatsApp abierto');
  };

  const markReminderSent = (id) => {
    setReminders((prev) =>
      prev.map((reminder) => (
        reminder.id === id ? { ...reminder, status: 'Enviado', sent_at: new Date().toISOString() } : reminder
      ))
    );
    notify('Recordatorio marcado como enviado');
  };

  const copyReminder = async (id) => {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder) return;
    await Clipboard.setStringAsync(reminder.message || reminder.title || '');
    notify('Recordatorio copiado');
  };

  const deleteReminder = (id) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
    setSheet(null);
    notify('Recordatorio eliminado');
  };

  const refreshReminders = () => {
    setReminders((prev) =>
      [...prev].sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`))
    );
    notify('Recordatorios actualizados');
  };

  const registerPayment = (form = {}) => {
    const total = parseMoney(form.total_amount);
    const paid = parseMoney(form.paid_amount);
    const pending = Math.max(0, total - paid);
    const selectedPatient = patients.find((patient) => patient.id === form.patient_id || patient.name === form.patient);
    const record = {
      id: Date.now(),
      patient_id: selectedPatient?.id || form.patient_id || Date.now(),
      patient: form.patient?.trim() || selectedPatient?.name || 'Paciente',
      phone: selectedPatient?.phone || form.phone || '',
      tag: form.tag || selectedPatient?.tag || 'Tratamiento',
      total,
      paid,
      pending,
      method: form.method || 'Efectivo',
      date: form.date,
      reference: form.reference?.trim() || '',
      notes: form.notes?.trim() || '',
      status: paymentStatus(total, paid),
      history: paid > 0 ? [{
        id: `${Date.now()}-initial`,
        amount: paid,
        method: form.method || 'Efectivo',
        date: form.date,
        notes: form.reference?.trim() || 'Pago inicial',
      }] : [],
    };
    const nextPayments = [record, ...payments];
    const nextBalance = pendingForPatient(nextPayments, record.patient_id, record.patient);
    setPayments(nextPayments);
    setPatients((prev) =>
      prev.map((patient) => (
        patient.id === record.patient_id || patient.name.toLowerCase() === record.patient.toLowerCase()
          ? { ...patient, balance: nextBalance }
          : patient
      ))
    );
    setSheet(null);
    notify(`Pago de ${formatMoney(total)} registrado`);
  };

  const addPaymentInstallment = (paymentId, form = {}) => {
    const target = payments.find((payment) => payment.id === paymentId);
    if (!target) return;
    const amount = Math.min(parseMoney(form.amount), Number(target.pending || 0));
    const paid = Math.min(Number(target.total || 0), Number(target.paid || 0) + amount);
    const pending = Math.max(0, Number(target.total || 0) - paid);
    const updated = {
      ...target,
      paid,
      pending,
      method: form.method || target.method,
      status: paymentStatus(target.total, paid),
      history: [
        ...(target.history || []),
        {
          id: `${Date.now()}-abono`,
          amount,
          method: form.method || 'Efectivo',
          date: form.date,
          notes: form.notes?.trim() || 'Abono',
        },
      ],
    };
    const nextPayments = payments.map((payment) => (payment.id === paymentId ? updated : payment));
    const nextBalance = pendingForPatient(nextPayments, target.patient_id, target.patient);
    setPayments(nextPayments);
    setPatients((prev) =>
      prev.map((patient) => (
        patient.id === target.patient_id || patient.name.toLowerCase() === target.patient.toLowerCase()
          ? { ...patient, balance: nextBalance }
          : patient
      ))
    );
    setSheet(null);
    notify(`Abono de ${formatMoney(amount)} registrado`);
  };

  const deletePayment = (paymentId) => {
    const target = payments.find((payment) => payment.id === paymentId);
    if (!target) return;
    const nextPayments = payments.filter((payment) => payment.id !== paymentId);
    const remainingPending = nextPayments
      .filter((payment) => payment.patient_id === target.patient_id || payment.patient.toLowerCase() === target.patient.toLowerCase())
      .reduce((sum, payment) => sum + Number(payment.pending || 0), 0);
    setPayments(nextPayments);
    setPatients((prev) =>
      prev.map((patient) => (
        patient.id === target.patient_id || patient.name.toLowerCase() === target.patient.toLowerCase()
          ? { ...patient, balance: remainingPending }
          : patient
      ))
    );
    setSheet(null);
    notify('Pago eliminado');
  };

  const value = useMemo(() => ({
    theme,
    themeMode,
    setThemeMode,
    loggedIn,
    authLoading,
    currentUser,
    currentRole,
    currentPatientId,
    currentPatient: patients.find((patient) => patient.id === currentPatientId) || null,
    login,
    logout,
    selectedDay,
    setSelectedDay,
    selectedAgendaDate,
    setSelectedAgendaDate,
    patients,
    filteredPatients,
    payments,
    appointments,
    reminders,
    sheet,
    setSheet,
    toast,
    search,
    setSearch,
    selectedClinicalPatientId,
    setSelectedClinicalPatientId,
    selectedTooth,
    setSelectedTooth,
    odontogramByPatient,
    setOdontogramByPatient,
    clinicalRecords,
    setClinicalRecords,
    treatmentPlans,
    setTreatmentPlans,
    patientDocuments,
    patientPreferences,
    setPatientPreferences,
    followUps,
    setFollowUps,
    emergencyVisibility,
    setEmergencyVisibility,
    calendarEvents,
    setCalendarEvents,
    notify,
    notificationItems,
    openNotifications,
    addPatient,
    updatePatient,
    deletePatient,
    addAppointment,
    updateAppointment,
    requestPatientAppointment,
    updateCurrentPatient,
    createFollowUp,
    submitFollowUp,
    reviewFollowUp,
    closeFollowUp,
    addReminder,
    deleteReminder,
    registerPayment,
    addPaymentInstallment,
    deletePayment,
    sendReminder,
    markReminderSent,
    copyReminder,
    refreshReminders,
  }), [
    theme,
    themeMode,
    loggedIn,
    authLoading,
    currentUser,
    currentRole,
    currentPatientId,
    selectedDay,
    selectedAgendaDate,
    patients,
    filteredPatients,
    payments,
    appointments,
    reminders,
    sheet,
    toast,
    search,
    selectedClinicalPatientId,
    selectedTooth,
    odontogramByPatient,
    clinicalRecords,
    treatmentPlans,
    patientDocuments,
    patientPreferences,
    followUps,
    emergencyVisibility,
    calendarEvents,
    notificationItems,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState debe usarse dentro de AppStateProvider');
  return context;
}
