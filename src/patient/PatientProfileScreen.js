import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/palette';
import { useAppState } from '../navigation/AppStateContext';
import { resources } from '../api/resources';
import { OutlineButton, PrimaryButton, SectionTitle } from './patient-components';
import { patientStyles as s } from './patient-ui';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneDigits = (value = '') => String(value).replace(/\D/g, '');

function Field({ label, value, onChangeText, theme, editable = true, secureTextEntry = false, keyboardType, maxLength = 255 }) {
  return (
    <View style={{ gap: 7 }}>
      <Text selectable style={[s.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TextInput editable={editable} secureTextEntry={secureTextEntry} value={String(value || '')} onChangeText={(next) => onChangeText?.(next.slice(0, maxLength))} keyboardType={keyboardType} maxLength={maxLength} placeholderTextColor={theme.soft} style={[s.field, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line, opacity: editable ? 1 : 0.65 }]} />
    </View>
  );
}

export function PatientProfileScreen() {
  const state = useAppState();
  const [section, setSection] = useState('Datos');
  const [form, setForm] = useState({ ...state.currentPatient });
  const [passwordRequest, setPasswordRequest] = useState(null);
  const [requestReason, setRequestReason] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [dataRequest, setDataRequest] = useState(null);
  const [dataRequestBusy, setDataRequestBusy] = useState(false);
  const prefs = state.patientPreferences;

  useEffect(() => setForm({ ...state.currentPatient }), [state.currentPatient]);

  useEffect(() => {
    if (section !== 'Avisos') return;
    Promise.all([resources.myPasswordChangeRequest(), resources.myDataRequest()])
      .then(([password, personalData]) => {
        setPasswordRequest(password);
        setDataRequest(personalData);
      })
      .catch((error) => state.notify(error.message));
  }, [section]);

  const requestPasswordChange = async () => {
    setPasswordBusy(true);
    try {
      setPasswordRequest(await resources.requestPasswordChange({ reason: requestReason.trim() }));
      setRequestReason('');
      state.notify('Solicitud enviada al administrador');
    } catch (error) { state.notify(error.message); }
    finally { setPasswordBusy(false); }
  };

  const requestPersonalData = async () => {
    setDataRequestBusy(true);
    try {
      setDataRequest(await resources.requestMyData());
      state.notify('Solicitud enviada al administrador');
    } catch (error) { state.notify(error.message); }
    finally { setDataRequestBusy(false); }
  };

  const save = async () => {
    const email = String(form.email || '').trim();
    const phone = phoneDigits(form.phone);
    if (email && !EMAIL_PATTERN.test(email)) {
      state.notify('Ingresa un correo electrónico válido');
      return;
    }
    if (phone && (phone.length < 8 || phone.length > 15)) {
      state.notify('El teléfono debe contener entre 8 y 15 dígitos');
      return;
    }
    try {
      await state.updateCurrentPatient({ ...form, email: email.toLowerCase() });
    } catch {
      // El contexto ya muestra el error del backend.
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
        <View style={[s.row, { alignItems: 'center' }]}>
          <View style={{ width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.blue}18` }}>
            <Text style={{ color: colors.blue, fontSize: 22, fontWeight: '900' }}>{state.currentPatient?.name?.slice(0, 1) || 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text selectable style={[s.title, { color: state.theme.text }]}>{state.currentPatient?.name}</Text>
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
            <Field label="Correo electrónico" value={form.email || 'alan@paciente.com'} onChangeText={(email) => setForm((prev) => ({ ...prev, email }))} keyboardType="email-address" maxLength={160} theme={state.theme} />
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
            ['push', 'Notificaciones dentro de la app'],
            ['email', 'Correo electrónico'],
            ['whatsapp', 'WhatsApp'],
            ['appointmentReminders', 'Recordatorios de citas'],
            ['paymentReminders', 'Recordatorios de pago'],
          ].map(([key, label]) => (
            <View key={key} style={[s.card, s.between, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
              <Text selectable style={[s.cardTitle, { color: state.theme.text, flex: 1 }]}>{label}</Text>
              <Switch
                value={prefs[key]}
                onValueChange={(value) => {
                  state.setPatientPreferences((prev) => ({ ...prev, [key]: value }));
                  state.notify(value ? 'Notificación activada' : 'Notificación desactivada');
                }}
                trackColor={{ false: state.theme.line, true: `${colors.blue}80` }}
                thumbColor={prefs[key] ? colors.blue : '#f8fafc'}
              />
            </View>
          ))}
          <SectionTitle theme={state.theme}>Seguridad de la cuenta</SectionTitle>
          <View style={[s.card, s.between, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Acceso biométrico</Text>
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
                {state.biometricCapability?.available
                  ? `Desbloquea con ${state.biometricCapability.label}; puedes usar la credencial del dispositivo como respaldo.`
                  : 'Configura huella, rostro, PIN, patrón o contraseña en este dispositivo.'}
              </Text>
            </View>
            <Switch
              value={state.biometricEnabled}
              onValueChange={state.setBiometricEnabled}
              trackColor={{ false: state.theme.line, true: `${colors.blue}80` }}
              thumbColor={state.biometricEnabled ? colors.blue : '#f8fafc'}
            />
          </View>
          <View style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Cambio de contraseña supervisado</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Envía una solicitud. Por seguridad, solo el administrador puede establecer una nueva contraseña para tu cuenta.</Text>
            {passwordRequest?.status === 'pendiente' ? (
              <Text selectable style={[s.cardCopy, { color: colors.amber }]}>Solicitud pendiente de revisión por el administrador.</Text>
            ) : passwordRequest?.status === 'aprobada' ? (
              <Text selectable style={[s.cardCopy, { color: colors.green }]}>Solicitud aprobada. El administrador establecerá la nueva contraseña y te la comunicará por un medio seguro.</Text>
            ) : passwordRequest?.status === 'completada' ? (
              <Text selectable style={[s.cardCopy, { color: colors.green }]}>El administrador completó el cambio. Usa la contraseña que te proporcionó para tu siguiente inicio de sesión.</Text>
            ) : (
              <>
                {passwordRequest?.status === 'rechazada' ? <Text selectable style={[s.cardCopy, { color: colors.red }]}>La solicitud anterior fue rechazada. Puedes enviar una nueva.</Text> : null}
                <Field label="Motivo de la solicitud (opcional)" value={requestReason} onChangeText={setRequestReason} theme={state.theme} />
                <PrimaryButton label={passwordBusy ? 'Enviando...' : 'Solicitar cambio al administrador'} onPress={requestPasswordChange} />
              </>
            )}
          </View>
          <OutlineButton label="Aviso de privacidad" theme={state.theme} onPress={() => setPrivacyOpen(true)} />
          <OutlineButton
            label={dataRequest?.status === 'pendiente' ? 'Solicitud de datos pendiente' : dataRequestBusy ? 'Enviando solicitud...' : 'Solicitar mis datos'}
            theme={state.theme}
            onPress={requestPersonalData}
            disabled={dataRequestBusy || dataRequest?.status === 'pendiente'}
          />
          {dataRequest ? <Text selectable style={[s.cardCopy, { color: state.theme.muted, textAlign: 'center' }]}>Estado de la solicitud: {dataRequest.status}</Text> : null}
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

      <Modal visible={privacyOpen} transparent animationType="slide" onRequestClose={() => setPrivacyOpen(false)}>
        <View style={s.modalRoot}>
          <ScrollView contentContainerStyle={[s.modalCard, { backgroundColor: state.theme.surface }]}>
            <View style={s.between}>
              <Text selectable style={[s.sectionTitle, { color: state.theme.text, flex: 1 }]}>Aviso de privacidad</Text>
              <Pressable onPress={() => setPrivacyOpen(false)}><Text style={{ color: state.theme.muted, fontSize: 24 }}>×</Text></Pressable>
            </View>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>HealthyReminder Dental y la clínica responsable tratan tus datos de identificación, contacto, salud, citas y pagos para integrar tu expediente, prestar atención dental, administrar citas y cumplir obligaciones legales.</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Tus datos no se venden. Solo se comparten con personal autorizado, proveedores necesarios para operar el servicio o autoridades cuando exista una obligación legal. Se aplican controles de acceso, cifrado y registro de actividad.</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Puedes solicitar acceso, rectificación, cancelación u oposición mediante el botón “Solicitar mis datos” o contactando directamente a tu clínica. La clínica validará tu identidad antes de entregar información.</Text>
            <PrimaryButton label="Entendido" onPress={() => setPrivacyOpen(false)} />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
