import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/palette';
import { useAppState } from '../navigation/AppStateContext';
import { appointmentDate, money, OutlineButton, PrimaryButton, SectionTitle, StatusChip, toneForStatus } from './patient-components';
import { patientStyles as s } from './patient-ui';

export function PatientHomeScreen() {
  const state = useAppState();
  const router = useRouter();
  const patient = state.currentPatient;
  const appointments = state.appointments.filter((item) => item.patient_id === state.currentPatientId || item.patient === patient?.name);
  const upcoming = appointments.find((item) => {
    if (['Cancelada', 'Completada'].includes(item.status)) return false;
    const date = appointmentDate(item);
    const time = String(item.time || item.start_time || '23:59').slice(0, 5);
    const moment = new Date(`${date}T${time}:00`);
    return Number.isNaN(moment.valueOf()) || moment >= new Date();
  });
  const payments = state.payments.filter((item) => item.patient_id === state.currentPatientId || item.patient === patient?.name);
  const pending = payments.reduce((sum, item) => sum + Number(item.pending || 0), 0);
  const plan = state.treatmentPlans.find((item) => item.patient_id === state.currentPatientId);
  const reminder = state.reminders.find((item) => item.patient_id === state.currentPatientId);
  const activeFollowUp = state.followUps.find((item) => item.patient_id === state.currentPatientId && item.status !== 'Cerrado');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
        <Text selectable style={[s.eyebrow, { color: colors.blue }]}>Hola, {patient?.name?.split(' ')[0] || 'paciente'}</Text>
        <Text selectable style={[s.title, { color: state.theme.text }]}>Tu salud dental, siempre contigo</Text>
        <Text selectable style={[s.subtitle, { color: state.theme.muted }]}>
          Revisa tu próxima cita, el avance de tu tratamiento y tus pagos desde un solo lugar.
        </Text>
      </View>

      <View style={s.grid}>
        <View style={[s.stat, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
          <Text selectable style={[s.statValue, { color: colors.blue }]}>{appointments.length}</Text>
          <Text selectable style={[s.statLabel, { color: state.theme.muted }]}>Citas registradas</Text>
        </View>
        <View style={[s.stat, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
          <Text selectable style={[s.statValue, { color: pending ? colors.red : colors.green }]}>{money(pending).replace(' MXN', '')}</Text>
          <Text selectable style={[s.statLabel, { color: state.theme.muted }]}>Saldo pendiente</Text>
        </View>
      </View>

      <SectionTitle theme={state.theme} action="Ver todas" onPress={() => router.replace('/patient-appointments')}>Próxima cita</SectionTitle>
      {upcoming ? (
        <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
          <View style={s.between}>
            <View style={{ flex: 1 }}>
              <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{upcoming.service}</Text>
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
                {appointmentDate(upcoming)} · {upcoming.time}
              </Text>
            </View>
            <StatusChip label={upcoming.status} tone={toneForStatus(upcoming.status)} />
          </View>
          <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
            {upcoming.room || 'Consultorio por confirmar'} · {upcoming.dentist || 'Dentista por asignar'}
          </Text>
          <View style={s.row}>
            {upcoming.status !== 'Confirmada' ? (
              <PrimaryButton label="Confirmar" onPress={() => state.updateAppointment(upcoming.id, { status: 'Confirmada' }).catch(() => {})} style={{ flex: 1 }} />
            ) : null}
            <OutlineButton label="Ver detalle" theme={state.theme} onPress={() => router.replace('/patient-appointments')} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
          <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>No tienes una cita próxima</Text>
          <PrimaryButton label="Solicitar cita" onPress={() => router.replace('/patient-appointments')} />
        </View>
      )}

      {plan ? (
        <>
          <SectionTitle theme={state.theme} action="Abrir" onPress={() => router.replace('/patient-health')}>Mi tratamiento</SectionTitle>
          <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <View style={s.between}>
              <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{plan.name}</Text>
              <StatusChip label={plan.status} tone={colors.purple} />
            </View>
            <View style={[s.progressTrack, { backgroundColor: state.theme.input }]}>
              <View style={[s.progressFill, { width: `${plan.progress}%`, backgroundColor: colors.purple }]} />
            </View>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{plan.progress}% completado · Siguiente: {plan.next_step}</Text>
          </View>
        </>
      ) : null}

      {activeFollowUp ? (
        <>
          <SectionTitle theme={state.theme} action="Abrir" onPress={() => router.push('/patient-recovery')}>Mi recuperación</SectionTitle>
          <Pressable onPress={() => router.push('/patient-recovery')} style={[s.card, { backgroundColor: activeFollowUp.status === 'Alerta' ? `${colors.red}10` : `${colors.green}10`, borderColor: activeFollowUp.status === 'Alerta' ? `${colors.red}45` : `${colors.green}45` }]}>
            <View style={s.between}>
              <View style={{ flex: 1 }}>
                <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{activeFollowUp.procedure}</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Completa tu seguimiento y registra cómo te sientes.</Text>
              </View>
              <StatusChip label={activeFollowUp.status} tone={toneForStatus(activeFollowUp.status)} />
            </View>
          </Pressable>
        </>
      ) : null}

      <SectionTitle theme={state.theme}>Accesos rápidos</SectionTitle>
      <View style={s.grid}>
        {[
          { title: 'Agendar cita', icon: 'C', route: '/patient-appointments', tone: colors.blue },
          { title: 'Mi odontograma', icon: 'D', route: '/patient-health', tone: colors.purple },
          { title: 'Documentos', icon: 'R', route: '/patient-health', tone: colors.green },
          { title: 'Mi recuperación', icon: '+', route: '/patient-recovery', tone: colors.amber },
        ].map((item) => (
          <Pressable key={item.title} onPress={() => router.replace(item.route)} style={[s.quick, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Text style={[s.quickIcon, { color: item.tone }]}>{item.icon}</Text>
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{item.title}</Text>
          </Pressable>
        ))}
      </View>

      {reminder ? (
        <>
          <SectionTitle theme={state.theme}>Recordatorio</SectionTitle>
          <View style={[s.card, { backgroundColor: `${colors.amber}12`, borderColor: `${colors.amber}40` }]}>
            <StatusChip label={reminder.type} tone={colors.amber} />
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{reminder.title}</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{reminder.message}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
