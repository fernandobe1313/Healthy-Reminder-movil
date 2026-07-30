import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Country } from 'country-state-city';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { AppLogo, GradientButton, Input, LedText, SettingRow } from '../components/common';
import { useVisualEffects } from '../theme/visual-effects';

const defaultLogo = require('../../assets/logoHR.png');

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
    <Modal visible={Boolean(selector)} transparent animationType="slide" onRequestClose={onClose}>
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

export function SettingsScreen({ theme, themeMode, setThemeMode, onLogout, notify }) {
  const [activeTab, setActiveTab] = useState('clinic');
  const [selector, setSelector] = useState(null);
  const [logoSheetOpen, setLogoSheetOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [sync, setSync] = useState(true);
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

  const updateClinic = (key, value) => setClinic((prev) => ({ ...prev, [key]: value }));
  const updateHours = (key, value) => setHours((prev) => ({ ...prev, [key]: value }));
  const updatePassword = (key, value) => setPasswords((prev) => ({ ...prev, [key]: value }));
  const save = (message = 'Configuracion guardada') => notify?.(message);

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
      quality: 0.9,
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.[0]?.uri) {
      updateClinic('logo_url', result.assets[0].uri);
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
    <GradientButton label={label} right="" onPress={onPress} style={[styles.settingsSaveButton, compact && styles.settingsSaveButtonCompact]} />
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
        {renderSaveButton('Guardar', () => save('Datos del consultorio guardados'))}
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
        <Input label="Telefono" value={clinic.phone} onChangeText={(value) => updateClinic('phone', value)} theme={theme} icon="#" placeholder="442-000-0000" keyboardType="phone-pad" />
        <Input label="Correo electronico" value={clinic.email} onChangeText={(value) => updateClinic('email', value)} theme={theme} icon="@" placeholder="correo@clinica.com" keyboardType="email-address" autoCapitalize="none" />
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
        <Input label="Codigo postal" value={clinic.zip} onChangeText={(value) => updateClinic('zip', value)} theme={theme} icon="#" placeholder="00000" keyboardType="number-pad" />
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
        {renderSaveButton('Guardar', () => save('Horarios guardados'))}
      </View>
      <Input label="Hora de apertura" value={hours.open} onChangeText={(value) => updateHours('open', value)} theme={theme} icon="A" placeholder="08:00" />
      <Input label="Hora de cierre" value={hours.close} onChangeText={(value) => updateHours('close', value)} theme={theme} icon="C" placeholder="20:00" />
      <Input label="Duracion predeterminada (min)" value={hours.duration} onChangeText={(value) => updateHours('duration', value.replace(/\D/g, '').slice(0, 3))} theme={theme} icon="D" placeholder="30" keyboardType="number-pad" />
      <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
        <Text selectable style={styles.formSectionTitle}>Bloque de comida</Text>
      </View>
      {renderResponsivePair(
        <Input label="Inicio" value={hours.lunchStart} onChangeText={(value) => updateHours('lunchStart', value)} theme={theme} icon="I" placeholder="14:00" />,
        <Input label="Fin" value={hours.lunchEnd} onChangeText={(value) => updateHours('lunchEnd', value)} theme={theme} icon="F" placeholder="15:00" />
      )}
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
        <Text selectable numberOfLines={2} style={[styles.cardTitle, { color: theme.text }]}>admin - admin@healthyreminder.com</Text>
      </View>

      <SettingRow theme={theme} title="Modo oscuro" subtitle="Adapta la paleta como en la web" value={themeMode === 'dark'} onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')} />
      <SettingRow theme={theme} title="Efecto LED" subtitle="Movimiento de colores en botones y textos destacados" value={ledEnabled} onValueChange={setLedEnabled} />
      <SettingRow theme={theme} title="Notificaciones" subtitle="Citas, pagos y recordatorios" value={notifications} onValueChange={setNotifications} />
      <SettingRow theme={theme} title="Sincronizacion" subtitle="Preparado para conectar API" value={sync} onValueChange={setSync} />

      <View style={[styles.formSectionTitleWrap, { borderColor: theme.line }]}>
        <Text selectable style={styles.formSectionTitle}>Cambiar contrasena</Text>
      </View>
      <Input label="Contrasena actual" value={passwords.current} onChangeText={(value) => updatePassword('current', value)} theme={theme} icon="*" placeholder="Actual" secureTextEntry />
      <Input label="Nueva contrasena" value={passwords.next} onChangeText={(value) => updatePassword('next', value)} theme={theme} icon="*" placeholder="Nueva" secureTextEntry />
      <Input label="Confirmar contrasena" value={passwords.confirm} onChangeText={(value) => updatePassword('confirm', value)} theme={theme} icon="*" placeholder="Confirmar" secureTextEntry />
      <GradientButton
        label="Cambiar contrasena"
        right=""
        style={compact && styles.settingsSaveButtonCompact}
        onPress={() => {
          if (!passwords.next || passwords.next !== passwords.confirm) {
            notify?.('Revisa la nueva contrasena');
            return;
          }
          setPasswords({ current: '', next: '', confirm: '' });
          save('Contrasena actualizada');
        }}
      />
    </View>
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
