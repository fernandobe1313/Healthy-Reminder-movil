import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/palette';
import { patientServices } from '../data/patient-services';
import { addAppointmentToCalendar, scheduleLocalReminder } from '../native/native-capabilities';
import { useAppState } from '../navigation/AppStateContext';
import { appointmentDate, EmptyState, OutlineButton, PrimaryButton, SectionTitle, StatusChip, toneForStatus } from './patient-components';
import { patientStyles as s } from './patient-ui';

const filters = ['Próximas', 'Completadas', 'Canceladas'];
export function PatientAppointmentsScreen() {
  const state = useAppState();
  const [filter, setFilter] = useState('Próximas');
  const [modal, setModal] = useState(null);
  const [serviceSelectorOpen, setServiceSelectorOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [form, setForm] = useState({ service: patientServices[0].name, date: '', time: '10:00', reason: '' });
  const patient = state.currentPatient;
  const patientAppointments = useMemo(
    () => state.appointments.filter((item) => item.patient_id === state.currentPatientId || item.patient === patient?.name),
    [state.appointments, state.currentPatientId, patient?.name]
  );
  const filtered = patientAppointments.filter((item) => {
    if (filter === 'Completadas') return item.status === 'Completada';
    if (filter === 'Canceladas') return item.status === 'Cancelada';
    return !['Completada', 'Cancelada'].includes(item.status);
  });
  const filteredServices = patientServices.filter((service) => (
    `${service.name} ${service.category}`.toLocaleLowerCase('es-MX').includes(serviceQuery.toLocaleLowerCase('es-MX').trim())
  ));
  const selectedService = patientServices.find((service) => service.name === form.service);

  const openNewRequest = () => {
    setForm({
      service: patientServices[0].name,
      date: new Date().toISOString().slice(0, 10),
      time: '10:00',
      reason: '',
    });
    setModal({ type: 'new' });
  };

  const openRescheduleRequest = (item) => {
    setForm({
      service: item.service,
      date: appointmentDate(item),
      time: String(item.time || '10:00').slice(0, 5),
      reason: '',
    });
    setModal({ type: 'reschedule', item });
  };

  const submit = async () => {
    if (!form.date || !form.time || !form.service) {
      state.notify('Completa fecha, hora y servicio');
      return;
    }
    try {
      await state.requestPatientAppointment(form);
      setModal(null);
      setFilter('Próximas');
    } catch {
      // El contexto ya muestra el error del backend.
    }
  };

  const addToCalendar = async (appointment) => {
    try {
      const eventId = await addAppointmentToCalendar(appointment);
      if (!eventId) {
        state.notify('El calendario no está disponible o no tiene permiso');
        return;
      }
      state.setCalendarEvents((prev) => ({ ...prev, [appointment.id]: eventId }));
      state.notify('Cita agregada al calendario');
    } catch {
      state.notify('No fue posible agregar la cita');
    }
  };

  const scheduleAppointmentReminder = async (appointment) => {
    try {
      const date = appointmentDate(appointment);
      const start = new Date(`${date}T${appointment.time || '09:00'}:00`);
      const reminderDate = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      const id = await scheduleLocalReminder({
        title: 'Tu cita dental es mañana',
        body: `${appointment.service} a las ${appointment.time}. Te recomendamos llegar 10 minutos antes.`,
        date: reminderDate,
        url: '/patient-appointments',
      });
      state.notify(id ? 'Recordatorio programado' : 'Activa las notificaciones del dispositivo');
    } catch {
      state.notify('No fue posible programar el recordatorio');
    }
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
          <Text selectable style={[s.eyebrow, { color: colors.blue }]}>Agenda personal</Text>
          <Text selectable style={[s.title, { color: state.theme.text }]}>Organiza tus consultas</Text>
          <Text selectable style={[s.subtitle, { color: state.theme.muted }]}>Confirma, solicita cambios o agenda una nueva visita.</Text>
          <View style={s.row}>
            <PrimaryButton label="Solicitar nueva cita" onPress={openNewRequest} style={{ flex: 1 }} />
            <OutlineButton label="Actualizar" theme={state.theme} onPress={() => state.refreshPatientAppointments().catch(() => {})} style={{ flex: 1 }} />
          </View>
        </View>

        <View style={[s.tabs, { backgroundColor: state.theme.card, padding: 6, borderRadius: 18 }]}>
          {filters.map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[s.tab, { backgroundColor: filter === item ? state.theme.chip : 'transparent' }]}>
              <Text style={[s.tabText, { color: filter === item ? colors.blue : state.theme.muted }]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle theme={state.theme}>{filter}</SectionTitle>
        {filtered.length ? filtered.map((item) => (
          <Pressable key={item.id} onPress={() => setModal({ type: 'detail', item })} style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <View style={s.between}>
              <View style={{ flex: 1 }}>
                <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{item.service}</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{appointmentDate(item)} · {item.time}</Text>
              </View>
              <StatusChip label={item.status} tone={toneForStatus(item.status)} />
            </View>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{item.room || 'Consultorio por confirmar'} · {item.dentist || 'Dra. Mariana Torres'}</Text>
            {item.reschedule_request_status === 'pendiente' ? (
              <View style={[s.card, { marginTop: 10, backgroundColor: state.theme.chip, borderColor: colors.amber }]}>
                <Text selectable style={[s.cardTitle, { color: colors.amber }]}>Reprogramación pendiente</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>
                  Solicitaste {item.reschedule_requested_date} a las {item.reschedule_requested_start_time}.
                </Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
                  Tu cita actual sigue vigente hasta que el dentista responda.
                </Text>
              </View>
            ) : null}
            {item.reschedule_request_status === 'rechazada' ? (
              <View style={[s.card, { marginTop: 10, backgroundColor: state.theme.input, borderColor: colors.red }]}>
                <Text selectable style={[s.cardTitle, { color: colors.red }]}>Solicitud rechazada</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>Tu cita conserva la fecha y horario actuales.</Text>
                {item.reschedule_review_note ? (
                  <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Respuesta: {item.reschedule_review_note}</Text>
                ) : null}
              </View>
            ) : null}
            <View style={s.row}>
              {!['Confirmada', 'Completada', 'Cancelada'].includes(item.status) ? (
                <PrimaryButton label="Confirmar" onPress={() => state.updateAppointment(item.id, { status: 'Confirmada' }).catch(() => {})} style={{ flex: 1 }} />
              ) : null}
              {!['Completada', 'Cancelada'].includes(item.status) && item.reschedule_request_status !== 'pendiente' ? (
                <OutlineButton label="Solicitar cambio" theme={state.theme} onPress={() => openRescheduleRequest(item)} style={{ flex: 1 }} />
              ) : null}
            </View>
          </Pressable>
        )) : (
          <EmptyState title={`Sin citas ${filter.toLowerCase()}`} copy="Cuando exista información aparecerá aquí automáticamente." theme={state.theme} />
        )}
      </ScrollView>

      <Modal visible={Boolean(modal)} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={s.modalRoot}>
          <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={[s.modalCard, { backgroundColor: state.theme.surface }]}>
            <View style={s.between}>
              <Text selectable style={[s.sectionTitle, { color: state.theme.text }]}>
                {modal?.type === 'detail' ? 'Detalle de la cita' : modal?.type === 'reschedule' ? 'Reprogramar cita' : 'Solicitar cita'}
              </Text>
              <Pressable onPress={() => setModal(null)}><Text style={{ color: state.theme.muted, fontSize: 22 }}>×</Text></Pressable>
            </View>

            {modal?.type === 'detail' ? (
              <>
                <StatusChip label={modal.item.status} tone={toneForStatus(modal.item.status)} />
                <Text selectable style={[s.title, { color: state.theme.text }]}>{modal.item.service}</Text>
                <View style={[s.card, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}>
                  <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>Fecha: {appointmentDate(modal.item)}</Text>
                  <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>Horario: {modal.item.time}{modal.item.end_time ? `–${modal.item.end_time}` : ''}</Text>
                  <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>Dentista: {modal.item.dentist || 'Dra. Mariana Torres'}</Text>
                  <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>Ubicación: {modal.item.room || 'Consultorio 1'}</Text>
                </View>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Llega 10 minutos antes. Si tomas medicamentos, lleva una lista actualizada.</Text>
                {modal.item.reschedule_request_status === 'pendiente' ? (
                  <View style={[s.card, { backgroundColor: state.theme.chip, borderColor: colors.amber }]}>
                    <Text selectable style={[s.cardTitle, { color: colors.amber }]}>Solicitud pendiente de respuesta</Text>
                    <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>
                      Propuesta: {modal.item.reschedule_requested_date} de {modal.item.reschedule_requested_start_time} a {modal.item.reschedule_requested_end_time}.
                    </Text>
                    <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
                      Mientras tanto, conserva la fecha actual de tu cita.
                    </Text>
                  </View>
                ) : null}
                <View style={s.row}>
                  <OutlineButton
                    label={state.calendarEvents[modal.item.id] ? 'En calendario' : 'Agregar al calendario'}
                    theme={state.theme}
                    tone={colors.green}
                    onPress={() => addToCalendar(modal.item)}
                    style={{ flex: 1 }}
                  />
                  <OutlineButton label="Crear recordatorio" theme={state.theme} onPress={() => scheduleAppointmentReminder(modal.item)} style={{ flex: 1 }} />
                </View>
                {!['Completada', 'Cancelada'].includes(modal.item.status) ? (
                  <>
                    <PrimaryButton label="Confirmar asistencia" onPress={async () => { try { await state.updateAppointment(modal.item.id, { status: 'Confirmada' }); setModal(null); } catch {} }} />
                    {modal.item.reschedule_request_status !== 'pendiente' ? (
                      <OutlineButton label="Solicitar reprogramación" theme={state.theme} onPress={() => openRescheduleRequest(modal.item)} />
                    ) : null}
                    <OutlineButton label="Cancelar cita" theme={state.theme} tone={colors.red} onPress={async () => { try { await state.updateAppointment(modal.item.id, { status: 'Cancelada', cancellation_reason: 'Cancelada por el paciente' }); setModal(null); } catch {} }} />
                  </>
                ) : null}
              </>
            ) : (
              <>
                <Text selectable style={[s.fieldLabel, { color: state.theme.text }]}>Servicio</Text>
                <Pressable
                  onPress={() => setServiceSelectorOpen(true)}
                  style={[s.field, s.between, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}>
                  <View style={{ flex: 1 }}>
                    <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{form.service}</Text>
                    <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
                      {selectedService?.category} · {selectedService?.duration} min · ${selectedService?.price.toLocaleString('es-MX')}
                    </Text>
                  </View>
                  <Text style={{ color: colors.blue, fontSize: 18, fontWeight: '900' }}>⌄</Text>
                </Pressable>
                <Text selectable style={[s.fieldLabel, { color: state.theme.text }]}>Fecha solicitada</Text>
                <TextInput value={form.date} onChangeText={(date) => setForm((prev) => ({ ...prev, date }))} placeholder="AAAA-MM-DD" placeholderTextColor={state.theme.soft} style={[s.field, { color: state.theme.text, backgroundColor: state.theme.input, borderColor: state.theme.line }]} />
                <Text selectable style={[s.fieldLabel, { color: state.theme.text }]}>Horario</Text>
                <TextInput value={form.time} onChangeText={(time) => setForm((prev) => ({ ...prev, time }))} placeholder="10:00" placeholderTextColor={state.theme.soft} style={[s.field, { color: state.theme.text, backgroundColor: state.theme.input, borderColor: state.theme.line }]} />
                <Text selectable style={[s.fieldLabel, { color: state.theme.text }]}>Motivo o comentario</Text>
                <TextInput value={form.reason} onChangeText={(reason) => setForm((prev) => ({ ...prev, reason }))} multiline placeholder="Cuéntanos brevemente qué necesitas" placeholderTextColor={state.theme.soft} style={[s.field, { minHeight: 90, paddingTop: 14, color: state.theme.text, backgroundColor: state.theme.input, borderColor: state.theme.line }]} />
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
                  {modal?.type === 'reschedule'
                    ? 'Esto solo enviará una solicitud. Tu cita actual no cambiará hasta que el dentista la apruebe.'
                    : 'La clínica recibirá la solicitud y podrá confirmarla o ajustar el horario.'}
                </Text>
                <PrimaryButton
                  label={modal?.type === 'reschedule' ? 'Enviar nueva fecha' : 'Enviar solicitud'}
                  onPress={() => {
                    if (modal?.type === 'reschedule') {
                      state.requestPatientReschedule(modal.item.id, form)
                        .then(() => setModal(null))
                        .catch(() => {});
                    } else submit();
                  }}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={serviceSelectorOpen} transparent animationType="slide" onRequestClose={() => setServiceSelectorOpen(false)}>
        <View style={s.modalRoot}>
          <View style={[s.modalCard, { backgroundColor: state.theme.surface, height: '82%' }]}>
            <View style={s.between}>
              <View>
                <Text selectable style={[s.sectionTitle, { color: state.theme.text }]}>Seleccionar servicio</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{patientServices.length} servicios disponibles</Text>
              </View>
              <Pressable onPress={() => setServiceSelectorOpen(false)}><Text style={{ color: state.theme.muted, fontSize: 22 }}>×</Text></Pressable>
            </View>
            <TextInput
              value={serviceQuery}
              onChangeText={setServiceQuery}
              placeholder="Buscar por nombre o categoría..."
              placeholderTextColor={state.theme.soft}
              style={[s.field, { color: state.theme.text, backgroundColor: state.theme.input, borderColor: state.theme.line }]}
            />
            <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingBottom: 30 }}>
              {filteredServices.map((service) => {
                const active = form.service === service.name;
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => {
                      setForm((prev) => ({ ...prev, service: service.name, end_time: '' }));
                      setServiceSelectorOpen(false);
                      setServiceQuery('');
                    }}
                    style={[s.card, { backgroundColor: active ? state.theme.chip : state.theme.card, borderColor: active ? colors.blue : state.theme.line }]}>
                    <View style={s.between}>
                      <View style={{ flex: 1 }}>
                        <Text selectable style={[s.cardTitle, { color: active ? colors.blue : state.theme.text }]}>{service.name}</Text>
                        <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{service.category} · {service.duration} minutos</Text>
                      </View>
                      <Text selectable style={[s.cardTitle, { color: colors.green }]}>${service.price.toLocaleString('es-MX')}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
