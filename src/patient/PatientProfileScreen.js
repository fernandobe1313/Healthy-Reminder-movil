import React, { useState } from 'react';
import { Linking, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/palette';
import { useAppState } from '../navigation/AppStateContext';
import { ensureNotifications } from '../native/native-capabilities';
import { OutlineButton, PrimaryButton, SectionTitle } from './patient-components';
import { patientStyles as s } from './patient-ui';

function Field({ label, value, onChangeText, theme, editable = true }) {
  return (
    <View style={{ gap: 7 }}>
      <Text selectable style={[s.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TextInput editable={editable} value={String(value || '')} onChangeText={onChangeText} placeholderTextColor={theme.soft} style={[s.field, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line, opacity: editable ? 1 : 0.65 }]} />
    </View>
  );
}

export function PatientProfileScreen() {
  const state = useAppState();
  const [section, setSection] = useState('Datos');
  const [form, setForm] = useState({ ...state.currentPatient });
  const prefs = state.patientPreferences;

  const save = async () => {
    try {
      await state.updateCurrentPatient(form);
    } catch {
      // El contexto ya muestra el error del backend.
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
        <View style={[s.row, { alignItems: 'center' }]}>
          <View style={{ width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.blue}18` }}>
            <Text style={{ color: colors.blue, fontSize: 22, fontWeight: '900' }}>{state.currentPatient?.name?.slice(0, 1) || 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text selectable style={[s.title, { color: state.theme.text }]}>{state.currentPatient?.name}</Text>
            <Text selectable style={[s.subtitle, { color: state.theme.muted }]}>Expediente #{state.currentPatientId}</Text>
          </View>
        </View>
      </View>

      <View style={[s.tabs, { backgroundColor: state.theme.card, padding: 6, borderRadius: 18 }]}>
        {['Datos', 'Médico', 'Credencial', 'Avisos', 'Ayuda'].map((item) => (
          <Text key={item} onPress={() => setSection(item)} style={[s.tab, s.tabText, { paddingTop: 13, backgroundColor: section === item ? state.theme.chip : 'transparent', color: section === item ? colors.blue : state.theme.muted }]}>{item}</Text>
        ))}
      </View>

      {section === 'Datos' ? (
        <>
          <SectionTitle theme={state.theme}>Información personal</SectionTitle>
          <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Field label="Nombre completo" value={form.name} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} theme={state.theme} />
            <Field label="Teléfono" value={form.phone} onChangeText={(phone) => setForm((prev) => ({ ...prev, phone }))} theme={state.theme} />
            <Field label="Correo electrónico" value={form.email || 'alan@paciente.com'} onChangeText={(email) => setForm((prev) => ({ ...prev, email }))} theme={state.theme} />
            <Field label="Contacto de emergencia" value={form.emergency_contact_name || 'Laura Ramírez'} onChangeText={(emergency_contact_name) => setForm((prev) => ({ ...prev, emergency_contact_name }))} theme={state.theme} />
            <PrimaryButton label="Guardar cambios" onPress={save} />
          </View>
        </>
      ) : null}

      {section === 'Médico' ? (
        <>
          <SectionTitle theme={state.theme}>Información médica</SectionTitle>
          <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Field label="Tipo de sangre" value={form.blood_type || 'O+'} onChangeText={(blood_type) => setForm((prev) => ({ ...prev, blood_type }))} theme={state.theme} />
            <Field label="Alergias" value={form.allergies || 'Ninguna conocida'} onChangeText={(allergies) => setForm((prev) => ({ ...prev, allergies }))} theme={state.theme} />
            <Field label="Enfermedades crónicas" value={form.chronic_diseases || 'Ninguna'} onChangeText={(chronic_diseases) => setForm((prev) => ({ ...prev, chronic_diseases }))} theme={state.theme} />
            <Field label="Medicamentos actuales" value={form.current_medications || 'Ninguno'} onChangeText={(current_medications) => setForm((prev) => ({ ...prev, current_medications }))} theme={state.theme} />
            <PrimaryButton label="Actualizar información" onPress={save} />
          </View>
          <Text selectable style={[s.cardCopy, { color: state.theme.soft, textAlign: 'center' }]}>Los cambios quedan visibles para el equipo clínico.</Text>
        </>
      ) : null}

      {section === 'Avisos' ? (
        <>
          <SectionTitle theme={state.theme}>Preferencias de notificación</SectionTitle>
          {[
            ['push', 'Notificaciones de la app'],
            ['email', 'Correo electrónico'],
            ['whatsapp', 'WhatsApp'],
            ['appointmentReminders', 'Recordatorios de citas'],
            ['paymentReminders', 'Recordatorios de pago'],
          ].map(([key, label]) => (
            <View key={key} style={[s.card, s.between, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
              <Text selectable style={[s.cardTitle, { color: state.theme.text, flex: 1 }]}>{label}</Text>
              <Switch
                value={prefs[key]}
                onValueChange={async (value) => {
                  if (key === 'push' && value) {
                    const granted = await ensureNotifications();
                    if (!granted) {
                      state.notify('El dispositivo no concedió permiso');
                      return;
                    }
                  }
                  state.setPatientPreferences((prev) => ({ ...prev, [key]: value }));
                  state.notify(value ? 'Notificación activada' : 'Notificación desactivada');
                }}
                trackColor={{ false: state.theme.line, true: `${colors.blue}80` }}
                thumbColor={prefs[key] ? colors.blue : '#f8fafc'}
              />
            </View>
          ))}
          <OutlineButton label="Cambiar contraseña" theme={state.theme} onPress={() => state.notify('Solicitud de cambio iniciada')} />
          <OutlineButton label="Aviso de privacidad" theme={state.theme} onPress={() => state.notify('Aviso de privacidad abierto')} />
          <OutlineButton label="Solicitar mis datos" theme={state.theme} onPress={() => state.notify('Solicitud registrada')} />
        </>
      ) : null}

      {section === 'Credencial' ? (
        <>
          <SectionTitle theme={state.theme}>Credencial dental de emergencia</SectionTitle>
          <View style={[s.hero, { backgroundColor: state.theme.name === 'dark' ? '#101a31' : '#eaf2ff', borderColor: `${colors.blue}55` }]}>
            <View style={s.between}>
              <View>
                <Text selectable style={[s.eyebrow, { color: colors.blue }]}>HealthyReminder · Disponible sin conexión</Text>
                <Text selectable style={[s.title, { color: state.theme.text }]}>{state.currentPatient?.name}</Text>
              </View>
              <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 23, fontWeight: '900' }}>+</Text>
              </View>
            </View>
            <View style={[s.divider, { backgroundColor: `${colors.blue}35` }]} />
            {state.emergencyVisibility.bloodType ? <Text selectable style={[s.cardCopy, { color: state.theme.text }]}><Text style={{ fontWeight: '900' }}>Tipo de sangre:</Text> {form.blood_type || 'O+'}</Text> : null}
            {state.emergencyVisibility.allergies ? <Text selectable style={[s.cardCopy, { color: state.theme.text }]}><Text style={{ fontWeight: '900' }}>Alergias:</Text> {form.allergies || 'Ninguna conocida'}</Text> : null}
            {state.emergencyVisibility.diseases ? <Text selectable style={[s.cardCopy, { color: state.theme.text }]}><Text style={{ fontWeight: '900' }}>Enfermedades:</Text> {form.chronic_diseases || 'Ninguna registrada'}</Text> : null}
            {state.emergencyVisibility.medications ? <Text selectable style={[s.cardCopy, { color: state.theme.text }]}><Text style={{ fontWeight: '900' }}>Medicamentos:</Text> {form.current_medications || 'Ninguno'}</Text> : null}
            {state.emergencyVisibility.emergencyContact ? <Text selectable style={[s.cardCopy, { color: state.theme.text }]}><Text style={{ fontWeight: '900' }}>Contacto:</Text> {form.emergency_contact_name || 'Laura Ramírez'} · {form.emergency_contact_phone || '55 9876 5432'}</Text> : null}
            {state.emergencyVisibility.clinic ? <Text selectable style={[s.cardCopy, { color: colors.blue }]}><Text style={{ fontWeight: '900' }}>Clínica:</Text> HealthyReminder Dental · 55 1234 5678</Text> : null}
            <Text selectable style={[s.cardCopy, { color: state.theme.soft }]}>Actualizada: {new Date().toLocaleDateString('es-MX')}</Text>
          </View>

          <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Información visible</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Elige qué datos pueden mostrarse rápidamente en una emergencia.</Text>
            {[
              ['bloodType', 'Tipo de sangre'],
              ['allergies', 'Alergias'],
              ['diseases', 'Enfermedades importantes'],
              ['medications', 'Medicamentos actuales'],
              ['emergencyContact', 'Contacto de emergencia'],
              ['clinic', 'Clínica y dentista'],
            ].map(([key, label]) => (
              <View key={key} style={s.between}>
                <Text selectable style={[s.cardCopy, { color: state.theme.text, flex: 1 }]}>{label}</Text>
                <Switch value={state.emergencyVisibility[key]} onValueChange={(value) => state.setEmergencyVisibility((prev) => ({ ...prev, [key]: value }))} trackColor={{ false: state.theme.line, true: `${colors.blue}80` }} thumbColor={state.emergencyVisibility[key] ? colors.blue : '#fff'} />
              </View>
            ))}
          </View>
          <View style={[s.card, { backgroundColor: `${colors.green}10`, borderColor: `${colors.green}35` }]}>
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Guardada en este dispositivo</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>La credencial y sus preferencias quedan disponibles localmente aunque no tengas conexión a internet.</Text>
          </View>
        </>
      ) : null}

      {section === 'Ayuda' ? (
        <>
          <SectionTitle theme={state.theme}>Clínica HealthyReminder</SectionTitle>
          <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Estamos para ayudarte</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Lunes a viernes, 9:00–19:00 · Consultorio 1</Text>
            <PrimaryButton label="Llamar a la clínica" onPress={() => Linking.openURL('tel:+525512345678')} />
            <OutlineButton label="Abrir WhatsApp" theme={state.theme} tone={colors.green} onPress={() => Linking.openURL('https://wa.me/525512345678')} />
            <OutlineButton label="Enviar correo" theme={state.theme} onPress={() => Linking.openURL('mailto:contacto@healthyreminder.mx')} />
          </View>
          <View style={[s.card, { backgroundColor: `${colors.amber}10`, borderColor: `${colors.amber}35` }]}>
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>¿Tienes una urgencia?</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Esta aplicación no sustituye una valoración profesional. Si presentas dolor intenso, sangrado persistente o inflamación, contacta directamente a la clínica.</Text>
          </View>
        </>
      ) : null}

      <OutlineButton label="Cerrar sesión" theme={state.theme} tone={colors.red} onPress={state.logout} />
    </ScrollView>
  );
}
