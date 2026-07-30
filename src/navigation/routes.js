export const routeByScreen = {
  dashboard: '/dashboard',
  patients: '/patients',
  agenda: '/agenda',
  clinical: '/clinical',
  payments: '/payments',
  reminders: '/reminders',
  followups: '/followups',
  assistant: '/assistant',
  settings: '/settings',
  more: '/more',
};

export const titleByScreen = {
  dashboard: 'Dashboard',
  patients: 'Pacientes',
  agenda: 'Agenda',
  clinical: 'Clinico',
  payments: 'Pagos',
  reminders: 'Recordatorios',
  followups: 'Seguimientos',
  assistant: 'Asistente IA',
  settings: 'Ajustes',
  more: 'Mas',
};

export function screenFromPath(pathname = '') {
  const clean = pathname.split('?')[0].replace(/^\/+/, '').split('/')[0] || 'dashboard';
  return routeByScreen[clean] ? clean : 'dashboard';
}

export function pathForScreen(screen = 'dashboard') {
  return routeByScreen[screen] || routeByScreen.dashboard;
}
