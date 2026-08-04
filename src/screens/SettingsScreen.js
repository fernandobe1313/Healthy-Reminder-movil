import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Country } from 'country-state-city';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { AppLogo, GradientButton, Input, LedText, SettingRow } from '../components/common';
import { useVisualEffects } from '../theme/visual-effects';
import { resources } from '../api/resources';

const defaultLogo = require('../../assets/logoHR.png');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const digits = (value = '') => String(value).replace(/\D/g, '');

const tabs = [
  { id: 'clinic', label: 'Consultorio', icon: 'C' },
  { id: 'hours', label: 'Horarios', icon: 'H' },
  { id: 'security', label: 'Seguridad', icon: 'S' },
];

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s+]/g, ' ')
    .toLocaleLowerCase('es-MX')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayCountryName(country) {
  if (country.isoCode === 'MX') return 'Mexico';
  return country.name;
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
                key={String(option.value)}
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

function SelectField({ label, value, placeholder, theme, icon, meta, onPress }) {
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.inputShell,
          styles.selectShell,
          { backgroundColor: theme.input, borderColor: theme.line },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.inputIcon, { color: theme.muted }]}>{icon}</Text>
        <View style={styles.selectValueWrap}>
          <Text selectable numberOfLines={1} style={[styles.selectValue, { color: value ? theme.text : theme.soft }]}>
            {value || placeholder}
          </Text>
        </View>
        {meta ? <Text selectable numberOfLines={1} style={[styles.selectMeta, { color: theme.muted }]}>{meta}</Text> : null}
        <Text style={[styles.selectChevron, { color: theme.muted }]}>v</Text>
      </Pressable>
    </View>
  );
}

export function SettingsScreen({ theme, themeMode, setThemeMode, onLogout, notify, currentUser, notificationsEnabled, setNotificationsEnabled }) {
  const [activeTab, setActiveTab] = useState('clinic');
  const [selector, setSelector] = useState(null);
  const [logoSheetOpen, setLogoSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { ledEnabled, setLedEnabled } = useVisualEffects();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const [clinic, setClinic] = useState({
    logo_url: '',
    name: 'HealthyReminder Dental',
    owner: 'Dr. Administrador',
    phone: '442-000-0000',
    email: 'admin@healthyreminder.com',
    street: '',
    extNumber: '',
    intNumber: '',
    neighborhood: '',
    city: 'Queretaro',
    state: 'Queretaro',
    country: 'Mexico',
    countryCode: 'MX',
    zip: '',
    currency: 'MXN',
    policies: '',
  });
  const [hours, setHours] = useState({
    open: '08:00',
    close: '20:00',
    duration: '30',
    lunchStart: '14:00',
    lunchEnd: '15:00',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordRequest, setPasswordRequest] = useState(null);
  const [requestReason, setRequestReason] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    if (activeTab !== 'security') return;
    resources.myPasswordChangeRequest().then(setPasswordRequest).catch((error) => notify?.(error.message));
  }, [activeTab]);

  const requestPasswordChange = async () => {
    setPasswordBusy(true);
    try {
      setPasswordRequest(await resources.requestPasswordChange({ reason: requestReason.trim() }));
      setRequestReason('');
      notify?.('Solicitud enviada al administrador');
    } catch (error) { notify?.(error.message); }
    finally { setPasswordBusy(false); }
  };

  const completePasswordChange = async () => {
    if (!passwords.current || passwords.next.length < 12 || !/[A-Za-z]/.test(passwords.next) || !/\d/.test(passwords.next) || !/[^A-Za-z0-9]/.test(passwords.next) || passwords.next !== passwords.confirm) {
      notify?.('La contraseña debe coincidir y tener 12 caracteres, una letra, un número y un símbolo');
      return;
    }
    setPasswordBusy(true);
    try {
      await resources.changePassword({ current_password: passwords.current, new_password: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordRequest(await resources.myPasswordChangeRequest());
      notify?.('Contraseña actualizada');
    } catch (error) { notify?.(error.message); }
    finally { setPasswordBusy(false); }
  };

  useEffect(() => {
    let active = true;
    resources.config()
      .then((config) => {
        if (!active) return;
        const country = config.country || 'Mexico';
        const countryMatch = Country.getAllCountries().find((item) => (
          normalizeSearchText(item.name) === normalizeSearchText(country)
          || (item.isoCode === 'MX' && ['mexico', 'me xico'].includes(normalizeSearchText(country)))
        ));
        setClinic({
          logo_url: config.logo_url || '',
          name: config.clinic_name || '',
          owner: config.owner_name || '',
          phone: config.phone || '',
          email: config.email || '',
          street: config.street || '',
          extNumber: config.ext_number || '',
          intNumber: config.int_number || '',
          neighborhood: config.neighborhood || '',
          city: config.city || '',
          state: config.state || '',
          country,
          countryCode: countryMatch?.isoCode || 'MX',
          zip: config.zip_code || '',
          currency: config.currency || 'MXN',
          policies: config.internal_policies || '',
        });
        setHours({
          open: config.opening_time || '08:00',
          close: config.closing_time || '20:00',
          duration: String(config.default_appointment_duration || 30),
        });
      })
      .catch((error) => notify?.(error.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const updateClinic = (key, value) => setClinic((prev) => ({ ...prev, [key]: value }));
  const updateHours = (key, value) => setHours((prev) => ({ ...prev, [key]: value }));
  const updatePassword = (key, value) => setPasswords((prev) => ({ ...prev, [key]: value }));
  const configPayload = () => ({
    clinic_name: clinic.name.trim(),
    owner_name: clinic.owner.trim(),
    phone: clinic.phone.trim(),
    email: clinic.email.trim(),
    street: clinic.street.trim(),
    ext_number: clinic.extNumber.trim(),
    int_number: clinic.intNumber.trim(),
    neighborhood: clinic.neighborhood.trim(),
    city: clinic.city.trim(),
    state: clinic.state.trim(),
    country: clinic.country.trim(),
    zip_code: clinic.zip.trim(),
    opening_time: hours.open.trim(),
    closing_time: hours.close.trim(),
    default_appointment_duration: Number(hours.duration) || 30,
    currency: clinic.currency.trim() || 'MXN',
    internal_policies: clinic.policies.trim(),
    logo_url: clinic.logo_url,
  });

  const saveConfig = async (message) => {
    if (!clinic.name.trim()) {
      notify?.('El nombre del consultorio es obligatorio');
      return;
    }
    if (clinic.email.trim() && !EMAIL_PATTERN.test(clinic.email.trim())) {
      notify?.('Ingresa un correo electrónico válido');
      return;
    }
    if (clinic.phone.trim() && (digits(clinic.phone).length < 8 || digits(clinic.phone).length > 15)) {
      notify?.('El teléfono debe contener entre 8 y 15 dígitos');
      return;
    }
    if (clinic.zip.trim() && digits(clinic.zip).length !== 5) {
      notify?.('El código postal debe tener 5 dígitos');
      return;
    }
    if (!/^[A-Z]{3}$/.test(clinic.currency.trim())) {
      notify?.('La moneda debe tener un código de 3 letras, por ejemplo MXN');
      return;
    }
    setSaving(true);
    try {
      const updated = await resources.updateConfig(configPayload());
      setClinic((prev) => ({ ...prev, logo_url: updated.logo_url ?? prev.logo_url }));
      notify?.(message);
    } catch (error) {
      notify?.(error.message);
    } finally {
      setSaving(false);
    }
  };

  const countries = useMemo(
    () =>
      Country.getAllCountries()
        .map((country) => {
          const name = displayCountryName(country);
          return {
            value: country.isoCode,
            label: `${country.flag || ''} ${name}`,
            meta: country.currency || '',
            searchText: `${name} ${country.name} ${country.isoCode} ${country.currency || ''}`,
            raw: { ...country, displayName: name },
            active: clinic.countryCode === country.isoCode,
          };
        })
        .sort((a, b) => a.raw.displayName.localeCompare(b.raw.displayName, 'es')),
    [clinic.countryCode]
  );

  const openCountrySelector = () => {
    setSelector({
      title: 'Seleccionar pais',
      options: countries,
      onSelect: (option) => {
        updateClinic('country', option.raw.displayName);
        setClinic((prev) => ({
          ...prev,
          country: option.raw.displayName,
          countryCode: option.raw.isoCode,
          currency: option.raw.currency || prev.currency,
        }));
        notify?.(`${option.label} seleccionado`);
      },
    });
  };

  const pickLogo = async (source) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      notify?.(source === 'camera' ? 'Activa el permiso de camara' : 'Activa el permiso de galeria');
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      updateClinic('logo_url', asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri);
      setLogoSheetOpen(false);
      notify?.('Logo actualizado');
    }
  };

  const removeLogo = () => {
    updateClinic('logo_url', '');
    setLogoSheetOpen(false);
    notify?.('Logo removido');
  };

  const renderSaveButton = (label, onPress) => (
    <GradientButton label={saving ? 'Guardando...' : label} right="" onPress={onPress} disabled={saving || loading} style={[styles.settingsSaveButton, compact && styles.settingsSaveButtonCompact]} />
  );

  const renderResponsivePair = (first, second) => (
    <View style={[styles.settingsTwoCol, compact && styles.settingsStackedFields]}>
      <View style={compact ? styles.settingsFullField : styles.settingsHalfField}>{first}</View>
      <View style={compact ? styles.settingsFullField : styles.settingsHalfField}>{second}</View>
    </View>
  );

  const renderClinic = () => (
    <View style={[styles.settingsPanel, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={[styles.settingsPanelHeader, compact && styles.settingsPanelHeaderCompact]}>
        <View style={styles.settingsHeaderText}>
          <Text selectable style={[styles.sectionTitle, { color: theme.text }]}>Datos del consultorio</Text>
          <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Informacion que aparecera en documentos y reportes.</Text>
        </View>
        {renderSaveButton('Guardar', () => saveConfig('Datos del consultorio guardados'))}
      </View>

      <View style={[styles.settingsLogoCard, { backgroundColor: theme.input, borderColor: theme.line }]}>
        <View style={styles.settingsLogoPreviewRow}>
          <View style={[styles.settingsLogoPreview, { backgroundColor: theme.card, borderColor: theme.line }]}>
            {clinic.logo_url ? (
              <Image source={{ uri: clinic.logo_url }} style={styles.settingsLogoImage} resizeMode="cover" />
            ) : (
              <Image source={defaultLogo} style={styles.settingsLogoDefaultImage} resizeMode="contain" />
            )}
          </View>
          <View style={styles.settingsHeaderText}>
            <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Logo del consultorio</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Se usara en reportes y documentos.</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setLogoSheetOpen(true)}
          style={({ pressed }) => [
            styles.settingsUploadButton,
            { backgroundColor: theme.card, borderColor: theme.line },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.headerButtonText, { color: colors.blue }]}>Subir logo</Text>
        </Pressable>
      </View>

      <View style={styles.formSection}>
        <Input label="Nombre del consultorio" value={clinic.name} onChangeText={(value) => updateClinic('name', value)} theme={theme} icon="N" placeholder="Nombre del consultorio" />
        <Input label="Responsable / dueno" value={clinic.owner} onChangeText={(value) => updateClinic('owner', value)} theme={theme} icon="D" placeholder="Responsable" />
        <Input label="Telefono" value={clinic.phone} onChangeText={(value) => updateClinic('phone', value)} theme={theme} icon="#" placeholder="442-000-0000" keyboardType="phone-pad" sanitize="phone" maxLength={22} />
        <Input label="Correo electronico" value={clinic.email} onChangeText={(value) => updateClinic('email', value)} theme={theme} icon="@" placeholder="correo@clinica.com" keyboardType="email-address" autoCapitalize="none" maxLength={160} />
      </View>

      <View style={styles.formSection}>
        <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
          <Text selectable style={styles.formSectionTitle}>Direccion</Text>
        </View>
        <Input label="Calle" value={clinic.street} onChangeText={(value) => updateClinic('street', value)} theme={theme} icon="C" placeholder="Calle" />
        {renderResponsivePair(
          <Input label="Num. exterior" value={clinic.extNumber} onChangeText={(value) => updateClinic('extNumber', value)} theme={theme} icon="#" placeholder="123" />,
          <Input label="Num. interior" value={clinic.intNumber} onChangeText={(value) => updateClinic('intNumber', value)} theme={theme} icon="#" placeholder="4B" />
        )}
        <Input label="Colonia" value={clinic.neighborhood} onChangeText={(value) => updateClinic('neighborhood', value)} theme={theme} icon="O" placeholder="Colonia" />
        <Input label="Ciudad" value={clinic.city} onChangeText={(value) => updateClinic('city', value)} theme={theme} icon="U" placeholder="Ciudad" />
        <Input label="Estado" value={clinic.state} onChangeText={(value) => updateClinic('state', value)} theme={theme} icon="E" placeholder="Estado" />
        {renderResponsivePair(
          <SelectField label="Pais" value={`${Country.getCountryByCode(clinic.countryCode)?.flag || ''} ${clinic.country}`} meta={clinic.countryCode} placeholder="Seleccionar pais" theme={theme} icon="P" onPress={openCountrySelector} />,
          <Input label="Moneda" value={clinic.currency} onChangeText={(value) => updateClinic('currency', value.toUpperCase().slice(0, 3))} theme={theme} icon="$" placeholder="MXN" maxLength={3} />
        )}
        <Input label="Codigo postal" value={clinic.zip} onChangeText={(value) => updateClinic('zip', value)} theme={theme} icon="#" placeholder="00000" keyboardType="number-pad" sanitize="digits" maxLength={10} />
      </View>

      <View style={styles.formSection}>
        <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
          <Text selectable style={styles.formSectionTitle}>Politicas internas</Text>
        </View>
        <Input label="Politicas" value={clinic.policies} onChangeText={(value) => updateClinic('policies', value)} theme={theme} icon="P" placeholder="Escribe las politicas internas del consultorio..." multiline />
      </View>
    </View>
  );

  const renderHours = () => (
    <View style={[styles.settingsPanel, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={[styles.settingsPanelHeader, compact && styles.settingsPanelHeaderCompact]}>
        <View style={styles.settingsHeaderText}>
          <Text selectable style={[styles.sectionTitle, { color: theme.text }]}>Horarios de atencion</Text>
          <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Controla rangos y duracion base de citas.</Text>
        </View>
        {renderSaveButton('Guardar', () => saveConfig('Horarios guardados'))}
      </View>
      <Input label="Hora de apertura" value={hours.open} onChangeText={(value) => updateHours('open', value)} theme={theme} icon="A" placeholder="08:00" />
      <Input label="Hora de cierre" value={hours.close} onChangeText={(value) => updateHours('close', value)} theme={theme} icon="C" placeholder="20:00" />
      <Input label="Duracion predeterminada (min)" value={hours.duration} onChangeText={(value) => updateHours('duration', value.replace(/\D/g, '').slice(0, 3))} theme={theme} icon="D" placeholder="30" keyboardType="number-pad" />
    </View>
  );

  const renderSecurity = () => (
    <View style={[styles.settingsPanel, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={[styles.settingsPanelHeader, compact && styles.settingsPanelHeaderCompact]}>
        <View style={styles.settingsHeaderText}>
          <Text selectable style={[styles.sectionTitle, { color: theme.text }]}>Seguridad y preferencias</Text>
          <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Ajusta acceso, tema y comodidad visual.</Text>
        </View>
      </View>

      <View style={[styles.settingsUserBand, { backgroundColor: theme.input }]}>
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Usuario actual</Text>
        <Text selectable numberOfLines={2} style={[styles.cardTitle, { color: theme.text }]}>{currentUser?.username || 'Usuario'} - {currentUser?.email || 'Sin correo'}</Text>
      </View>

      <SettingRow theme={theme} title="Modo oscuro" subtitle="Adapta la paleta como en la web" value={themeMode === 'dark'} onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')} />
      <SettingRow theme={theme} title="Efecto LED" subtitle="Movimiento de colores en botones y textos destacados" value={ledEnabled} onValueChange={setLedEnabled} />
      <SettingRow theme={theme} title="Notificaciones internas" subtitle="Muestra citas, pagos, seguimientos y recordatorios dentro de la app" value={notificationsEnabled} onValueChange={setNotificationsEnabled} />

      <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
        <Text selectable style={styles.formSectionTitle}>{currentUser?.role === 'admin' ? 'Cambiar mi contraseña' : 'Cambio de contraseña supervisado'}</Text>
      </View>
      {currentUser?.role === 'admin' ? (
        <>
          <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Como administrador puedes cambiar tu contraseña directamente.</Text>
          <Input label="Contraseña actual" value={passwords.current} onChangeText={(value) => updatePassword('current', value)} theme={theme} icon="*" placeholder="Actual" secureTextEntry />
          <Input label="Nueva contraseña" value={passwords.next} onChangeText={(value) => updatePassword('next', value)} theme={theme} icon="*" placeholder="Nueva" secureTextEntry />
          <Input label="Confirmar contraseña" value={passwords.confirm} onChangeText={(value) => updatePassword('confirm', value)} theme={theme} icon="*" placeholder="Confirmar" secureTextEntry />
          <GradientButton label={passwordBusy ? 'Actualizando...' : 'Cambiar contraseña'} right="" style={compact && styles.settingsSaveButtonCompact} onPress={completePasswordChange} disabled={passwordBusy} />
        </>
      ) : (
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>El administrador debe aprobar la solicitud antes de permitir el cambio.</Text>
      )}
      {currentUser?.role !== 'admin' && passwordRequest?.status === 'pendiente' ? (
        <Text selectable style={[styles.cardSub, { color: colors.amber }]}>Solicitud pendiente de revisión.</Text>
      ) : currentUser?.role !== 'admin' && passwordRequest?.status === 'aprobada' ? (
        <>
          <Text selectable style={[styles.cardSub, { color: colors.green }]}>Solicitud aprobada por 72 horas.</Text>
          <Input label="Contraseña actual" value={passwords.current} onChangeText={(value) => updatePassword('current', value)} theme={theme} icon="*" placeholder="Actual" secureTextEntry />
          <Input label="Nueva contraseña" value={passwords.next} onChangeText={(value) => updatePassword('next', value)} theme={theme} icon="*" placeholder="Nueva" secureTextEntry />
          <Input label="Confirmar contraseña" value={passwords.confirm} onChangeText={(value) => updatePassword('confirm', value)} theme={theme} icon="*" placeholder="Confirmar" secureTextEntry />
          <GradientButton label={passwordBusy ? 'Actualizando...' : 'Cambiar contraseña'} right="" style={compact && styles.settingsSaveButtonCompact} onPress={completePasswordChange} disabled={passwordBusy} />
        </>
      ) : currentUser?.role !== 'admin' ? (
        <>
          {passwordRequest?.status === 'rechazada' ? <Text selectable style={[styles.cardSub, { color: colors.red }]}>La solicitud anterior fue rechazada. Puedes enviar otra.</Text> : null}
          <Input label="Motivo (opcional)" value={requestReason} onChangeText={setRequestReason} theme={theme} icon="?" placeholder="Motivo del cambio" />
          <GradientButton label={passwordBusy ? 'Enviando...' : 'Solicitar cambio al administrador'} right="" style={compact && styles.settingsSaveButtonCompact} onPress={requestPasswordChange} disabled={passwordBusy} />
        </>
      ) : null}
    </View>
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.settingsHero, compact && styles.settingsHeroCompact]}>
        <View style={styles.settingsHeaderText}>
          <LedText selectable style={styles.heroEyebrow}>Configuracion</LedText>
          <Text selectable style={[styles.bigTitle, { color: theme.text }]}>Ajustes</Text>
          <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>Personaliza tu consultorio movil.</Text>
        </View>
        {!compact ? <AppLogo theme={theme} compact /> : null}
      </View>

      <View style={[styles.settingsTabsCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={({ pressed }) => [
                styles.settingsTab,
                { backgroundColor: active ? theme.chip : 'transparent' },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.settingsTabIcon, { color: active ? colors.blue : theme.muted }]}>{tab.icon}</Text>
              <Text selectable style={[styles.settingsTabText, { color: active ? colors.blue : theme.muted }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'clinic' ? renderClinic() : null}
      {activeTab === 'hours' ? renderHours() : null}
      {activeTab === 'security' ? renderSecurity() : null}

      <Pressable onPress={onLogout} style={[styles.logoutButton, { borderColor: `${colors.red}40`, backgroundColor: `${colors.red}12` }]}>
        <Text style={styles.logoutText}>Cerrar Sesion</Text>
      </Pressable>

      <Modal visible={logoSheetOpen} transparent animationType="slide" onRequestClose={() => setLogoSheetOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setLogoSheetOpen(false)} />
        <View style={[styles.photoActionSheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
          <View style={styles.sheetHeader}>
            <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Logo del consultorio</Text>
            <Pressable onPress={() => setLogoSheetOpen(false)} hitSlop={12}>
              <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
            </Pressable>
          </View>
          {clinic.logo_url ? <Image source={{ uri: clinic.logo_url }} style={styles.photoLargePreview} resizeMode="cover" /> : null}
          <View style={styles.photoActionGrid}>
            <Pressable onPress={() => pickLogo('camera')} style={({ pressed }) => [styles.photoActionButton, { backgroundColor: theme.input, borderColor: theme.line }, pressed && styles.pressed]}>
              <Text style={[styles.photoActionIcon, { color: colors.blue }]}>Cam</Text>
              <Text selectable style={[styles.photoActionText, { color: theme.text }]}>Camara</Text>
            </Pressable>
            <Pressable onPress={() => pickLogo('library')} style={({ pressed }) => [styles.photoActionButton, { backgroundColor: theme.input, borderColor: theme.line }, pressed && styles.pressed]}>
              <Text style={[styles.photoActionIcon, { color: colors.purple }]}>Img</Text>
              <Text selectable style={[styles.photoActionText, { color: theme.text }]}>Galeria</Text>
            </Pressable>
          </View>
          {clinic.logo_url ? (
            <Pressable onPress={removeLogo} style={({ pressed }) => [styles.photoRemoveButton, { backgroundColor: `${colors.red}14`, borderColor: `${colors.red}35` }, pressed && styles.pressed]}>
              <Text selectable style={styles.photoRemoveText}>Quitar logo</Text>
            </Pressable>
          ) : null}
        </View>
      </Modal>

      <SearchableOptionSheet theme={theme} selector={selector} onClose={() => setSelector(null)} />
    </ScrollView>
  );
}
