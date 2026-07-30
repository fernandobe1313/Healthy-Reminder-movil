import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../theme/palette';
import { conditions } from '../data/mock-data';
import { styles } from '../styles';
import { LedText } from '../components/common';
import { useAppState } from '../navigation/AppStateContext';
import { EmptyState, money, SectionTitle, StatusChip, toneForStatus } from './patient-components';
import { patientStyles as s } from './patient-ui';

const tabs = ['Tratamiento', 'Historial', 'Odontograma', 'Documentos'];
const upperTeeth = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const lowerTeeth = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
const molars = ['18', '17', '16', '26', '27', '28', '48', '47', '46', '36', '37', '38'];
const premolars = ['15', '14', '24', '25', '45', '44', '34', '35'];
const canines = ['13', '23', '43', '33'];

function conditionFor(value) {
  const id = typeof value === 'string' ? value : value?.condition;
  return conditions.find((item) => item.id === id) || conditions[0];
}

function PatientTooth({ tooth, arch, entry, theme }) {
  const condition = conditionFor(entry);
  const hasRecord = Boolean(entry);
  const tone = hasRecord ? condition.color : theme.line;
  return (
    <View style={styles.toothItem}>
      <View style={[
        styles.toothShape,
        molars.includes(tooth) && styles.toothShapeMolar,
        premolars.includes(tooth) && styles.toothShapePremolar,
        canines.includes(tooth) && styles.toothShapeCanine,
        arch === 'lower' && styles.toothShapeLower,
        {
          backgroundColor: hasRecord ? `${tone}20` : theme.input,
          borderColor: tone,
        },
      ]}>
        <View style={[styles.toothGroove, { backgroundColor: hasRecord ? `${tone}55` : theme.line }]} />
        {molars.includes(tooth) ? <View style={[styles.toothGrooveVertical, { backgroundColor: hasRecord ? `${tone}55` : theme.line }]} /> : null}
        {hasRecord ? (
          <View style={[styles.toothMarker, { backgroundColor: `${tone}24`, borderColor: tone }]}>
            <Text style={[styles.toothMarkerText, { color: tone }]}>{condition.marker}</Text>
          </View>
        ) : null}
      </View>
      <Text selectable style={[styles.toothNumber, { color: hasRecord ? tone : theme.soft }]}>{tooth}</Text>
    </View>
  );
}

export function PatientHealthScreen() {
  const state = useAppState();
  const [tab, setTab] = useState('Tratamiento');
  const plan = state.treatmentPlans.find((item) => item.patient_id === state.currentPatientId);
  const records = state.clinicalRecords.filter((item) => item.patient_id === state.currentPatientId && item.visible !== false);
  const toothMap = state.odontogramByPatient[state.currentPatientId] || {};
  const documents = state.patientDocuments.filter((item) => item.patient_id === state.currentPatientId);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={[s.tabs, { backgroundColor: state.theme.card, padding: 6, borderRadius: 18 }]}>
        {tabs.map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[s.tab, { backgroundColor: tab === item ? state.theme.chip : 'transparent' }]}>
            <Text style={[s.tabText, { color: tab === item ? colors.blue : state.theme.muted }]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Tratamiento' ? (
        plan ? (
          <>
            <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
              <View style={s.between}>
                <View style={{ flex: 1 }}>
                  <Text selectable style={[s.eyebrow, { color: colors.purple }]}>Plan activo</Text>
                  <Text selectable style={[s.title, { color: state.theme.text }]}>{plan.name}</Text>
                </View>
                <StatusChip label={plan.status} tone={colors.purple} />
              </View>
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Responsable: {plan.dentist} · Inicio: {plan.started_at}</Text>
              <View style={[s.progressTrack, { backgroundColor: state.theme.input }]}>
                <View style={[s.progressFill, { width: `${plan.progress}%`, backgroundColor: colors.purple }]} />
              </View>
              <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>{plan.progress}% completado</Text>
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Próxima etapa: {plan.next_step}</Text>
            </View>
            <SectionTitle theme={state.theme}>Procedimientos</SectionTitle>
            {plan.items.map((item, index) => (
              <View key={item.id} style={s.row}>
                <View style={s.timeline}>
                  <View style={[s.timelineDot, { backgroundColor: toneForStatus(item.status) }]} />
                  {index < plan.items.length - 1 ? <View style={[s.timelineLine, { backgroundColor: state.theme.line }]} /> : null}
                </View>
                <View style={[s.card, { flex: 1, backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
                  <View style={s.between}>
                    <Text selectable style={[s.cardTitle, { color: state.theme.text, flex: 1 }]}>{item.name}</Text>
                    <StatusChip label={item.status} tone={toneForStatus(item.status)} />
                  </View>
                  <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Pieza: {item.tooth} · {money(item.price)}</Text>
                </View>
              </View>
            ))}
          </>
        ) : <EmptyState title="Sin plan activo" copy="Tu plan de tratamiento aparecerá aquí cuando el dentista lo registre." theme={state.theme} />
      ) : null}

      {tab === 'Historial' ? (
        <>
          <SectionTitle theme={state.theme}>Historial clínico visible</SectionTitle>
          {records.length ? records.map((item) => (
            <View key={item.id} style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
              <View style={s.between}>
                <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{item.diagnosis}</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.soft }]}>{item.date}</Text>
              </View>
              <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>Tratamiento: {item.treatment}</Text>
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Evolución: {item.evolution}</Text>
              <View style={[s.divider, { backgroundColor: state.theme.line }]} />
              <Text selectable style={[s.cardCopy, { color: colors.blue }]}>Seguimiento: {item.follow_up}</Text>
            </View>
          )) : <EmptyState title="Sin registros visibles" copy="Los registros autorizados por tu dentista se mostrarán aquí." theme={state.theme} />}
          <Text selectable style={[s.cardCopy, { color: state.theme.soft, textAlign: 'center' }]}>Las notas internas del profesional no forman parte de esta vista.</Text>
        </>
      ) : null}

      {tab === 'Odontograma' ? (
        <>
          <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <LedText selectable style={s.eyebrow}>Solo lectura</LedText>
            <Text selectable style={[s.title, { color: state.theme.text }]}>Tu odontograma</Text>
            <Text selectable style={[s.subtitle, { color: state.theme.muted }]}>Los cambios que registre tu dentista se reflejan automáticamente.</Text>
          </View>
          <View style={[styles.odontogramCard, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <View style={[styles.conditionLegend, { backgroundColor: state.theme.input }]}>
              {conditions.map((condition) => (
                <View key={condition.id} style={styles.conditionLegendItem}>
                  <View style={[styles.conditionLegendDot, { borderColor: condition.color, backgroundColor: `${condition.color}22` }]} />
                  <Text selectable style={[styles.conditionLegendText, { color: condition.color }]}>{condition.label}</Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.odontogramScrollContent}>
              <View style={styles.odontogramMouth}>
                <Text selectable style={[styles.archLabel, { color: state.theme.soft }]}>Arcada superior</Text>
                <View style={styles.archRow}>
                  {upperTeeth.map((tooth) => <PatientTooth key={tooth} tooth={tooth} arch="upper" entry={toothMap[tooth]} theme={state.theme} />)}
                </View>
                <View style={styles.occlusalWrap}>
                  <View style={[styles.occlusalLine, { backgroundColor: state.theme.line }]} />
                  <Text selectable style={[styles.occlusalText, { color: state.theme.soft, backgroundColor: state.theme.card }]}>Línea oclusal</Text>
                </View>
                <View style={styles.archRow}>
                  {lowerTeeth.map((tooth) => <PatientTooth key={tooth} tooth={tooth} arch="lower" entry={toothMap[tooth]} theme={state.theme} />)}
                </View>
                <Text selectable style={[styles.archLabel, { color: state.theme.soft }]}>Arcada inferior</Text>
              </View>
            </ScrollView>
          </View>
          <View style={[s.card, { backgroundColor: `${colors.blue}0E`, borderColor: `${colors.blue}35` }]}>
            <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Vista informativa</Text>
            <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>
              Este odontograma es de consulta. Solo el equipo clínico puede registrar o modificar el estado de una pieza.
            </Text>
          </View>
        </>
      ) : null}

      {tab === 'Documentos' ? (
        <>
          <SectionTitle theme={state.theme}>Recetas y documentos</SectionTitle>
          {documents.length ? documents.map((item) => (
            <View key={item.id} style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
              <View style={s.between}>
                <StatusChip label={item.type} tone={item.type === 'Receta' ? colors.green : item.type === 'Presupuesto' ? colors.amber : colors.purple} />
                <Text selectable style={[s.cardCopy, { color: state.theme.soft }]}>{item.date}</Text>
              </View>
              <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{item.title}</Text>
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{item.detail}</Text>
              <View style={s.between}>
                <StatusChip label={item.status} tone={toneForStatus(item.status)} />
                <Pressable onPress={() => state.notify('Documento preparado para compartir')}>
                  <Text style={{ color: colors.blue, fontWeight: '850' }}>Compartir</Text>
                </Pressable>
              </View>
            </View>
          )) : <EmptyState title="Sin documentos" copy="Recetas, consentimientos y presupuestos aparecerán aquí." theme={state.theme} />}
        </>
      ) : null}
    </ScrollView>
  );
}
