import { colors } from '../theme/palette';

export const baseStats = [
  { label: 'Pacientes', value: '128', tone: colors.blue, icon: 'P' },
  { label: 'Citas hoy', value: '6', tone: colors.purple, icon: 'C' },
  { label: 'Ingresos', value: '$18.4k', tone: colors.green, icon: '$' },
  { label: 'Pendiente', value: '$2.6k', tone: colors.red, icon: '!' },
];

export const patientsSeed = [
  { id: 1, name: 'Alan Ramirez', phone: '55 1234 9012', next: '10:30', balance: 0, tag: 'Ortodoncia' },
  { id: 2, name: 'Sofia Aguilar', phone: '55 8821 4400', next: '12:00', balance: 900, tag: 'Limpieza' },
  { id: 3, name: 'Oscar Medina', phone: '55 7120 3341', next: '16:20', balance: 1700, tag: 'Endodoncia' },
  { id: 4, name: 'Valeria Cano', phone: '55 2198 7720', next: 'Vie 10', balance: 0, tag: 'Revision' },
];

export const appointmentsSeed = [
  { id: 1, time: '09:00', patient: 'Alan Ramirez', service: 'Revision general', status: 'Confirmada', color: colors.blue },
  { id: 2, time: '10:30', patient: 'Sofia Aguilar', service: 'Limpieza dental', status: 'En sala', color: colors.green },
  { id: 3, time: '12:00', patient: 'Oscar Medina', service: 'Endodoncia', status: 'Pendiente', color: colors.amber },
  { id: 4, time: '16:20', patient: 'Valeria Cano', service: 'Ortodoncia', status: 'Confirmada', color: colors.purple },
];

export const remindersSeed = [
  {
    id: 1,
    patient_id: 2,
    patient: 'Sofia Aguilar',
    phone: '5588214400',
    title: 'Confirmar cita de Sofia',
    date: '2026-07-06',
    time: '18:00',
    type: 'Recordatorio 24h antes',
    area: 'Agenda',
    status: 'Pendiente',
    message: 'Hola Sofia Aguilar, te recordamos que tienes una cita programada en HealthyReminder Dental. Si tienes alguna duda, no dudes en contactarnos. Te esperamos.',
  },
  {
    id: 2,
    patient_id: 3,
    patient: 'Oscar Medina',
    phone: '5571203341',
    title: 'Enviar recordatorio de pago',
    date: '2026-07-07',
    time: '09:00',
    type: 'Recordatorio de pago',
    area: 'Finanzas',
    status: 'Pendiente',
    message: 'Hola Oscar Medina, te recordamos que tienes un saldo pendiente en HealthyReminder Dental. Puedes responder este mensaje si necesitas apoyo con tu pago.',
  },
  {
    id: 3,
    patient_id: 1,
    patient: 'Alan Ramirez',
    phone: '5512349012',
    title: 'Revisar inventario de resina',
    date: '2026-07-10',
    time: '12:00',
    type: 'Seguimiento clinico',
    area: 'Clinico',
    status: 'Enviado',
    message: 'Hola Alan Ramirez, esperamos que te encuentres muy bien. Damos seguimiento a tu tratamiento y quedamos atentos a cualquier molestia o duda.',
  },
];

export const paymentsSeed = patientsSeed
  .filter((patient) => patient.balance > 0)
  .map((patient, index) => ({
    id: 900 + patient.id,
    patient_id: patient.id,
    patient: patient.name,
    phone: patient.phone,
    tag: patient.tag,
    total: patient.balance,
    paid: 0,
    pending: patient.balance,
    method: index % 2 ? 'Tarjeta' : 'Efectivo',
    date: '2026-07-06',
    reference: '',
    notes: 'Saldo pendiente del tratamiento.',
    status: 'Pendiente',
    history: [],
  }));

export const weeklyIncome = [45, 62, 38, 75, 54, 88, 69];
export const monthlyIncome = [
  { month: 'Ene', total: 11200 },
  { month: 'Feb', total: 14800 },
  { month: 'Mar', total: 9800 },
  { month: 'Abr', total: 16400 },
  { month: 'May', total: 18100 },
  { month: 'Jun', total: 15800 },
  { month: 'Jul', total: 18400 },
];
export const topServices = [
  { name: 'Limpieza dental', count: 38, revenue: 22800, color: colors.blue },
  { name: 'Ortodoncia', count: 24, revenue: 36000, color: colors.purple },
  { name: 'Endodoncia', count: 17, revenue: 28900, color: colors.amber },
  { name: 'Revision general', count: 15, revenue: 9000, color: colors.green },
];
export const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
export const teeth = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28', '48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
export const conditions = [
  { id: 'sano', label: 'Sano', color: colors.green, marker: 'S' },
  { id: 'caries', label: 'Caries', color: colors.red, marker: 'C' },
  { id: 'restauracion', label: 'Restauracion', color: colors.blue, marker: 'R' },
  { id: 'corona', label: 'Corona', color: colors.purple, marker: 'Co' },
  { id: 'endodoncia', label: 'Endodoncia', color: colors.amber, marker: 'E' },
  { id: 'ausente', label: 'Ausente', color: '#6b7280', marker: 'A' },
  { id: 'implante', label: 'Implante', color: '#06b6d4', marker: 'I' },
  { id: 'protesis', label: 'Protesis', color: colors.pink, marker: 'P' },
  { id: 'fractura', label: 'Fractura', color: '#dc2626', marker: 'F' },
  { id: 'movilidad', label: 'Movilidad', color: '#d97706', marker: 'M' },
];
