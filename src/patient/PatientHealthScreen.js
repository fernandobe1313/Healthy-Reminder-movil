import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function documentLines(document) {
  if (document.type === 'Receta') return (document.items || []).map((item, index) => `${index + 1}. ${item.medication || 'Medicamento'}${item.dosage ? ` · ${item.dosage}` : ''}${item.frequency ? ` · ${item.frequency}` : ''}${item.duration ? ` · ${item.duration}` : ''}${item.instructions ? ` · ${item.instructions}` : ''}`);
  if (document.type === 'Presupuesto') return (document.items || []).map((item, index) => `${index + 1}. ${item.service_name || item.description || 'Procedimiento'}${item.tooth_number ? ` · Pieza ${item.tooth_number}` : ''} · $${Number(item.total_price || item.price || 0).toLocaleString('es-MX')}`);
  return document.content ? [document.content] : [document.detail];
}

function documentHtml(document, patientName) {
  const lines = documentLines(document);
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#172033;padding:38px}h1{color:#2563eb;font-size:24px;margin-bottom:4px}.meta{color:#64748b;font-size:12px}.box{margin-top:22px;padding:18px;border:1px solid #dbe4f0;border-radius:12px}.line{padding:10px 0;border-bottom:1px solid #edf2f7}.footer{margin-top:35px;color:#64748b;font-size:11px}</style></head><body><h1>${escapeHtml(document.type)}</h1><h2>${escapeHtml(document.title)}</h2><p class="meta">Paciente: ${escapeHtml(patientName)} · Fecha: ${escapeHtml(document.date)} · Estado: ${escapeHtml(document.status)}</p>${document.diagnosis ? `<p><strong>Diagnóstico:</strong> ${escapeHtml(document.diagnosis)}</p>` : ''}<div class="box">${lines.map(line => `<div class="line">${escapeHtml(line)}</div>`).join('')}</div>${document.notes ? `<p><strong>Notas:</strong> ${escapeHtml(document.notes)}</p>` : ''}${document.type === 'Presupuesto' ? `<h3>Total: $${Number(document.total || 0).toLocaleString('es-MX')} MXN</h3>` : ''}<p class="footer">Documento generado desde HealthyReminder Dental.</p></body></html>`;
}

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
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [sharingDocumentId, setSharingDocumentId] = useState('');
  const plan = state.treatmentPlans.find((item) => item.patient_id === state.currentPatientId);
  const records = state.clinicalRecords.filter((item) => item.patient_id === state.currentPatientId && item.visible !== false);
  const toothMap = state.odontogramByPatient[state.currentPatientId] || {};
  const documents = state.patientDocuments.filter((item) => item.patient_id === state.currentPatientId);

  const shareDocument = async (document) => {
    if (sharingDocumentId) return;
    setSharingDocumentId(document.id);
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir archivos no está disponible en este dispositivo.');
      const patientName = state.currentPatient?.name || state.currentUser?.full_name || 'Paciente';
      const file = await Print.printToFileAsync({ html: documentHtml(document, patientName), base64: false });
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: `Compartir ${document.type}`, UTI: 'com.adobe.pdf' });
    } catch (error) {
      state.notify(error.message || 'No fue posible compartir el documento');
    } finally {
      setSharingDocumentId('');
    }
  };

  useEffect(() => {
    if (tab !== 'Odontograma') return undefined;
    state.refreshPatientOdontogram().catch(() => {});
    const interval = setInterval(() => state.refreshPatientOdontogram().catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, [tab, state.currentPatientId]);

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
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <Pressable onPress={() => setSelectedDocument(item)}><Text style={{ color: colors.purple, fontWeight: '850' }}>Ver detalle</Text></Pressable>
                  <Pressable disabled={Boolean(sharingDocumentId)} onPress={() => shareDocument(item)}><Text style={{ color: colors.blue, fontWeight: '850', opacity: sharingDocumentId ? 0.55 : 1 }}>{sharingDocumentId === item.id ? 'Preparando...' : 'Compartir PDF'}</Text></Pressable>
                </View>
              </View>
            </View>
          )) : <EmptyState title="Sin documentos" copy="Recetas, consentimientos y presupuestos aparecerán aquí." theme={state.theme} />}
        </>
      ) : null}
      <Modal visible={Boolean(selectedDocument)} transparent animationType="slide" onRequestClose={() => setSelectedDocument(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.58)' }}>
          <View style={{ maxHeight: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, backgroundColor: state.theme.card, borderColor: state.theme.line, borderWidth: 1 }}>
            <View style={[s.between, { marginBottom: 14 }]}>
              <View style={{ flex: 1, paddingRight: 12 }}><Text selectable style={[s.eyebrow, { color: colors.blue }]}>{selectedDocument?.type}</Text><Text selectable style={[s.title, { color: state.theme.text }]}>{selectedDocument?.title}</Text></View>
              <Pressable onPress={() => setSelectedDocument(null)} style={{ padding: 10 }}><Text style={{ color: state.theme.muted, fontWeight: '900' }}>Cerrar</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 18 }}>
              <View style={[s.card, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}><Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Fecha: {selectedDocument?.date || 'Sin fecha'}</Text><Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Estado: {selectedDocument?.status || 'Sin estado'}</Text>{selectedDocument?.diagnosis ? <Text selectable style={[s.cardCopy, { color: state.theme.text }]}>Diagnóstico: {selectedDocument.diagnosis}</Text> : null}</View>
              {(selectedDocument ? documentLines(selectedDocument) : []).map((line, index) => <View key={`${selectedDocument?.id}-${index}`} style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}><Text selectable style={[s.cardCopy, { color: state.theme.text }]}>{line}</Text></View>)}
              {selectedDocument?.notes ? <View style={[s.card, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}><Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Notas</Text><Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{selectedDocument.notes}</Text></View> : null}
              {selectedDocument?.type === 'Presupuesto' ? <Text selectable style={[s.title, { color: colors.amber, textAlign: 'right' }]}>Total: {money(selectedDocument.total || 0)}</Text> : null}
              <Pressable disabled={Boolean(sharingDocumentId)} onPress={() => shareDocument(selectedDocument)} style={{ padding: 15, borderRadius: 14, alignItems: 'center', backgroundColor: colors.blue }}><Text style={{ color: '#fff', fontWeight: '900' }}>{sharingDocumentId ? 'Preparando PDF...' : 'Compartir como PDF'}</Text></Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
