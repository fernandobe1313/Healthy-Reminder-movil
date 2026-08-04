import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/palette';
import { LedText } from '../components/common';
import { useAppState } from '../navigation/AppStateContext';
import { scheduleLocalReminder } from '../native/native-capabilities';
import { EmptyState, OutlineButton, PrimaryButton, SectionTitle, StatusChip, toneForStatus } from './patient-components';
import { patientStyles as s } from './patient-ui';

const defaultResponse = {
  pain: 0,
  swelling: false,
  bleeding: false,
  sensitivity: false,
  fever: false,
  medicationTaken: false,
  comment: '',
  photoUri: '',
  photoData: '',
};

export function PatientRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const state = useAppState();
  const [modal, setModal] = useState(null);
  const [response, setResponse] = useState(defaultResponse);
  const items = state.followUps.filter((item) => item.patient_id === state.currentPatientId);

  const pickPhoto = async (source) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      state.notify('Se necesita permiso para adjuntar la fotografía');
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.65, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.65, base64: true });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setResponse((prev) => ({
        ...prev,
        photoUri: asset.uri,
        photoData: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : '',
      }));
    }
  };

  const submit = async () => {
    try {
      const priority = await state.submitFollowUp(modal.item.id, response);
      setModal({ type: 'result', priority });
      setResponse(defaultResponse);
    } catch {
      // El contexto ya muestra el error del backend.
    }
  };

  const schedule = async (item) => {
    try {
      const id = await scheduleLocalReminder({
        title: 'Seguimiento dental pendiente',
        body: `Cuéntanos cómo evoluciona tu recuperación de ${item.procedure}.`,
        date: item.next_check_at,
        url: '/patient-recovery',
      });
      state.notify(id ? 'Recordatorio programado en tu teléfono' : 'Activa las notificaciones del dispositivo');
    } catch {
      state.notify('No fue posible programar el recordatorio');
    }
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
          <LedText selectable style={s.eyebrow}>Acompañamiento posterior</LedText>
          <Text selectable style={[s.title, { color: state.theme.text }]}>Mi recuperación</Text>
          <Text selectable style={[s.subtitle, { color: state.theme.muted }]}>Registra cómo te sientes y permite que el equipo dental revise tu evolución entre consultas.</Text>
        </View>

        <View style={[s.card, { backgroundColor: `${colors.amber}10`, borderColor: `${colors.amber}40` }]}>
          <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Información preventiva</Text>
          <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>HealthyReminder no realiza diagnósticos. Cuando una respuesta necesita atención, se solicita la revisión del equipo dental.</Text>
        </View>

        <SectionTitle theme={state.theme}>Seguimientos activos</SectionTitle>
        {items.length ? items.map((item) => {
          const latest = item.responses?.[item.responses.length - 1];
          return (
            <View key={item.id} style={[s.card, { backgroundColor: state.theme.card, borderColor: item.status === 'Alerta' ? `${colors.red}65` : state.theme.line }]}>
              <View style={s.between}>
                <View style={{ flex: 1 }}>
                  <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{item.procedure}</Text>
                  <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Tratamiento: {item.treatment_date}</Text>
                </View>
                <StatusChip label={item.status} tone={toneForStatus(item.status)} />
              </View>
              <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>{item.instructions}</Text>
              <Text selectable style={[s.cardCopy, { color: colors.blue }]}>Medicamento: {item.medication}</Text>
              {latest ? (
                <View style={[s.card, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}>
                  <View style={s.between}>
                    <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Último reporte</Text>
                    <StatusChip label={`Dolor ${latest.pain}/10`} tone={latest.pain >= 7 ? colors.red : latest.pain >= 4 ? colors.amber : colors.green} />
                  </View>
                  <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{item.reviewed ? 'Revisado por el equipo dental' : 'Pendiente de revisión'}</Text>
                </View>
              ) : null}
              {item.status !== 'Cerrado' ? <PrimaryButton label={latest ? 'Enviar nueva evolución' : 'Completar seguimiento'} onPress={() => { setResponse(defaultResponse); setModal({ type: 'form', item }); }} /> : null}
              <OutlineButton label="Recordarme más tarde" theme={state.theme} onPress={() => schedule(item)} />
            </View>
          );
        }) : <EmptyState title="Sin seguimientos activos" copy="Cuando tu dentista programe un control posterior aparecerá aquí." theme={state.theme} />}

        {items.some((item) => item.responses?.length) ? (
          <>
            <SectionTitle theme={state.theme}>Línea de tiempo</SectionTitle>
            {items.flatMap((item) => (item.responses || []).map((entry) => ({ ...entry, procedure: item.procedure, reviewed: item.reviewed }))).sort((a, b) => b.date.localeCompare(a.date)).map((entry, index) => (
              <View key={entry.id} style={s.row}>
                <View style={s.timeline}>
                  <View style={[s.timelineDot, { backgroundColor: entry.priority === 'Alta' ? colors.red : entry.priority === 'Media' ? colors.amber : colors.green }]} />
                  {index < items.length ? <View style={[s.timelineLine, { backgroundColor: state.theme.line }]} /> : null}
                </View>
                <View style={[s.card, { flex: 1, backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
                  <View style={s.between}><Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{entry.procedure}</Text><StatusChip label={entry.priority} tone={entry.priority === 'Alta' ? colors.red : colors.green} /></View>
                  <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Dolor {entry.pain}/10 · {new Date(entry.date).toLocaleDateString('es-MX')}</Text>
                  <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>{entry.comment || 'Sin comentarios adicionales.'}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(modal)} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={s.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ width: '100%', maxHeight: '92%', backgroundColor: state.theme.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' }}>
            <ScrollView
              style={{ width: '100%' }}
              contentInsetAdjustmentBehavior="automatic"
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentInsetAdjustmentBehavior="never"
              contentContainerStyle={{ padding: 20, paddingBottom: Math.max(28, insets.bottom + 18), gap: 16 }}>
              <View style={s.between}>
                <Text selectable style={[s.sectionTitle, { color: state.theme.text }]}>{modal?.type === 'result' ? 'Reporte enviado' : '¿Cómo te sientes?'}</Text>
                <Pressable onPress={() => setModal(null)}><Text style={{ color: state.theme.muted, fontSize: 22 }}>×</Text></Pressable>
              </View>
              {modal?.type === 'result' ? (
              <>
                <StatusChip label={`Prioridad ${modal.priority}`} tone={modal.priority === 'Alta' ? colors.red : modal.priority === 'Media' ? colors.amber : colors.green} />
                <Text selectable style={[s.title, { color: state.theme.text }]}>{modal.priority === 'Alta' ? 'Solicitamos revisión del equipo dental' : 'Tu evolución fue registrada'}</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{modal.priority === 'Alta' ? 'Esto no es un diagnóstico. Si presentas una emergencia, comunícate directamente con la clínica.' : 'El dentista podrá consultar tu reporte y su evolución.'}</Text>
                <PrimaryButton label="Entendido" onPress={() => setModal(null)} />
              </>
            ) : modal?.item ? (
              <>
                <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Nivel de dolor: {response.pain}/10</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {Array.from({ length: 11 }, (_, value) => (
                    <Pressable key={value} onPress={() => setResponse((prev) => ({ ...prev, pain: value }))} style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: response.pain === value ? (value >= 7 ? colors.red : value >= 4 ? colors.amber : colors.green) : state.theme.input, borderWidth: 1, borderColor: state.theme.line }}>
                      <Text style={{ color: response.pain === value ? '#fff' : state.theme.text, fontWeight: '900' }}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
                {[
                  ['swelling', 'Inflamación'],
                  ['bleeding', 'Sangrado'],
                  ['sensitivity', 'Sensibilidad'],
                  ['fever', 'Fiebre'],
                  ['medicationTaken', 'Tomé mi medicamento'],
                ].map(([key, label]) => (
                  <View key={key} style={[s.card, s.between, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
                    <Text selectable style={[s.cardTitle, { color: state.theme.text, flex: 1 }]}>{label}</Text>
                    <Switch value={response[key]} onValueChange={(value) => setResponse((prev) => ({ ...prev, [key]: value }))} trackColor={{ false: state.theme.line, true: `${colors.blue}80` }} thumbColor={response[key] ? colors.blue : '#fff'} />
                  </View>
                ))}
                <TextInput value={response.comment} onChangeText={(comment) => setResponse((prev) => ({ ...prev, comment: comment.slice(0, 1000) }))} maxLength={1000} multiline placeholder="Describe cualquier molestia o cambio..." placeholderTextColor={state.theme.soft} style={[s.field, { minHeight: 90, paddingTop: 14, color: state.theme.text, backgroundColor: state.theme.input, borderColor: state.theme.line }]} />
                {response.photoUri ? <Image source={{ uri: response.photoUri }} style={{ width: '100%', height: 220, borderRadius: 20 }} resizeMode="cover" /> : null}
                <View style={s.row}>
                  <OutlineButton label="Tomar foto" theme={state.theme} onPress={() => pickPhoto('camera')} style={{ flex: 1 }} />
                  <OutlineButton label="Galería" theme={state.theme} onPress={() => pickPhoto('library')} style={{ flex: 1 }} />
                </View>
              </>
            ) : null}
            </ScrollView>
            {modal?.type === 'form' && modal?.item ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, borderColor: state.theme.line, backgroundColor: state.theme.surface }}>
                <PrimaryButton label="Guardar y enviar seguimiento" onPress={submit} />
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
