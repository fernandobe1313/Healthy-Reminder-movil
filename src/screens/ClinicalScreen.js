import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { conditions } from '../data/mock-data';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { GradientButton, IconBadge, LedText, SectionHeader } from '../components/common';

const upperTeeth = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const lowerTeeth = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
const molars = ['18', '17', '16', '26', '27', '28', '48', '47', '46', '36', '37', '38'];
const premolars = ['15', '14', '24', '25', '45', '44', '34', '35'];
const canines = ['13', '23', '43', '33'];

function getEntryValue(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return { condition: entry, note: '' };
  return entry;
}

function getCondition(entry) {
  const normalized = getEntryValue(entry);
  const id = normalized?.condition === 'endo' ? 'endodoncia' : normalized?.condition;
  return conditions.find((condition) => condition.id === id);
}

function conditionCounts(toothMap = {}) {
  return conditions
    .map((condition) => ({
      ...condition,
      count: Object.values(toothMap).filter((entry) => getCondition(entry)?.id === condition.id).length,
    }))
    .filter((condition) => condition.count > 0);
}

function odontogramEntries(toothMap = {}) {
  return Object.entries(toothMap)
    .map(([tooth, entry]) => {
      const normalized = getEntryValue(entry);
      const condition = getCondition(normalized);
      return { tooth, entry: normalized, condition };
    })
    .filter((item) => item.condition)
    .sort((a, b) => Number(a.tooth) - Number(b.tooth));
}

function patientInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'P';
}

function TrashIcon({ color = colors.red }) {
  return (
    <View style={styles.trashIcon}>
      <View style={[styles.trashHandle, { borderColor: color }]} />
      <View style={[styles.trashLid, { backgroundColor: color }]} />
      <View style={[styles.trashCan, { borderColor: color }]}>
        <View style={[styles.trashLine, { backgroundColor: color }]} />
        <View style={[styles.trashLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .trim();
}

function ToothButton({ tooth, arch, entry, selected, disabled, theme, onPress }) {
  const condition = getCondition(entry);
  const isMolar = molars.includes(tooth);
  const isPremolar = premolars.includes(tooth);
  const isCanine = canines.includes(tooth);
  const tone = condition?.color || theme.line;
  const marker = condition?.marker || '';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toothItem,
        disabled && { opacity: 0.45 },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.toothShape,
          isMolar && styles.toothShapeMolar,
          isPremolar && styles.toothShapePremolar,
          isCanine && styles.toothShapeCanine,
          arch === 'lower' && styles.toothShapeLower,
          {
            backgroundColor: condition ? `${tone}20` : theme.input,
            borderColor: selected ? colors.blue : tone,
          },
          selected && styles.toothShapeSelected,
        ]}>
        <View style={[styles.toothGroove, { backgroundColor: condition ? `${tone}55` : theme.line }]} />
        {isMolar ? <View style={[styles.toothGrooveVertical, { backgroundColor: condition ? `${tone}55` : theme.line }]} /> : null}
        {marker ? (
          <View style={[styles.toothMarker, { backgroundColor: `${tone}24`, borderColor: tone }]}>
            <Text style={[styles.toothMarkerText, { color: tone }]}>{marker}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.toothNumber, { color: condition ? tone : theme.soft }]}>{tooth}</Text>
    </Pressable>
  );
}

function PatientSelector({ theme, patients, selectedPatient, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return patients;
    return patients.filter((patient) => normalizeSearchText(`${patient.name} ${patient.phone || ''} ${patient.tag || ''}`).includes(term));
  }, [patients, query]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.clinicalPatientSelect,
          { backgroundColor: theme.card, borderColor: selectedPatient ? colors.blue : theme.line },
          pressed && styles.pressed,
        ]}>
        <View style={[styles.avatar, { backgroundColor: theme.input }]}>
          <Text style={styles.avatarText}>{patientInitials(selectedPatient?.name || 'P')}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text selectable style={[styles.inputLabel, { color: theme.muted }]}>Paciente del odontograma</Text>
          <Text selectable numberOfLines={1} style={[styles.selectValue, { color: selectedPatient ? theme.text : theme.soft }]}>
            {selectedPatient?.name || 'Seleccionar paciente'}
          </Text>
        </View>
        <Text style={[styles.selectChevron, { color: theme.muted }]}>v</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.selectorSheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
          <View style={styles.sheetHeader}>
            <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Seleccionar paciente</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
            </Pressable>
          </View>
          <View style={[styles.searchBox, styles.selectorSearchBox, { backgroundColor: theme.input, borderColor: theme.line }]}>
            <Text style={[styles.searchIcon, { color: theme.muted }]}>?</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              maxLength={100}
              placeholder="Buscar paciente..."
              placeholderTextColor={theme.soft}
              style={[styles.searchInput, { color: theme.text }]}
              autoCapitalize="none"
            />
          </View>
          <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorListContent} keyboardShouldPersistTaps="handled">
            {filtered.map((patient) => (
              <Pressable
                key={patient.id}
                onPress={() => {
                  onSelect(patient.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.selectorRow,
                  {
                    backgroundColor: selectedPatient?.id === patient.id ? `${colors.blue}18` : theme.input,
                    borderColor: selectedPatient?.id === patient.id ? colors.blue : theme.line,
                  },
                  pressed && styles.pressed,
                ]}>
                <Text selectable style={[styles.selectorLabel, { color: selectedPatient?.id === patient.id ? colors.blue : theme.text }]}>{patient.name}</Text>
                <Text selectable style={[styles.selectorMeta, { color: theme.muted }]}>{patient.phone || 'Sin telefono'} - {patient.tag || 'Expediente'}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

export function ClinicalScreen({
  theme,
  patients,
  selectedPatientId,
  setSelectedPatientId,
  selectedTooth,
  setSelectedTooth,
  odontogramByPatient,
  loadOdontogram,
  saveOdontogramEntry,
  deleteOdontogramEntry,
  notify,
}) {
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);
  const patientToothMap = selectedPatient ? odontogramByPatient[selectedPatient.id] || {} : {};
  const selectedEntry = getEntryValue(patientToothMap[selectedTooth]);
  const selectedCondition = getCondition(patientToothMap[selectedTooth]) || conditions[0];
  const counts = conditionCounts(patientToothMap);
  const entries = odontogramEntries(patientToothMap);
  const [draftCondition, setDraftCondition] = useState(selectedCondition.id);
  const [note, setNote] = useState(selectedEntry?.note || '');

  useEffect(() => {
    setDraftCondition(selectedCondition.id);
    setNote(selectedEntry?.note || '');
  }, [selectedPatientId, selectedTooth, selectedCondition.id, selectedEntry?.note]);

  useEffect(() => {
    if (!selectedPatientId) return undefined;
    loadOdontogram(selectedPatientId);
    const interval = setInterval(() => loadOdontogram(selectedPatientId), 5000);
    return () => clearInterval(interval);
  }, [selectedPatientId]);

  const applyCondition = (conditionId) => {
    if (!selectedPatient) {
      notify('Selecciona un paciente primero');
      return;
    }
    setDraftCondition(conditionId);
  };

  const saveEntry = async () => {
    if (!selectedPatient) {
      notify('Selecciona un paciente primero');
      return;
    }
    await saveOdontogramEntry(selectedPatient.id, selectedTooth, draftCondition, note.trim());
  };

  const clearTooth = async () => {
    if (!selectedPatient) {
      notify('Selecciona un paciente primero');
      return;
    }
    setDraftCondition('sano');
    setNote('');
    await saveOdontogramEntry(selectedPatient.id, selectedTooth, 'sano', '');
  };

  const deleteEntry = async (tooth) => {
    if (!selectedPatient) {
      notify('Selecciona un paciente primero');
      return;
    }
    await deleteOdontogramEntry(selectedPatient.id, tooth);
    if (tooth === selectedTooth) {
      setDraftCondition('sano');
      setNote('');
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <PatientSelector theme={theme} patients={patients} selectedPatient={selectedPatient} onSelect={setSelectedPatientId} />

      <View style={[styles.clinicalHero, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={{ flex: 1 }}>
          <LedText selectable style={styles.heroEyebrow}>Odontograma movil</LedText>
          <Text selectable style={[styles.heroText, { color: theme.text }]}>Pieza #{selectedTooth}</Text>
          <Text selectable style={[styles.heroSmall, { color: theme.muted }]}>
            {selectedPatient ? `Estado actual: ${selectedCondition.label}` : 'Selecciona un paciente para registrar acciones'}
          </Text>
        </View>
        <IconBadge icon={selectedCondition.marker || 'T'} color={selectedCondition.color} size={58} />
      </View>

      {selectedPatient && counts.length ? (
        <View style={styles.clinicalCountRow}>
          {counts.map((condition) => (
            <View key={condition.id} style={[styles.clinicalCountChip, { backgroundColor: `${condition.color}18` }]}>
              <Text style={[styles.clinicalCountText, { color: condition.color }]}>{condition.label}: {condition.count}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.odontogramCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={[styles.conditionLegend, { backgroundColor: theme.input }]}>
          {conditions.map((condition) => (
            <View key={condition.id} style={styles.conditionLegendItem}>
              <View style={[styles.conditionLegendDot, { borderColor: condition.color, backgroundColor: `${condition.color}22` }]} />
              <Text style={[styles.conditionLegendText, { color: condition.color }]}>{condition.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.odontogramScrollContent}>
          <View style={styles.odontogramMouth}>
            <Text selectable style={[styles.archLabel, { color: theme.soft }]}>Arcada superior</Text>
            <View style={styles.archRow}>
              {upperTeeth.map((tooth) => (
                <ToothButton
                  key={tooth}
                  tooth={tooth}
                  arch="upper"
                  entry={patientToothMap[tooth]}
                  selected={selectedTooth === tooth}
                  disabled={!selectedPatient}
                  theme={theme}
                  onPress={() => setSelectedTooth(tooth)}
                />
              ))}
            </View>

            <View style={styles.occlusalWrap}>
              <View style={[styles.occlusalLine, { backgroundColor: theme.line }]} />
              <Text selectable style={[styles.occlusalText, { color: theme.soft, backgroundColor: theme.card }]}>Linea oclusal</Text>
            </View>

            <View style={styles.archRow}>
              {lowerTeeth.map((tooth) => (
                <ToothButton
                  key={tooth}
                  tooth={tooth}
                  arch="lower"
                  entry={patientToothMap[tooth]}
                  selected={selectedTooth === tooth}
                  disabled={!selectedPatient}
                  theme={theme}
                  onPress={() => setSelectedTooth(tooth)}
                />
              ))}
            </View>
            <Text selectable style={[styles.archLabel, { color: theme.soft }]}>Arcada inferior</Text>
          </View>
        </ScrollView>
      </View>

      <SectionHeader title="Acciones clinicas" theme={theme} />
      <View style={styles.conditionGrid}>
        {conditions.map((condition) => {
          const active = draftCondition === condition.id;
          return (
            <Pressable
              key={condition.id}
              onPress={() => applyCondition(condition.id)}
              style={[
                styles.conditionChip,
                {
                  backgroundColor: active ? condition.color : theme.card,
                  borderColor: condition.color,
                  opacity: selectedPatient ? 1 : 0.55,
                },
              ]}>
              <Text style={[styles.conditionText, { color: active ? '#ffffff' : condition.color }]}>
                {condition.marker}  {condition.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.clinicalNoteHeader}>
          <View>
            <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Registro de pieza #{selectedTooth}</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{selectedPatient?.name || 'Sin paciente seleccionado'}</Text>
          </View>
          <Pressable onPress={clearTooth} style={({ pressed }) => [styles.clearToothButton, { borderColor: colors.green, backgroundColor: `${colors.green}14` }, pressed && styles.pressed]}>
            <Text style={[styles.clearToothText, { color: colors.green }]}>Sano</Text>
          </Pressable>
        </View>
        <TextInput
          multiline
          value={note}
          onChangeText={(value) => setNote(value.slice(0, 2000))}
          maxLength={2000}
          editable={Boolean(selectedPatient)}
          placeholder="Describe diagnostico, tratamiento realizado, superficies afectadas o seguimiento..."
          placeholderTextColor={theme.soft}
          style={[styles.noteInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line, opacity: selectedPatient ? 1 : 0.55 }]}
        />
        <GradientButton label="Guardar registro" right="" onPress={saveEntry} disabled={!selectedPatient} />
      </View>

      {selectedPatient ? (
        <View style={[styles.clinicalRecordsCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <View style={styles.clinicalNoteHeader}>
            <View>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Registros</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{entries.length} acciones registradas</Text>
            </View>
          </View>
          {entries.length ? (
            <View style={styles.clinicalRecordList}>
              {entries.map((item) => (
                <Pressable
                  key={item.tooth}
                  onPress={() => setSelectedTooth(item.tooth)}
                  style={({ pressed }) => [
                    styles.clinicalRecordRow,
                    { backgroundColor: theme.input, borderColor: theme.line },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.clinicalRecordTooth, { backgroundColor: `${item.condition.color}18` }]}>
                    <Text style={[styles.clinicalRecordToothText, { color: item.condition.color }]}>{item.tooth}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text selectable style={[styles.cardTitle, { color: item.condition.color }]}>{item.condition.label}</Text>
                    <Text selectable numberOfLines={2} style={[styles.cardSub, { color: theme.muted }]}>
                      {item.entry?.note || 'Sin nota clinica'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => deleteEntry(item.tooth)}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.clinicalDeleteButton,
                      { backgroundColor: `${colors.red}12`, borderColor: `${colors.red}35` },
                      pressed && styles.pressed,
                    ]}>
                    <TrashIcon />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={[styles.detailBand, { backgroundColor: theme.input }]}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Sin registros todavia</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Selecciona una pieza y guarda una accion clinica.</Text>
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}
