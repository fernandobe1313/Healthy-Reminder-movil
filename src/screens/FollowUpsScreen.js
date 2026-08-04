import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/palette';
import { LedText } from '../components/common';
import { EmptyState, OutlineButton, PrimaryButton, SectionTitle, StatusChip, toneForStatus } from '../patient/patient-components';
import { patientStyles as s } from '../patient/patient-ui';

export function FollowUpsScreen({ theme, patients, followUps, onCreate, onReview, onClose, notify }) {
  const [filter, setFilter] = useState('Todos');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    patient_id: patients[0]?.id || '',
    procedure: 'Extracción dental',
    treatment_date: new Date().toISOString().slice(0, 10),
    next_check_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    instructions: 'Mantén reposo relativo, evita alimentos duros y sigue las indicaciones entregadas.',
    medication: 'Registrar medicamento e instrucciones.',
  });
  const visible = followUps.filter((item) => {
    if (filter === 'Alertas') return item.status === 'Alerta' && !item.reviewed;
    if (filter === 'Pendientes') return item.status === 'Pendiente';
    if (filter === 'Revisados') return item.reviewed;
    return true;
  });
  const alerts = followUps.filter((item) => item.status === 'Alerta' && !item.reviewed).length;

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={[s.hero, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <LedText selectable style={s.eyebrow}>Seguimiento clínico móvil</LedText>
          <Text selectable style={[s.title, { color: theme.text }]}>Recuperación de pacientes</Text>
          <Text selectable style={[s.subtitle, { color: theme.muted }]}>Programa controles, revisa síntomas y atiende alertas generadas fuera del consultorio.</Text>
          <PrimaryButton label="Programar seguimiento" onPress={() => setModal({ type: 'new' })} />
        </View>

        <View style={s.grid}>
          <View style={[s.stat, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <Text selectable style={[s.statValue, { color: alerts ? colors.red : colors.green }]}>{alerts}</Text>
            <Text selectable style={[s.statLabel, { color: theme.muted }]}>Requieren atención</Text>
          </View>
          <View style={[s.stat, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <Text selectable style={[s.statValue, { color: colors.amber }]}>{followUps.filter((item) => item.status === 'Pendiente').length}</Text>
            <Text selectable style={[s.statLabel, { color: theme.muted }]}>Pendientes de respuesta</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['Todos', 'Alertas', 'Pendientes', 'Revisados'].map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[s.chip, { backgroundColor: filter === item ? colors.blue : theme.card, borderWidth: 1, borderColor: filter === item ? colors.blue : theme.line }]}>
              <Text style={[s.chipText, { color: filter === item ? '#fff' : theme.muted }]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionTitle theme={theme}>{filter}</SectionTitle>
        {visible.length ? visible.map((item) => {
          const latest = item.responses?.[item.responses.length - 1];
          return (
            <Pressable key={item.id} onPress={() => setModal({ type: 'detail', item })} style={[s.card, { backgroundColor: theme.card, borderColor: item.status === 'Alerta' && !item.reviewed ? `${colors.red}80` : theme.line }]}>
              <View style={s.between}>
                <View style={{ flex: 1 }}>
                  <Text selectable style={[s.cardTitle, { color: theme.text }]}>{item.patient}</Text>
                  <Text selectable style={[s.cardCopy, { color: theme.muted }]}>{item.procedure} · {item.treatment_date}</Text>
                </View>
                <StatusChip label={item.status} tone={toneForStatus(item.status)} />
              </View>
              {latest ? (
                <View style={[s.row, { flexWrap: 'wrap' }]}>
                  <StatusChip label={`Dolor ${latest.pain}/10`} tone={latest.pain >= 7 ? colors.red : latest.pain >= 4 ? colors.amber : colors.green} />
                  <StatusChip label={`Prioridad ${latest.priority}`} tone={toneForStatus(latest.priority)} />
                  {latest.photoUri ? <StatusChip label="Con fotografía" tone={colors.purple} /> : null}
                </View>
              ) : <Text selectable style={[s.cardCopy, { color: theme.soft }]}>Esperando respuesta del paciente.</Text>}
            </Pressable>
          );
        }) : <EmptyState title="Sin seguimientos" copy="No hay registros para este filtro." theme={theme} />}
      </ScrollView>

      <Modal visible={Boolean(modal)} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={s.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <ScrollView
            style={{ width: '100%', maxHeight: '92%' }}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentContainerStyle={[s.modalCard, { backgroundColor: theme.surface }]}
          >
            <View style={s.between}>
              <Text selectable style={[s.sectionTitle, { color: theme.text }]}>{modal?.type === 'new' ? 'Nuevo seguimiento' : 'Revisar seguimiento'}</Text>
              <Pressable onPress={() => setModal(null)}><Text style={{ color: theme.muted, fontSize: 22 }}>×</Text></Pressable>
            </View>
            {modal?.type === 'new' ? (
              <>
                <Text selectable style={[s.fieldLabel, { color: theme.text }]}>Paciente</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {patients.map((patient) => (
                    <Pressable key={patient.id} onPress={() => setForm((prev) => ({ ...prev, patient_id: patient.id }))} style={[s.chip, { backgroundColor: form.patient_id === patient.id ? colors.blue : theme.input }]}>
                      <Text style={[s.chipText, { color: form.patient_id === patient.id ? '#fff' : theme.muted }]}>{patient.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {[
                  ['Procedimiento', 'procedure'],
                  ['Fecha del tratamiento', 'treatment_date'],
                  ['Próximo control', 'next_check_at'],
                  ['Indicaciones', 'instructions'],
                  ['Medicamento', 'medication'],
                ].map(([label, key]) => (
                  <View key={key} style={{ gap: 7 }}>
                    <Text selectable style={[s.fieldLabel, { color: theme.text }]}>{label}</Text>
                    <TextInput multiline={key === 'instructions'} value={String(form[key])} onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value.slice(0, key === 'instructions' ? 2000 : 160) }))} maxLength={key === 'instructions' ? 2000 : 160} style={[s.field, key === 'instructions' && { minHeight: 84, paddingTop: 13 }, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line }]} />
                  </View>
                ))}
                <PrimaryButton label="Programar y notificar" onPress={() => { onCreate(form); setModal(null); }} />
              </>
            ) : modal?.item ? (
              <>
                <StatusChip label={modal.item.status} tone={toneForStatus(modal.item.status)} />
                <Text selectable style={[s.title, { color: theme.text }]}>{modal.item.patient}</Text>
                <Text selectable style={[s.cardCopy, { color: theme.muted }]}>{modal.item.procedure}</Text>
                {(modal.item.responses || []).map((response) => (
                  <View key={response.id} style={[s.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
                    <View style={s.between}>
                      <StatusChip label={`Dolor ${response.pain}/10`} tone={response.pain >= 7 ? colors.red : colors.amber} />
                      <StatusChip label={response.priority} tone={response.priority === 'Alta' ? colors.red : colors.amber} />
                    </View>
                    <Text selectable style={[s.cardCopy, { color: theme.text }]}>{response.comment || 'Sin comentario'}</Text>
                    <Text selectable style={[s.cardCopy, { color: theme.muted }]}>
                      Inflamación: {response.swelling ? 'Sí' : 'No'} · Sangrado: {response.bleeding ? 'Sí' : 'No'} · Fiebre: {response.fever ? 'Sí' : 'No'}
                    </Text>
                    {response.photoUri ? <Image source={{ uri: response.photoUri }} style={{ width: '100%', height: 210, borderRadius: 18 }} resizeMode="cover" /> : null}
                  </View>
                ))}
                {!modal.item.reviewed ? <PrimaryButton label="Marcar como revisado" onPress={async () => { try { await onReview(modal.item.id); setModal(null); } catch {} }} /> : null}
                <OutlineButton label="Contactar paciente" theme={theme} onPress={() => notify('Contacto preparado')} />
                <OutlineButton label="Cerrar seguimiento" theme={theme} tone={colors.green} onPress={async () => { try { await onClose(modal.item.id); setModal(null); } catch {} }} />
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
