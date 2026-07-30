import { colors } from '../theme/palette';

const uiStatus = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  confirmada: 'Confirmada',
  finalizada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
  reprogramada: 'Reprogramada',
  solicitada: 'Solicitada',
  alerta: 'Alerta',
  respondido: 'Respondido',
  revisado: 'Revisado',
  cerrado: 'Cerrado',
  enviado: 'Enviado',
  pagado: 'Pagado',
  parcial: 'Parcial',
};

const apiStatus = {
  pendiente: 'pendiente',
  'en curso': 'en_curso',
  en_curso: 'en_curso',
  confirmada: 'confirmada',
  completada: 'finalizada',
  finalizada: 'finalizada',
  cancelada: 'cancelada',
  'no asistió': 'no_asistio',
  reprogramada: 'reprogramada',
  'reprogramación solicitada': 'reprogramada',
  solicitada: 'solicitada',
};

export function toUiStatus(value = '') {
  return uiStatus[String(value).toLocaleLowerCase('es-MX')] || value || 'Pendiente';
}

export function toApiStatus(value = '') {
  return apiStatus[String(value).toLocaleLowerCase('es-MX')] || String(value).toLocaleLowerCase('es-MX');
}

export function appointmentColor(status = '') {
  const normalized = toApiStatus(status);
  if (normalized === 'confirmada') return colors.blue;
  if (normalized === 'finalizada') return colors.green;
  if (normalized === 'cancelada') return colors.red;
  return colors.purple;
}

export function mapPatient(record, balances = {}) {
  const name = [record.first_name, record.last_name_paternal, record.last_name_maternal].filter(Boolean).join(' ');
  return {
    ...record,
    name,
    phone: record.phone_primary || '',
    tag: record.consultation_reason || record.occupation || 'Paciente',
    next: record.next_appointment || 'Sin cita',
    balance: Number(balances[record.id] || record.pending_balance || 0),
  };
}

export function mapAppointment(record) {
  const patient = [record.first_name, record.last_name_paternal, record.last_name_maternal].filter(Boolean).join(' ');
  const status = toUiStatus(record.status);
  return {
    ...record,
    patient,
    name: patient,
    date: record.appointment_date,
    time: record.start_time,
    service: record.service_name || record.appointment_type || 'Consulta',
    type: record.appointment_type,
    room: record.office_unit,
    status,
    color: appointmentColor(status),
  };
}

export function mapPayment(record) {
  const patient = [record.first_name, record.last_name_paternal, record.last_name_maternal].filter(Boolean).join(' ');
  return {
    ...record,
    patient,
    total: Number(record.total_amount || 0),
    paid: Number(record.amount_paid || 0),
    pending: Number(record.remaining_balance || 0),
    method: record.payment_method || 'efectivo',
    reference: record.payment_reference || '',
    date: record.payment_date,
    status: toUiStatus(record.status),
    history: record.transactions || [],
  };
}

export function mapReminder(record) {
  const patient = [record.first_name, record.last_name_paternal].filter(Boolean).join(' ');
  const scheduled = record.scheduled_at ? new Date(record.scheduled_at) : null;
  const type = record.reminder_type || 'cita';
  return {
    ...record,
    patient,
    title: type.includes('pago') ? 'Recordatorio de pago' : `Recordatorio para ${patient}`,
    type,
    area: type.includes('pago') ? 'Finanzas' : 'Agenda',
    date: scheduled && !Number.isNaN(scheduled.valueOf()) ? scheduled.toISOString().slice(0, 10) : '',
    time: scheduled && !Number.isNaN(scheduled.valueOf()) ? scheduled.toISOString().slice(11, 16) : '',
    status: toUiStatus(record.status),
  };
}

export function mapFollowUp(record) {
  const patient = [record.first_name, record.last_name_paternal].filter(Boolean).join(' ');
  return {
    ...record,
    patient,
    procedure: record.procedure_name,
    status: toUiStatus(record.status),
    reviewed: Boolean(record.reviewed_at),
    responses: (record.responses || []).map((response) => ({
      ...response,
      swelling: Boolean(response.swelling),
      bleeding: Boolean(response.bleeding),
      sensitivity: Boolean(response.sensitivity),
      fever: Boolean(response.fever),
      medicationTaken: Boolean(response.medication_taken),
      photoUri: response.photo_url || '',
      date: response.created_at,
      priority: toUiStatus(response.priority),
    })),
  };
}

export function mapService(record) {
  return {
    ...record,
    price: Number(record.base_price || 0),
    duration: Number(record.estimated_duration || 30),
    category: record.category_name || 'General',
  };
}
