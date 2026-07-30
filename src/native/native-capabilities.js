import * as Calendar from 'expo-calendar';

let notificationsConfigured = false;

function loadNotifications() {
  // Expo Go para Android ya no incluye el módulo remoto desde SDK 53.
  // Evitamos cargar el paquete completo allí para que el resto de la app
  // (cámara, calendario y seguimientos) continúe funcionando normalmente.
  const Notifications = require('expo-notifications');
  if (!notificationsConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationsConfigured = true;
  }
  return Notifications;
}

export async function ensureNotifications() {
  if (process.env.EXPO_OS === 'web') return false;
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  if (process.env.EXPO_OS === 'android') {
    await Notifications.setNotificationChannelAsync('healthy-reminder', {
      name: 'HealthyReminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#3b82f6',
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function scheduleLocalReminder({ title, body, date, url }) {
  if (!await ensureNotifications()) return null;
  const Notifications = loadNotifications();
  if (!Notifications) return null;
  const triggerDate = date instanceof Date ? date : new Date(date);
  const safeDate = triggerDate.getTime() > Date.now() ? triggerDate : new Date(Date.now() + 5000);
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: safeDate, channelId: 'healthy-reminder' },
  });
}

async function writableCalendarId() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((item) => item.allowsModifications);
  if (writable) return writable.id;
  if (process.env.EXPO_OS === 'ios') {
    const source = await Calendar.getDefaultCalendarAsync();
    return Calendar.createCalendarAsync({
      title: 'HealthyReminder',
      color: '#3b82f6',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: source.source?.id,
      source: source.source,
      name: 'HealthyReminder',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  }
  return Calendar.createCalendarAsync({
    title: 'HealthyReminder',
    color: '#3b82f6',
    entityType: Calendar.EntityTypes.EVENT,
    source: { isLocalAccount: true, name: 'HealthyReminder' },
    sourceId: undefined,
    name: 'HealthyReminder',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function addAppointmentToCalendar(appointment) {
  if (process.env.EXPO_OS === 'web') return null;
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (permission.status !== 'granted') return null;
  const calendarId = await writableCalendarId();
  const date = appointment.date || appointment.appointment_date;
  const start = new Date(`${date}T${appointment.time || '09:00'}:00`);
  const duration = Number(appointment.duration || 30);
  const end = appointment.end_time
    ? new Date(`${date}T${appointment.end_time}:00`)
    : new Date(start.getTime() + duration * 60000);
  return Calendar.createEventAsync(calendarId, {
    title: `Cita dental · ${appointment.service}`,
    startDate: start,
    endDate: end,
    location: appointment.room || 'HealthyReminder Dental',
    notes: 'Llega 10 minutos antes. Tel. 55 1234 5678',
    alarms: [{ relativeOffset: -1440 }, { relativeOffset: -120 }],
    timeZone: 'America/Mexico_City',
  });
}
