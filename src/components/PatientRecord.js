import React from 'react';
import { Image, Text, View } from 'react-native';
import { styles } from '../styles';
import { colors } from '../theme/palette';
import { formatDisplayDate } from './PatientForm';

function valueOrDash(value) {
  const clean = String(value || '').trim();
  return clean || 'Sin registrar';
}

function fullName(patient) {
  const composed = [patient.first_name, patient.last_name_paternal, patient.last_name_maternal]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return composed || patient.name || 'Paciente';
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Field({ label, value, theme, wide = false }) {
  return (
    <View style={[styles.recordField, wide && styles.recordFieldWide, { backgroundColor: theme.input, borderColor: theme.line }]}>
      <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>{label}</Text>
      <Text selectable style={[styles.recordValue, { color: theme.text }]}>{valueOrDash(value)}</Text>
    </View>
  );
}

function Section({ title, theme, children }) {
  return (
    <View style={styles.recordSection}>
      <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
        <Text selectable style={styles.formSectionTitle}>{title}</Text>
      </View>
      <View style={styles.recordGrid}>{children}</View>
    </View>
  );
}

export function PatientRecord({ patient, theme }) {
  const name = fullName(patient);
  const displayDate = patient.birth_date ? formatDisplayDate(patient.birth_date) : '';
  const address = [patient.street, patient.ext_number, patient.int_number ? `Int. ${patient.int_number}` : '', patient.neighborhood]
    .filter(Boolean)
    .join(' ');
  const location = [patient.city, patient.state, patient.country].filter(Boolean).join(', ');

  return (
    <View style={styles.recordRoot}>
      <View style={[styles.recordHero, { backgroundColor: theme.input, borderColor: theme.line }]}>
        <View style={[styles.recordAvatar, { backgroundColor: theme.chip }]}>
          {patient.photo_url ? (
            <Image source={{ uri: patient.photo_url }} style={styles.recordAvatarImage} resizeMode="cover" />
          ) : (
            <Text selectable style={styles.recordAvatarText}>{initials(name)}</Text>
          )}
        </View>
        <View style={styles.recordHeroText}>
          <Text selectable style={[styles.recordName, { color: theme.text }]}>{name}</Text>
          <Text selectable style={[styles.recordSubtitle, { color: theme.muted }]}>
            {patient.tag || patient.consultation_reason || 'Paciente'} · {patient.status || 'activo'}
          </Text>
          <View style={styles.inlineChips}>
            <Text style={[styles.smallChip, { color: colors.blue, backgroundColor: `${colors.blue}14` }]}>
              {patient.next || 'Sin cita'}
            </Text>
            <Text style={[styles.smallChip, { color: patient.balance ? colors.red : colors.green, backgroundColor: patient.balance ? `${colors.red}14` : `${colors.green}14` }]}>
              {patient.balance ? `$${patient.balance}` : 'Al dia'}
            </Text>
          </View>
        </View>
      </View>

      <Section title="Datos personales" theme={theme}>
        <Field label="Nombre" value={name} theme={theme} wide />
        <Field label="Genero" value={patient.gender} theme={theme} />
        <Field label="Nacimiento" value={displayDate} theme={theme} />
        <Field label="CURP" value={patient.curp} theme={theme} wide />
        <Field label="RFC" value={patient.rfc} theme={theme} />
        <Field label="Ocupacion" value={patient.occupation} theme={theme} />
        <Field label="Estado civil" value={patient.marital_status} theme={theme} />
      </Section>

      <Section title="Contacto" theme={theme}>
        <Field label="Telefono principal" value={patient.phone_primary || patient.phone} theme={theme} />
        <Field label="Telefono secundario" value={patient.phone_secondary} theme={theme} />
        <Field label="Correo" value={patient.email} theme={theme} wide />
      </Section>

      <Section title="Direccion" theme={theme}>
        <Field label="Direccion" value={address} theme={theme} wide />
        <Field label="Ubicacion" value={location} theme={theme} wide />
        <Field label="Codigo postal" value={patient.zip_code} theme={theme} />
      </Section>

      <Section title="Datos medicos" theme={theme}>
        <Field label="Tipo de sangre" value={patient.blood_type} theme={theme} />
        <Field label="Alergias" value={patient.allergies} theme={theme} wide />
        <Field label="Enfermedades cronicas" value={patient.chronic_diseases} theme={theme} wide />
        <Field label="Medicamentos actuales" value={patient.current_medications} theme={theme} wide />
        <Field label="Antecedentes medicos" value={patient.medical_history} theme={theme} wide />
        <Field label="Antecedentes odontologicos" value={patient.dental_history} theme={theme} wide />
        <Field label="Seguro medico" value={patient.insurance} theme={theme} wide />
      </Section>

      <Section title="Contacto de emergencia" theme={theme}>
        <Field label="Nombre" value={patient.emergency_contact_name} theme={theme} />
        <Field label="Parentesco" value={patient.emergency_contact_relationship} theme={theme} />
        <Field label="Telefono" value={patient.emergency_contact_phone} theme={theme} />
      </Section>

      <Section title="Informacion adicional" theme={theme}>
        <Field label="Motivo de consulta" value={patient.consultation_reason} theme={theme} wide />
        <Field label="Observaciones" value={patient.observations} theme={theme} wide />
        <Field label="Notas internas" value={patient.internal_notes} theme={theme} wide />
      </Section>
    </View>
  );
}
