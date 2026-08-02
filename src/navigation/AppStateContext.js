import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import 'expo-sqlite/localStorage/install';
import { appointmentsSeed, patientsSeed, paymentsSeed, remindersSeed } from '../data/mock-data';
import { colors, themes } from '../theme/palette';
import { loginMobile, logoutMobile, restoreMobileSession } from '../api/auth';
import { api } from '../api/client';
import { resources } from '../api/resources';
import {
  appointmentColor,
  mapAppointment,
  mapFollowUp,
  mapNotification,
  mapPatient,
  mapPayment,
  mapReminder,
  mapService,
  toApiStatus,
  toUiStatus,
} from '../api/adapters';

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
  const [themeMode, setThemeMode] = useState(() => {
    try { return globalThis.localStorage?.getItem('hr_theme_mode') || 'light'; }
    catch { return 'light'; }
  });
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
  const [notifications, setNotifications] = useState([]);
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
      dentist: 'Equipo clínico',
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
  const [patientDocuments, setPatientDocuments] = useState([
    { id: 1, patient_id: 1, type: 'Receta', title: 'Indicaciones posteriores a profilaxis', date: '2026-05-20', detail: 'Enjuague bucal sin alcohol, dos veces al día durante 7 días.', status: 'Vigente' },
    { id: 2, patient_id: 1, type: 'Presupuesto', title: 'Plan restaurativo', date: '2026-05-20', detail: 'Total estimado $3,750 MXN.', status: 'Aceptado' },
    { id: 3, patient_id: 1, type: 'Consentimiento', title: 'Consentimiento para restauración', date: '2026-06-18', detail: 'Documento aceptado digitalmente.', status: 'Firmado' },
  ]);
  const [patientPreferences, setPatientPreferences] = useState(() => {
    const defaults = { push: true, email: true, whatsapp: true, appointmentReminders: true, paymentReminders: true };
    try { return { ...defaults, ...JSON.parse(globalThis.localStorage?.getItem('hr_patient_preferences') || '{}') }; }
    catch { return defaults; }
  });
  const [staffNotificationsEnabled, setStaffNotificationsEnabled] = useState(() => {
    try { return globalThis.localStorage?.getItem('hr_staff_notifications') !== 'false'; }
    catch { return true; }
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
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const applyStaffSnapshot = (snapshot) => {
    const mappedPayments = (snapshot.paymentResult.data || []).map(mapPayment);
    const balances = mappedPayments.reduce((output, payment) => ({
      ...output,
      [payment.patient_id]: Number(output[payment.patient_id] || 0) + Number(payment.pending || 0),
    }), {});
    setPatients((snapshot.patientResult.data || []).map((patient) => mapPatient(patient, balances)));
    setAppointments((snapshot.appointmentResult.data || []).map(mapAppointment));
    setPayments(mappedPayments);
    setReminders((snapshot.reminderResult.data || []).map(mapReminder));
    setNotifications((snapshot.notificationResult.notifications || []).map(mapNotification));
    setFollowUps((snapshot.followUpResult.data || []).map(mapFollowUp));
    setClinicalRecords(snapshot.clinicalResult.data || []);
    setServiceCatalog((snapshot.serviceResult.data || []).map(mapService));
    setDashboardData(snapshot.dashboardResult);
  };

  const hydrateStaffData = async ({ silent = false } = {}) => {
    if (!silent) setDataLoading(true);
    try {
      const [
        patientResult,
        appointmentResult,
        paymentResult,
        reminderResult,
        followUpResult,
        clinicalResult,
        serviceResult,
        dashboardResult,
        notificationResult,
      ] = await Promise.all([
        resources.patients(),
        resources.appointments(),
        resources.payments(),
        resources.reminders(),
        resources.followUps(),
        resources.clinical(),
        resources.services(),
        resources.dashboard(),
        resources.notifications(),
      ]);
      applyStaffSnapshot({
        patientResult, appointmentResult, paymentResult, reminderResult,
        followUpResult, clinicalResult, serviceResult, dashboardResult, notificationResult,
      });
    } finally {
      if (!silent) setDataLoading(false);
    }
  };

  const refreshDashboard = async () => {
    const result = await resources.dashboard();
    setDashboardData(result);
    return result;
  };

  const hydratePatientData = async (patientId) => {
    const [
      profile,
      appointmentResult,
      bookingRequestResult,
      paymentResult,
      followUpResult,
      clinicalSummary,
      serviceResult,
      reminderResult,
      odontogramResult,
      notificationResult,
    ] = await Promise.all([
      api.get('/me'),
      api.get('/me/appointments'),
      api.get('/me/appointment-requests'),
      api.get('/me/payments'),
      api.get('/follow-ups'),
      api.get('/me/clinical-summary'),
      api.get('/me/services'),
      api.get('/me/reminders'),
      api.get('/me/odontogram'),
      api.get('/me/notifications'),
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
    const confirmedAppointments = (appointmentResult.data || []).map((item) => mapAppointment({
      ...item,
      patient_id: patientId,
      first_name: profile.first_name,
      last_name_paternal: profile.last_name_paternal,
      last_name_maternal: profile.last_name_maternal,
    }));
    const bookingRequests = (bookingRequestResult.data || []).map((item) => ({
      ...item,
      id: `booking-request-${item.id}`,
      request_id: item.id,
      is_booking_request: true,
      patient_id: patientId,
      patient: fullName,
      date: item.requested_date,
      time: item.requested_start_time,
      end_time: item.requested_end_time,
      service: item.service_name || 'Consulta solicitada',
      room: 'Pendiente de aprobación',
      status: item.status === 'rechazada' ? 'Solicitud rechazada' : 'Solicitud pendiente',
    }));
    setAppointments([...bookingRequests, ...confirmedAppointments]);
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
    setFollowUps((followUpResult.data || []).map(mapFollowUp));
    setClinicalRecords((clinicalSummary.records || []).map((record) => ({
      ...record,
      patient_id: patientId,
      date: record.record_date,
    })));
    setTreatmentPlans((clinicalSummary.treatment_plans || []).map((plan) => ({
      ...plan,
      patient_id: patientId,
      name: plan.plan_name,
      progress: plan.status === 'finalizado' ? 100 : plan.status === 'aceptado' ? 50 : 0,
      next_step: plan.notes || 'Consulta con tu dentista',
      started_at: plan.created_at ? String(plan.created_at).slice(0, 10) : '',
      dentist: 'Equipo clínico',
      items: (plan.items || []).map((item) => ({
        ...item,
        name: item.service_name || item.description,
        tooth: item.tooth_number || 'General',
        price: Number(item.total_price || 0),
        status: toUiStatus(item.status),
      })),
    })));
    const prescriptions = (clinicalSummary.prescriptions || []).map((prescription) => ({
      id: `prescription-${prescription.id}`,
      patient_id: patientId,
      type: 'Receta',
      title: prescription.diagnosis || 'Receta médica',
      date: String(prescription.prescription_date || '').slice(0, 10),
      detail: (prescription.items || []).map((item) => (
        `${item.medication}${item.dosage ? ` ${item.dosage}` : ''}${item.frequency ? `, ${item.frequency}` : ''}`
      )).join(' · ') || prescription.notes || 'Indicaciones disponibles en tu expediente.',
      status: 'Vigente',
    }));
    const budgets = (clinicalSummary.treatment_plans || []).map((plan) => ({
      id: `plan-${plan.id}`,
      patient_id: patientId,
      type: 'Presupuesto',
      title: plan.plan_name,
      date: String(plan.created_at || '').slice(0, 10),
      detail: `Total estimado $${Number(plan.total || 0).toLocaleString('es-MX')} MXN.`,
      status: toUiStatus(plan.status),
    }));
    const consents = (clinicalSummary.consents || []).map((consent) => ({
      id: `consent-${consent.id}`,
      patient_id: patientId,
      type: 'Consentimiento',
      title: consent.title,
      date: String(consent.signed_at || consent.created_at || '').slice(0, 10),
      detail: consent.signed_at ? 'Documento aceptado digitalmente.' : 'Pendiente de firma.',
      status: toUiStatus(consent.status),
    }));
    setPatientDocuments([...prescriptions, ...budgets, ...consents]);
    setReminders((reminderResult.data || []).map((reminder) => mapReminder({
      ...reminder,
      first_name: profile.first_name,
      last_name_paternal: profile.last_name_paternal,
    })));
    setNotifications((notificationResult.notifications || []).map(mapNotification));
    setOdontogramByPatient({
      [patientId]: (odontogramResult.data || []).reduce((entries, entry) => ({
        ...entries,
        [String(entry.tooth_number)]: entry,
      }), {}),
    });
    setServiceCatalog((serviceResult.data || []).map(mapService));
  };

  useEffect(() => {
    restoreMobileSession()
      .then(async (user) => {
        if (!user) return;
        setCurrentUser(user);
        setCurrentRole(user.role);
        if (user.role === 'patient' && user.patient_id) {
          setCurrentPatientId(user.patient_id);
          await hydratePatientData(user.patient_id);
        } else if (['admin', 'dentist'].includes(user.role)) {
          await hydrateStaffData();
        }
        setLoggedIn(true);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!loggedIn || sheet) return undefined;
    let syncing = false;
    const sync = async () => {
      if (syncing) return;
      syncing = true;
      try {
        if (currentRole === 'patient' && currentPatientId) await hydratePatientData(currentPatientId);
        else if (['admin', 'dentist'].includes(currentRole)) await hydrateStaffData({ silent: true });
      } catch {
        // Conserva la última información válida y vuelve a intentar en el siguiente ciclo.
      } finally {
        syncing = false;
      }
    };
    const interval = setInterval(sync, 15000);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') sync();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loggedIn, currentRole, currentPatientId, sheet]);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem('hr_emergency_visibility', JSON.stringify(emergencyVisibility));
      // Los expedientes contienen PII y datos clinicos: se conservan en memoria
      // y se recargan desde la API, nunca se persisten en localStorage/SQLite.
      globalThis.localStorage?.removeItem('hr_emergency_patient');
    } catch {
      // El estado sigue disponible en memoria cuando el almacenamiento no existe.
    }
  }, [emergencyVisibility, patients, currentPatientId]);

  useEffect(() => {
    try { globalThis.localStorage?.setItem('hr_theme_mode', themeMode); } catch {}
  }, [themeMode]);

  useEffect(() => {
    try { globalThis.localStorage?.setItem('hr_patient_preferences', JSON.stringify(patientPreferences)); } catch {}
  }, [patientPreferences]);

  useEffect(() => {
    try { globalThis.localStorage?.setItem('hr_staff_notifications', String(staffNotificationsEnabled)); } catch {}
  }, [staffNotificationsEnabled]);

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
    } else await hydrateStaffData();
    setLoggedIn(true);
    return user;
  };

  const logout = async () => {
    await logoutMobile();
    setLoggedIn(false);
    setCurrentUser(null);
    setSheet(null);
  };

  const updateAppointment = async (id, changes = {}) => {
    try {
      const payload = { ...changes, ...(changes.status ? { status: toApiStatus(changes.status) } : {}) };
      const updated = currentRole === 'patient'
        ? await api.put(`/me/appointments/${id}`, payload)
        : await resources.updateAppointment(id, payload);
      setAppointments((prev) => prev.map((appointment) => (
        appointment.id === id
          ? { ...appointment, ...changes, ...updated, status: changes.status || appointment.status, color: appointmentColor(changes.status || updated.status) }
          : appointment
      )));
      if (currentRole !== 'patient') refreshDashboard().catch(() => {});
      notify(changes.status ? `Cita ${changes.status.toLowerCase()}` : 'Cita actualizada');
      return updated;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const requestPatientAppointment = async (form = {}) => {
    const patient = patients.find((item) => item.id === currentPatientId);
    if (!patient) return;
    try {
      const service = serviceCatalog.find((item) => item.id === form.service_id || item.name === form.service);
      const created = await api.post('/me/appointment-requests', {
        appointment_date: form.date,
        start_time: form.time,
        end_time: form.end_time || (() => {
          const [hours, minutes] = String(form.time || '09:00').split(':').map(Number);
          const date = new Date(2000, 0, 1, hours, minutes + Number(service?.duration || 30));
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        })(),
        duration: form.duration || service?.duration || 30,
        service_id: service?.id || null,
        observations: form.reason || '',
      });
      setAppointments((prev) => [{
        ...created,
        id: `booking-request-${created.id}`,
        request_id: created.id,
        is_booking_request: true,
        patient_id: patient.id,
        patient: patient.name,
        date: created.requested_date,
        time: created.requested_start_time,
        end_time: created.requested_end_time,
        service: created.service_name || service?.name || 'Consulta solicitada',
        room: 'Pendiente de aprobación',
        status: 'Solicitud pendiente',
      }, ...prev]);
      notify('Solicitud enviada. Aún no es una cita confirmada.');
      return created;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const requestPatientReschedule = async (appointmentId, form = {}) => {
    const target = appointments.find((item) => item.id === appointmentId);
    if (!target) throw new Error('Cita no encontrada.');
    try {
      const duration = Number(target.duration || 30);
      const [hours, minutes] = String(form.time || '').split(':').map(Number);
      const end = new Date(2000, 0, 1, hours, minutes + duration);
      const request = await api.post(`/me/appointments/${appointmentId}/reschedule-requests`, {
        requested_date: form.date,
        requested_start_time: form.time,
        requested_end_time: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
        reason: form.reason || '',
      });
      setAppointments((prev) => prev.map((appointment) => appointment.id === appointmentId ? {
        ...appointment,
        reschedule_request_id: request.id,
        reschedule_request_status: request.status,
        reschedule_requested_date: request.requested_date,
        reschedule_requested_start_time: request.requested_start_time,
        reschedule_requested_end_time: request.requested_end_time,
        reschedule_reason: request.reason,
      } : appointment));
      notify('Solicitud enviada. Tu cita original sigue vigente.');
      return request;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const refreshPatientAppointments = async () => {
    if (currentRole !== 'patient') return;
    try {
      const patient = patients.find((item) => item.id === currentPatientId);
      const [result, bookingResult] = await Promise.all([
        api.get('/me/appointments'),
        api.get('/me/appointment-requests'),
      ]);
      const confirmed = (result.data || []).map((record) => mapAppointment({
        ...record,
        first_name: patient?.first_name,
        last_name_paternal: patient?.last_name_paternal,
        last_name_maternal: patient?.last_name_maternal,
      }));
      const requests = (bookingResult.data || []).map((item) => ({
        ...item,
        id: `booking-request-${item.id}`,
        request_id: item.id,
        is_booking_request: true,
        patient_id: currentPatientId,
        patient: patient?.name,
        date: item.requested_date,
        time: item.requested_start_time,
        end_time: item.requested_end_time,
        service: item.service_name || 'Consulta solicitada',
        room: 'Pendiente de aprobación',
        status: item.status === 'rechazada' ? 'Solicitud rechazada' : 'Solicitud pendiente',
      }));
      setAppointments([...requests, ...confirmed]);
      notify('Citas actualizadas');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const updateCurrentPatient = async (changes = {}) => {
    try {
      const payload = { ...changes, phone_primary: changes.phone_primary || changes.phone };
      await api.put('/me', payload);
      setPatients((prev) => prev.map((patient) => patient.id === currentPatientId ? mapPatient({ ...patient, ...payload }) : patient));
      notify('Perfil actualizado');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const createFollowUp = async (form = {}) => {
    const patient = patients.find((item) => item.id === form.patient_id);
    if (!patient) {
      notify('Selecciona un paciente');
      return;
    }
    try {
      const created = await resources.createFollowUp({
        patient_id: patient.id,
        procedure_name: form.procedure || 'Procedimiento dental',
        treatment_date: form.treatment_date || new Date().toISOString().slice(0, 10),
        next_check_at: form.next_check_at || new Date(Date.now() + 86400000).toISOString(),
        instructions: form.instructions || 'Sigue las indicaciones de tu dentista.',
        medication: form.medication || 'Sin medicamento registrado.',
      });
      setFollowUps((prev) => [mapFollowUp({
        ...created,
        first_name: patient.first_name,
        last_name_paternal: patient.last_name_paternal,
        responses: [],
      }), ...prev]);
      notify('Seguimiento programado');
      return created;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const submitFollowUp = async (followUpId, response = {}) => {
    try {
      const created = await resources.submitFollowUp(followUpId, {
        ...response,
        medication_taken: response.medicationTaken,
        photo_url: response.photoData || '',
      });
      const mapped = mapFollowUp({ responses: [created] }).responses[0];
      setFollowUps((prev) => prev.map((item) => item.id === followUpId ? {
        ...item,
        status: created.priority === 'alta' ? 'Alerta' : 'Respondido',
        reviewed: false,
        responses: [...(item.responses || []), mapped],
      } : item));
      notify(created.priority === 'alta' ? 'Reporte enviado para revisión prioritaria' : 'Seguimiento enviado');
      return mapped.priority;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const reviewFollowUp = async (followUpId, note = '') => {
    try {
      await resources.reviewFollowUp(followUpId, { status: 'revisado', dentist_note: note || 'Revisado por el equipo dental.' });
      setFollowUps((prev) => prev.map((item) => item.id === followUpId ? { ...item, reviewed: true, status: 'Revisado', dentist_note: note } : item));
      notify('Seguimiento marcado como revisado');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const closeFollowUp = async (followUpId) => {
    try {
      await resources.reviewFollowUp(followUpId, { status: 'cerrado' });
      setFollowUps((prev) => prev.map((item) => item.id === followUpId ? { ...item, status: 'Cerrado', reviewed: true } : item));
      notify('Seguimiento cerrado');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const pendingPaymentsTotal = payments.reduce((sum, payment) => sum + Number(payment.pending || 0), 0);
  const pendingReminderCount = reminders.filter((reminder) => reminder.status !== 'Enviado').length;
  const legacyNotificationItems = [
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
  const notificationsEnabled = currentRole === 'patient' ? patientPreferences.push : staffNotificationsEnabled;
  const notificationItems = notificationsEnabled ? notifications : [];
  const unreadNotificationCount = notificationItems.filter((item) => !item.is_read).length;

  const openNotifications = () => {
    setSheet({ type: 'notifications', data: { items: notificationItems } });
  };

  const markNotificationRead = async (item) => {
    if (!item || item.is_read || !notifications.length) return;
    try {
      if (currentRole === 'patient') {
        await api.put(`/me/notifications/${encodeURIComponent(item.id)}/read`, {});
      } else {
        await resources.markNotificationRead(item.id);
      }
      setNotifications((current) => current.map((notification) => (
        notification.id === item.id ? { ...notification, is_read: true } : notification
      )));
    } catch (error) {
      notify(error.message);
    }
  };

  const addPatient = async (form = {}) => {
    try {
      const created = await resources.createPatient(form);
      setPatients((prev) => [mapPatient(created), ...prev]);
      refreshDashboard().catch(() => {});
      setSheet(null);
      notify('Paciente agregado');
      return created;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const updatePatient = async (id, form = {}) => {
    try {
      const updated = await resources.updatePatient(id, form);
      const mapped = mapPatient(updated);
      setPatients((prev) => prev.map((patient) => patient.id === id ? { ...patient, ...mapped, balance: patient.balance, next: patient.next } : patient));
      setAppointments((prev) => prev.map((appointment) => appointment.patient_id === id ? { ...appointment, patient: mapped.name, name: mapped.name } : appointment));
      setPayments((prev) => prev.map((payment) => payment.patient_id === id ? { ...payment, patient: mapped.name, phone: mapped.phone, tag: mapped.tag } : payment));
      refreshDashboard().catch(() => {});
      setSheet(null);
      notify('Expediente actualizado');
      return updated;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const deletePatient = async (id) => {
    try {
      await resources.deletePatient(id);
      setPatients((prev) => prev.filter((patient) => patient.id !== id));
      setAppointments((prev) => prev.filter((appointment) => appointment.patient_id !== id));
      setPayments((prev) => prev.filter((payment) => payment.patient_id !== id));
      setOdontogramByPatient((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (selectedClinicalPatientId === id) setSelectedClinicalPatientId('');
      refreshDashboard().catch(() => {});
      setSheet(null);
      notify('Paciente eliminado');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const addAppointment = async (form = {}) => {
    try {
      const patient = patients.find((item) => item.id === form.patient_id);
      const service = serviceCatalog.find((item) => item.id === form.service_id || item.name === form.service);
      const created = await resources.createAppointment({
        patient_id: form.patient_id,
        service_id: service?.id || null,
        appointment_date: form.date,
        start_time: form.start_time || form.time,
        end_time: form.end_time,
        duration: Number(form.duration) || 30,
        appointment_type: form.type || 'consulta',
        office_unit: form.room || 'Consultorio 1',
        status: toApiStatus(form.status || 'pendiente'),
        observations: form.observations || '',
        internal_notes: form.internal_notes || '',
      });
      setAppointments((prev) => [mapAppointment({
        ...created,
        first_name: patient?.first_name,
        last_name_paternal: patient?.last_name_paternal,
        service_name: service?.name,
      }), ...prev]);
      refreshDashboard().catch(() => {});
      setSheet(null);
      notify('Cita programada');
      return created;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const addReminder = async (form = {}) => {
    try {
      const patient = patients.find((item) => item.id === form.patient_id);
      const scheduledAt = form.date
        ? new Date(`${form.date}T${form.time || '09:00'}:00`).toISOString()
        : new Date().toISOString();
      const created = await resources.createReminder({
        patient_id: form.patient_id,
        appointment_id: form.appointment_id || null,
        reminder_type: form.type || 'cita',
        channel: form.channel || 'whatsapp',
        phone: form.phone || patient?.phone || '',
        message: form.message,
        scheduled_at: scheduledAt,
      });
      setReminders((prev) => [mapReminder({
        ...created,
        first_name: patient?.first_name,
        last_name_paternal: patient?.last_name_paternal,
      }), ...prev]);
      setSheet(null);
      notify('Recordatorio creado');
      return created;
    } catch (error) {
      notify(error.message);
      throw error;
    }
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

  const markReminderSent = async (id) => {
    try {
      const updated = await resources.markReminderSent(id);
      setReminders((prev) => prev.map((reminder) => reminder.id === id ? { ...reminder, ...updated, status: 'Enviado' } : reminder));
      notify('Recordatorio marcado como enviado');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const copyReminder = async (id) => {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder) return;
    await Clipboard.setStringAsync(reminder.message || reminder.title || '');
    notify('Recordatorio copiado');
  };

  const deleteReminder = async (id) => {
    try {
      await resources.deleteReminder(id);
      setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
      setSheet(null);
      notify('Recordatorio eliminado');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const refreshReminders = async () => {
    try {
      const result = await resources.reminders();
      setReminders((result.data || []).map(mapReminder));
      notify('Recordatorios actualizados');
    } catch (error) {
      notify(error.message);
    }
  };

  const loadOdontogram = async (patientId) => {
    if (!patientId) return;
    try {
      const result = await resources.odontogram(patientId);
      const toothMap = {};
      for (const entry of result.data || []) {
        toothMap[String(entry.tooth_number)] = {
          id: entry.id,
          condition: entry.condition,
          note: entry.description || '',
          updatedAt: entry.updated_at || entry.created_at,
        };
      }
      setOdontogramByPatient((prev) => ({ ...prev, [patientId]: toothMap }));
    } catch (error) {
      notify(error.message);
    }
  };

  const saveOdontogramEntry = async (patientId, tooth, condition, note = '') => {
    const existing = odontogramByPatient[patientId]?.[String(tooth)];
    try {
      const saved = existing?.id
        ? await resources.updateOdontogram(existing.id, { condition, description: note })
        : await resources.saveOdontogram({ patient_id: patientId, tooth_number: Number(tooth), condition, description: note });
      setOdontogramByPatient((prev) => ({
        ...prev,
        [patientId]: {
          ...(prev[patientId] || {}),
          [String(tooth)]: { id: saved.id, condition: saved.condition, note: saved.description || '', updatedAt: saved.updated_at || saved.created_at },
        },
      }));
      notify(`Pieza ${tooth} registrada`);
      return saved;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const deleteOdontogramEntry = async (patientId, tooth) => {
    const existing = odontogramByPatient[patientId]?.[String(tooth)];
    try {
      if (existing?.id) await resources.deleteOdontogram(existing.id);
      setOdontogramByPatient((prev) => {
        const patientMap = { ...(prev[patientId] || {}) };
        delete patientMap[String(tooth)];
        return { ...prev, [patientId]: patientMap };
      });
      notify(`Registro de pieza ${tooth} eliminado`);
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const registerPayment = async (form = {}) => {
    const total = parseMoney(form.total_amount);
    const paid = parseMoney(form.paid_amount);
    const selectedPatient = patients.find((patient) => patient.id === form.patient_id || patient.name === form.patient);
    try {
      const created = await resources.createPayment({
        patient_id: selectedPatient?.id || form.patient_id,
        total_amount: total,
        amount_paid: paid,
        payment_method: form.method || 'efectivo',
        payment_reference: form.reference || '',
        payment_date: form.date,
        notes: form.notes || '',
      });
      const mapped = mapPayment({
        ...created,
        first_name: selectedPatient?.first_name,
        last_name_paternal: selectedPatient?.last_name_paternal,
      });
      setPayments((prev) => [mapped, ...prev]);
      setPatients((prev) => prev.map((patient) => patient.id === mapped.patient_id ? { ...patient, balance: Number(patient.balance || 0) + mapped.pending } : patient));
      refreshDashboard().catch(() => {});
      setSheet(null);
      notify(`Pago de ${formatMoney(total)} registrado`);
      return created;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const addPaymentInstallment = async (paymentId, form = {}) => {
    const target = payments.find((payment) => payment.id === paymentId);
    if (!target) return;
    const amount = parseMoney(form.amount);
    if (amount <= 0 || amount > Number(target.pending || 0)) {
      throw new Error('El monto del abono no es válido.');
    }
    try {
      const updated = await resources.addPayment(paymentId, {
        amount,
        payment_method: form.method || 'efectivo',
        payment_reference: form.reference || '',
        transaction_date: form.date,
        notes: form.notes || '',
      });
      const mapped = mapPayment({ ...updated, first_name: target.patient.split(' ')[0], last_name_paternal: target.patient.split(' ').slice(1).join(' ') });
      setPayments((prev) => prev.map((payment) => payment.id === paymentId ? mapped : payment));
      setPatients((prev) => prev.map((patient) => patient.id === target.patient_id ? { ...patient, balance: Math.max(0, Number(patient.balance || 0) - amount) } : patient));
      refreshDashboard().catch(() => {});
      setSheet(null);
      notify(`Abono de ${formatMoney(amount)} registrado`);
      return updated;
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const deletePayment = async (paymentId) => {
    const target = payments.find((payment) => payment.id === paymentId);
    if (!target) return;
    try {
      await resources.deletePayment(paymentId);
      const nextPayments = payments.filter((payment) => payment.id !== paymentId);
      const remainingPending = nextPayments.filter((payment) => payment.patient_id === target.patient_id).reduce((sum, payment) => sum + Number(payment.pending || 0), 0);
      setPayments(nextPayments);
      setPatients((prev) => prev.map((patient) => patient.id === target.patient_id ? { ...patient, balance: remainingPending } : patient));
      refreshDashboard().catch(() => {});
      setSheet(null);
      notify('Pago eliminado');
    } catch (error) {
      notify(error.message);
      throw error;
    }
  };

  const value = useMemo(() => ({
    theme,
    themeMode,
    setThemeMode,
    loggedIn,
    authLoading,
    currentUser,
    dataLoading,
    dashboardData,
    serviceCatalog,
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
    loadOdontogram,
    saveOdontogramEntry,
    deleteOdontogramEntry,
    clinicalRecords,
    setClinicalRecords,
    treatmentPlans,
    setTreatmentPlans,
    patientDocuments,
    patientPreferences,
    setPatientPreferences,
    staffNotificationsEnabled,
    setStaffNotificationsEnabled,
    followUps,
    setFollowUps,
    emergencyVisibility,
    setEmergencyVisibility,
    calendarEvents,
    setCalendarEvents,
    notify,
    notificationItems,
    unreadNotificationCount,
    openNotifications,
    markNotificationRead,
    addPatient,
    updatePatient,
    deletePatient,
    addAppointment,
    updateAppointment,
    requestPatientAppointment,
    requestPatientReschedule,
    refreshPatientAppointments,
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
    hydrateStaffData,
  }), [
    theme,
    themeMode,
    loggedIn,
    authLoading,
    currentUser,
    dataLoading,
    dashboardData,
    serviceCatalog,
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
    staffNotificationsEnabled,
    followUps,
    emergencyVisibility,
    calendarEvents,
    notificationItems,
    unreadNotificationCount,
    notifications,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState debe usarse dentro de AppStateProvider');
  return context;
}
