import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Country, State } from 'country-state-city';
import { styles } from '../styles';
import { colors } from '../theme/palette';
import { GradientButton, Input } from './common';

const occupations = [
  'Estudiante',
  'Empleado',
  'Comerciante',
  'Docente',
  'Ama de casa',
  'Ingeniero',
  'Medico',
  'Enfermero',
  'Abogado',
  'Contador',
  'Jubilado',
  'Desempleado',
  'Otro',
];

function titleCaseWord(value) {
  return value.charAt(0).toLocaleUpperCase('es-MX') + value.slice(1).toLocaleLowerCase('es-MX');
}

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s+]/g, ' ')
    .toLocaleLowerCase('es-MX')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatPersonName(value = '') {
  return value
    .toLocaleLowerCase('es-MX')
    .replace(/(^|[\s'-])([a-z\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1])/gi, (match, separator, letter) => `${separator}${titleCaseWord(letter)}`);
}

export function formatUpper(value = '') {
  return value.toLocaleUpperCase('es-MX');
}

export function formatCode(value = '') {
  return formatUpper(value).replace(/\s/g, '');
}

export function formatDisplayDate(value = '') {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function parseSelectedDate(value = '') {
  if (!value) return new Date(1995, 0, 1);
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(1995, 0, 1);
  return new Date(year, month - 1, day);
}

function toStoredDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function countryFlag(isoCode = '') {
  if (isoCode.length !== 2) return '';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function normalizeDialCode(phonecode = '') {
  const clean = String(phonecode).replace(/\D/g, '').trim();
  return clean ? `+${clean}` : '';
}

function displayCountryName(country) {
  if (country.isoCode === 'MX') return 'M\u00E9xico';
  return country.name;
}

function addDialCode(phone, dialCode) {
  const value = String(phone || '').trim();
  if (!dialCode) return value;
  if (!value) return `${dialCode} `;
  if (value.startsWith('+')) return value;
  return `${dialCode} ${value}`;
}

function SectionTitle({ children, theme }) {
  return (
    <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
      <Text selectable style={styles.formSectionTitle}>{children}</Text>
    </View>
  );
}

function ChoiceRow({ theme, form, field, options, updateForm }) {
  return (
    <View style={styles.choiceRow}>
      {options.map((option) => {
        const active = form[field] === option;
        return (
          <Pressable
            key={`${field}-${option}`}
            onPress={() => updateForm(field, option)}
            style={[
              styles.choiceChip,
              { backgroundColor: active ? `${colors.blue}22` : theme.input, borderColor: active ? colors.blue : theme.line },
            ]}>
            <Text style={[styles.choiceChipText, { color: active ? colors.blue : theme.muted }]}>{option || '-'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SelectField({ label, value, placeholder, theme, icon, error, meta, onPress }) {
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.inputShell,
          styles.selectShell,
          { backgroundColor: theme.input, borderColor: error ? colors.red : theme.line },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.inputIcon, { color: theme.muted }]}>{icon}</Text>
        <View style={styles.selectValueWrap}>
          <Text selectable numberOfLines={1} style={[styles.selectValue, { color: value ? theme.text : theme.soft }]}>
            {value || placeholder}
          </Text>
        </View>
        {meta ? <Text selectable style={[styles.selectMeta, { color: theme.muted }]}>{meta}</Text> : null}
        <Text style={[styles.selectChevron, { color: theme.muted }]}>v</Text>
      </Pressable>
      {error ? <Text selectable style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

function DateField({ theme, value, error, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseSelectedDate(value);

  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>Fecha nacimiento</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.inputShell,
          styles.selectShell,
          { backgroundColor: theme.input, borderColor: error ? colors.red : theme.line },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.inputIcon, { color: colors.blue }]}>{'\uD83D\uDCC5'}</Text>
        <View style={styles.selectValueWrap}>
          <Text selectable numberOfLines={1} style={[styles.selectValue, { color: value ? theme.text : theme.soft }]}>
            {value ? formatDisplayDate(value) : 'dd/mm/aaaa'}
          </Text>
        </View>
        <Text style={[styles.selectChevron, { color: colors.blue }]}>+</Text>
      </Pressable>
      {error ? <Text selectable style={styles.inputError}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.datePickerCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Fecha de nacimiento</Text>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            themeVariant={theme.name === 'dark' ? 'dark' : 'light'}
            accentColor={colors.blue}
            maximumDate={new Date()}
            onChange={(event, date) => {
              if (date) onChange(toStoredDate(date));
              if (Platform.OS === 'android') setOpen(false);
            }}
          />
          <GradientButton label="Listo" onPress={() => setOpen(false)} right="" />
        </View>
      </Modal>
    </View>
  );
}

function PhotoPicker({ theme, form, updateForm, notify }) {
  const [open, setOpen] = useState(false);
  const hasPhoto = Boolean(form.photo_url);

  const pickImage = async (source) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      notify(source === 'camera' ? 'Activa el permiso de camara' : 'Activa el permiso de galeria');
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.[0]?.uri) {
      updateForm('photo_url', result.assets[0].uri);
      notify('Foto actualizada');
      setOpen(false);
    }
  };

  const removeImage = () => {
    updateForm('photo_url', '');
    notify('Foto removida');
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.photoUploadCard, { backgroundColor: theme.input, borderColor: theme.line }]}>
        <View style={[styles.photoBox, { borderColor: theme.line, backgroundColor: theme.card }]}>
          {hasPhoto ? (
            <Image source={{ uri: form.photo_url }} style={styles.patientPhotoPreview} resizeMode="cover" />
          ) : (
            <Text style={[styles.photoIcon, { color: theme.muted }]}>+</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable style={[styles.cardTitle, { color: theme.text }]}>
            {hasPhoto ? 'Foto del paciente' : 'Agregar foto'}
          </Text>
          <Text selectable style={[styles.photoHint, { color: theme.muted }]}>
            {hasPhoto ? 'Toca para cambiar, recortar o quitar la imagen.' : 'Toca para tomar una foto o elegir desde galeria.'}
          </Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.photoActionSheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
          <View style={styles.sheetHeader}>
            <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Foto del paciente</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
            </Pressable>
          </View>
          {hasPhoto ? (
            <Image source={{ uri: form.photo_url }} style={styles.photoLargePreview} resizeMode="cover" />
          ) : null}
          <View style={styles.photoActionGrid}>
            <Pressable onPress={() => pickImage('camera')} style={({ pressed }) => [styles.photoActionButton, { backgroundColor: theme.input, borderColor: theme.line }, pressed && styles.pressed]}>
              <Text style={[styles.photoActionIcon, { color: colors.blue }]}>Cam</Text>
              <Text selectable style={[styles.photoActionText, { color: theme.text }]}>Camara</Text>
            </Pressable>
            <Pressable onPress={() => pickImage('library')} style={({ pressed }) => [styles.photoActionButton, { backgroundColor: theme.input, borderColor: theme.line }, pressed && styles.pressed]}>
              <Text style={[styles.photoActionIcon, { color: colors.purple }]}>Img</Text>
              <Text selectable style={[styles.photoActionText, { color: theme.text }]}>Galeria</Text>
            </Pressable>
          </View>
          {hasPhoto ? (
            <Pressable onPress={removeImage} style={({ pressed }) => [styles.photoRemoveButton, { backgroundColor: `${colors.red}14`, borderColor: `${colors.red}35` }, pressed && styles.pressed]}>
              <Text selectable style={styles.photoRemoveText}>Quitar foto</Text>
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function SearchableOptionSheet({ theme, selector, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery('');
  }, [selector]);

  const filtered = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return selector?.options || [];
    return (selector?.options || []).filter((option) =>
      normalizeSearchText(option.searchText || `${option.label} ${option.meta || ''}`).includes(term)
    );
  }, [query, selector]);

  return (
    <Modal visible={Boolean(selector)} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.selectorBackdrop} onPress={onClose} />
      <View style={[styles.selectorSheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
        <View style={styles.sheetHeader}>
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>{selector?.title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
          </Pressable>
        </View>
        <View style={[styles.searchBox, styles.selectorSearchBox, { backgroundColor: theme.input, borderColor: theme.line }]}>
          <Text style={[styles.searchIcon, { color: theme.muted }]}>?</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            maxLength={100}
            placeholder="Buscar..."
            placeholderTextColor={theme.soft}
            style={[styles.searchInput, { color: theme.text }]}
            autoCapitalize="none"
          />
        </View>
        <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorListContent} keyboardShouldPersistTaps="handled">
          {filtered.length ? (
            filtered.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  selector.onSelect(option);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.selectorRow,
                  { backgroundColor: option.active ? `${colors.blue}18` : theme.input, borderColor: option.active ? colors.blue : theme.line },
                  pressed && styles.pressed,
                ]}>
                <Text selectable numberOfLines={1} style={[styles.selectorLabel, { color: option.active ? colors.blue : theme.text }]}>
                  {option.label}
                </Text>
                {option.meta ? <Text selectable style={[styles.selectorMeta, { color: theme.muted }]}>{option.meta}</Text> : null}
              </Pressable>
            ))
          ) : (
            <View style={[styles.selectorEmpty, { backgroundColor: theme.input, borderColor: theme.line }]}>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>No hay opciones para esta busqueda.</Text>
            </View>
          )}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function PatientForm({ theme, form, updateForm, errors, notify }) {
  const [selector, setSelector] = useState(null);

  const countries = useMemo(
    () =>
      Country.getAllCountries()
        .map((country) => {
          const flag = country.flag || countryFlag(country.isoCode);
          const dialCode = normalizeDialCode(country.phonecode);
          const name = displayCountryName(country);
          return {
            value: country.isoCode,
            label: `${flag} ${name}`,
            meta: dialCode,
            searchText: `${name} ${country.name} ${country.isoCode} ${dialCode} ${country.phonecode}`,
            raw: { ...country, displayName: name, dialCode, flag },
            active: form.country_code === country.isoCode,
          };
        })
        .sort((a, b) => a.raw.displayName.localeCompare(b.raw.displayName, 'es')),
    [form.country_code]
  );

  const states = useMemo(
    () =>
      State.getStatesOfCountry(form.country_code || 'MX').map((state) => ({
        value: state.isoCode,
        label: state.name,
        meta: form.country || 'M\u00E9xico',
        searchText: `${state.name} ${state.isoCode} ${form.country || 'M\u00E9xico'}`,
        raw: state,
        active: form.state_code === state.isoCode || form.state === state.name,
      })),
    [form.country, form.country_code, form.state, form.state_code]
  );

  const occupationOptions = occupations.map((occupation) => ({
    value: occupation,
    label: occupation,
    searchText: occupation,
    active: form.occupation === occupation,
  }));

  const openOccupationSelector = () => {
    setSelector({
      title: 'Seleccionar ocupacion',
      options: occupationOptions,
      onSelect: (option) => updateForm({ occupation: option.value, occupation_other: option.value === 'Otro' ? form.occupation_other : '' }),
    });
  };

  const openCountrySelector = () => {
    setSelector({
      title: 'Seleccionar pais',
      options: countries,
      onSelect: (option) => {
        const country = option.raw;
        updateForm({
          country: country.displayName,
          country_code: country.isoCode,
          country_phone_code: country.dialCode,
          state: '',
          state_code: '',
          phone_primary: addDialCode(form.phone_primary, country.dialCode),
          phone_secondary: addDialCode(form.phone_secondary, country.dialCode),
          emergency_contact_phone: addDialCode(form.emergency_contact_phone, country.dialCode),
        });
        notify(`Pais seleccionado: ${country.flag} ${country.displayName}`);
      },
    });
  };

  const openStateSelector = () => {
    setSelector({
      title: states.length ? 'Seleccionar estado' : 'Estado o provincia',
      options: states,
      onSelect: (option) => updateForm({ state: option.raw.name, state_code: option.raw.isoCode }),
    });
  };

  return (
    <>
      <PhotoPicker theme={theme} form={form} updateForm={updateForm} notify={notify} />

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Datos personales</SectionTitle>
        <Input label="Nombre *" value={form.first_name} error={errors.first_name} onChangeText={(value) => updateForm('first_name', formatPersonName(value))} theme={theme} icon="A" placeholder="Ej. Maria" autoCapitalize="words" sanitize="letters" maxLength={80} />
        <Input label="Apellido paterno *" value={form.last_name_paternal} error={errors.last_name_paternal} onChangeText={(value) => updateForm('last_name_paternal', formatPersonName(value))} theme={theme} icon="P" placeholder="Lopez" autoCapitalize="words" sanitize="letters" maxLength={80} />
        <Input label="Apellido materno" value={form.last_name_maternal} error={errors.last_name_maternal} onChangeText={(value) => updateForm('last_name_maternal', formatPersonName(value))} theme={theme} icon="M" placeholder="Garcia" autoCapitalize="words" sanitize="letters" maxLength={80} />
        <Text selectable style={[styles.inputLabel, { color: theme.text }]}>Genero</Text>
        <ChoiceRow theme={theme} form={form} field="gender" options={['Femenino', 'Masculino', 'Otro']} updateForm={updateForm} />
        <DateField theme={theme} value={form.birth_date} error={errors.birth_date} onChange={(value) => updateForm('birth_date', value)} />
        <Input label="CURP" value={form.curp} error={errors.curp} onChangeText={(value) => updateForm('curp', formatCode(value))} theme={theme} icon="C" placeholder="CURP" autoCapitalize="characters" maxLength={18} />
        <Input label="RFC" value={form.rfc} error={errors.rfc} onChangeText={(value) => updateForm('rfc', formatCode(value))} theme={theme} icon="R" placeholder="RFC" autoCapitalize="characters" maxLength={13} />
        <SelectField label="Ocupacion" value={form.occupation === 'Otro' && form.occupation_other ? form.occupation_other : form.occupation} placeholder="Seleccionar ocupacion" theme={theme} icon="O" onPress={openOccupationSelector} />
        {form.occupation === 'Otro' ? (
          <Input label="Otra ocupacion" value={form.occupation_other} onChangeText={(value) => updateForm('occupation_other', formatPersonName(value))} theme={theme} icon="+" placeholder="Especifica la ocupacion" autoCapitalize="words" />
        ) : null}
        <Text selectable style={[styles.inputLabel, { color: theme.text }]}>Estado civil</Text>
        <ChoiceRow theme={theme} form={form} field="marital_status" options={['Soltero', 'Casado', 'Union libre', 'Otro']} updateForm={updateForm} />
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Contacto</SectionTitle>
        <Input label="Telefono principal" value={form.phone_primary} error={errors.phone_primary} onChangeText={(value) => updateForm('phone_primary', value)} theme={theme} icon={form.country_phone_code || '#'} placeholder={`${form.country_phone_code || '+52'} 55 0000 0000`} keyboardType="phone-pad" sanitize="phone" maxLength={22} />
        <Input label="Telefono secundario" value={form.phone_secondary} error={errors.phone_secondary} onChangeText={(value) => updateForm('phone_secondary', value)} theme={theme} icon={form.country_phone_code || '#'} placeholder={`${form.country_phone_code || '+52'} 55 0000 0000`} keyboardType="phone-pad" maxLength={22} />
        <Input label="Correo electronico" value={form.email} error={errors.email} onChangeText={(value) => updateForm('email', value.trim())} theme={theme} icon="@" placeholder="paciente@email.com" keyboardType="email-address" autoCapitalize="none" maxLength={160} />
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Direccion</SectionTitle>
        <Input label="Calle" value={form.street} onChangeText={(value) => updateForm('street', value)} theme={theme} icon="C" placeholder="Calle" autoCapitalize="words" />
        <Input label="Num. exterior" value={form.ext_number} onChangeText={(value) => updateForm('ext_number', value)} theme={theme} icon="#" placeholder="123" />
        <Input label="Num. interior" value={form.int_number} onChangeText={(value) => updateForm('int_number', value)} theme={theme} icon="#" placeholder="Depto 4" />
        <Input label="Colonia" value={form.neighborhood} onChangeText={(value) => updateForm('neighborhood', value)} theme={theme} icon="N" placeholder="Colonia" autoCapitalize="words" />
        <Input label="Ciudad" value={form.city} onChangeText={(value) => updateForm('city', value)} theme={theme} icon="U" placeholder="Ciudad" autoCapitalize="words" />
        <SelectField label="Pais" value={`${countryFlag(form.country_code || 'MX')} ${form.country || 'M\u00E9xico'}`} meta={form.country_phone_code || '+52'} placeholder="Seleccionar pais" theme={theme} icon="P" onPress={openCountrySelector} />
        {states.length ? (
          <SelectField label="Estado" value={form.state} placeholder="Seleccionar estado" theme={theme} icon="E" onPress={openStateSelector} />
        ) : (
          <Input label="Estado" value={form.state} onChangeText={(value) => updateForm('state', value)} theme={theme} icon="E" placeholder="Estado o provincia" autoCapitalize="words" />
        )}
        <Input label="Codigo postal" value={form.zip_code} error={errors.zip_code} onChangeText={(value) => updateForm('zip_code', value)} theme={theme} icon="#" placeholder="00000" keyboardType="number-pad" sanitize="digits" maxLength={5} />
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Datos medicos</SectionTitle>
        <Text selectable style={[styles.inputLabel, { color: theme.text }]}>Tipo de sangre</Text>
        <ChoiceRow theme={theme} form={form} field="blood_type" options={['', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']} updateForm={updateForm} />
        <Input label="Alergias" value={form.allergies} onChangeText={(value) => updateForm('allergies', value)} theme={theme} icon="!" placeholder="Medicamentos, alimentos..." />
        <Input label="Enfermedades cronicas" value={form.chronic_diseases} onChangeText={(value) => updateForm('chronic_diseases', value)} theme={theme} icon="+" placeholder="Diabetes, hipertension..." />
        <Input label="Medicamentos actuales" value={form.current_medications} onChangeText={(value) => updateForm('current_medications', value)} theme={theme} icon="Rx" placeholder="Nombre y dosis" />
        <Input label="Antecedentes medicos" value={form.medical_history} onChangeText={(value) => updateForm('medical_history', value)} theme={theme} icon="M" placeholder="Antecedentes importantes" multiline />
        <Input label="Antecedentes odontologicos" value={form.dental_history} onChangeText={(value) => updateForm('dental_history', value)} theme={theme} icon="D" placeholder="Tratamientos previos" multiline />
        <Input label="Seguro medico" value={form.insurance} onChangeText={(value) => updateForm('insurance', value)} theme={theme} icon="S" placeholder="Aseguradora o poliza" />
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Contacto de emergencia</SectionTitle>
        <Input label="Nombre" value={form.emergency_contact_name} onChangeText={(value) => updateForm('emergency_contact_name', formatPersonName(value))} theme={theme} icon="N" placeholder="Nombre completo" autoCapitalize="words" />
        <Input label="Parentesco" value={form.emergency_contact_relationship} onChangeText={(value) => updateForm('emergency_contact_relationship', formatPersonName(value))} theme={theme} icon="P" placeholder="Madre, pareja..." autoCapitalize="words" />
        <Input label="Telefono" value={form.emergency_contact_phone} error={errors.emergency_contact_phone} onChangeText={(value) => updateForm('emergency_contact_phone', value)} theme={theme} icon={form.country_phone_code || '#'} placeholder={`${form.country_phone_code || '+52'} 55 0000 0000`} keyboardType="phone-pad" maxLength={22} />
      </View>

      <View style={styles.formSection}>
        <SectionTitle theme={theme}>Informacion adicional</SectionTitle>
        <Input label="Motivo de consulta" value={form.consultation_reason} onChangeText={(value) => updateForm('consultation_reason', value)} theme={theme} icon="?" placeholder="Motivo principal" multiline />
        <Input label="Observaciones" value={form.observations} onChangeText={(value) => updateForm('observations', value)} theme={theme} icon="O" placeholder="Notas visibles del expediente" multiline />
        <Input label="Notas internas" value={form.internal_notes} onChangeText={(value) => updateForm('internal_notes', value)} theme={theme} icon="N" placeholder="Notas administrativas" multiline />
        <Text selectable style={[styles.inputLabel, { color: theme.text }]}>Estado</Text>
        <ChoiceRow theme={theme} form={form} field="status" options={['activo', 'inactivo']} updateForm={updateForm} />
      </View>

      <SearchableOptionSheet theme={theme} selector={selector} onClose={() => setSelector(null)} />
    </>
  );
}
