import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const logo = require('./assets/logoHR.png');

const colors = {
  blue: '#3b82f6',
  blueDark: '#2563eb',
  purple: '#8b5cf6',
  violet: '#7c3aed',
  pink: '#ec4899',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
};

const themes = {
  light: {
    name: 'light',
    bg: '#f4f7fc',
    surface: '#ffffff',
    surfaceAlt: '#edf3ff',
    card: '#ffffff',
    input: '#f8fafc',
    text: '#0f172a',
    muted: '#64748b',
    soft: '#94a3b8',
    line: '#dbe4f0',
    nav: '#ffffff',
    chip: '#eff6ff',
    logoText: '#0f172a',
    inverse: '#ffffff',
    shadow: 'rgba(15, 23, 42, 0.12)',
    glow: 'rgba(59, 130, 246, 0.12)',
    veil: 'rgba(255,255,255,0.7)',
  },
  dark: {
    name: 'dark',
    bg: '#080c18',
    surface: '#0d1220',
    surfaceAlt: '#111827',
    card: '#111827',
    input: '#151d30',
    text: '#e8ecf4',
    muted: '#8892a8',
    soft: '#5a6478',
    line: '#1e293b',
    nav: '#0b1020',
    chip: 'rgba(96,165,250,0.12)',
    logoText: '#ffffff',
    inverse: '#07101f',
    shadow: 'rgba(0, 0, 0, 0.35)',
    glow: 'rgba(139, 92, 246, 0.16)',
    veil: 'rgba(13,18,32,0.76)',
  },
};

const baseStats = [
  { label: 'Pacientes', value: '128', tone: colors.blue, icon: 'P' },
  { label: 'Citas hoy', value: '6', tone: colors.purple, icon: 'C' },
  { label: 'Ingresos', value: '$18.4k', tone: colors.green, icon: '$' },
  { label: 'Pendiente', value: '$2.6k', tone: colors.red, icon: '!' },
];

const patientsSeed = [
  { id: 1, name: 'Alan Ramirez', phone: '55 1234 9012', next: '10:30', balance: 0, tag: 'Ortodoncia' },
  { id: 2, name: 'Sofia Aguilar', phone: '55 8821 4400', next: '12:00', balance: 900, tag: 'Limpieza' },
  { id: 3, name: 'Oscar Medina', phone: '55 7120 3341', next: '16:20', balance: 1700, tag: 'Endodoncia' },
  { id: 4, name: 'Valeria Cano', phone: '55 2198 7720', next: 'Vie 10', balance: 0, tag: 'Revision' },
];

const appointmentsSeed = [
  { id: 1, time: '09:00', patient: 'Alan Ramirez', service: 'Revision general', status: 'Confirmada', color: colors.blue },
  { id: 2, time: '10:30', patient: 'Sofia Aguilar', service: 'Limpieza dental', status: 'En sala', color: colors.green },
  { id: 3, time: '12:00', patient: 'Oscar Medina', service: 'Endodoncia', status: 'Pendiente', color: colors.amber },
  { id: 4, time: '16:20', patient: 'Valeria Cano', service: 'Ortodoncia', status: 'Confirmada', color: colors.purple },
];

const remindersSeed = [
  { id: 1, title: 'Confirmar cita de Sofia', time: 'Hoy 18:00', type: 'Agenda' },
  { id: 2, title: 'Enviar recordatorio de pago', time: 'Manana 09:00', type: 'Finanzas' },
  { id: 3, title: 'Revisar inventario de resina', time: 'Vie 12:00', type: 'Clinico' },
];

const weeklyIncome = [45, 62, 38, 75, 54, 88, 69];
const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const teeth = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28', '48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
const conditions = [
  { id: 'sano', label: 'Sano', color: colors.green },
  { id: 'caries', label: 'Caries', color: colors.red },
  { id: 'restauracion', label: 'Restauracion', color: colors.blue },
  { id: 'corona', label: 'Corona', color: colors.purple },
  { id: 'endo', label: 'Endodoncia', color: colors.amber },
];

function AppLogo({ theme, compact = false }) {
  return (
    <View style={[styles.logoRow, compact && { gap: 8 }]}>
      <Image source={logo} style={[styles.logoImage, compact && { width: 44, height: 44 }]} resizeMode="contain" />
      <View>
        <View style={styles.brandLine}>
          <Text selectable style={[styles.brandHealthy, { color: theme.logoText }, compact && { fontSize: 21 }]}>Healthy</Text>
          <Text selectable style={[styles.brandReminder, compact && { fontSize: 21 }]}>Reminder</Text>
        </View>
        <Text selectable style={[styles.brandSub, { color: theme.soft }, compact && { fontSize: 9 }]}>SISTEMA DENTAL</Text>
      </View>
    </View>
  );
}

function SoftOrb({ style, color }) {
  return <View pointerEvents="none" style={[styles.orb, { backgroundColor: color }, style]} />;
}

function IconBadge({ icon, color, size = 44 }) {
  return (
    <View style={[styles.iconBadge, { width: size, height: size, backgroundColor: `${color}18` }]}>
      <Text style={[styles.iconText, { color }]}>{icon}</Text>
    </View>
  );
}

function GradientButton({ label, onPress, right = '->', disabled = false, style }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [
      styles.gradientButton,
      style,
      pressed && { transform: [{ scale: 0.98 }] },
      disabled && { opacity: 0.55 },
    ]}>
      <View style={styles.gradientRight} />
      <View style={styles.gradientGlow} />
      <Text style={styles.gradientLabel}>{label}</Text>
      <Text style={styles.gradientArrow}>{right}</Text>
    </Pressable>
  );
}

function HeaderButton({ label, onPress, theme, active }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButton,
        { backgroundColor: active ? theme.chip : theme.input, borderColor: theme.line },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.headerButtonText, { color: active ? colors.blue : theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

function AuthScreen({ theme, setThemeMode, onEnter }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('admin@clinica.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <View style={[styles.authRoot, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <SoftOrb color={theme.name === 'dark' ? '#233b76' : '#dbeafe'} style={{ top: -80, left: -90, width: 230, height: 230 }} />
      <SoftOrb color={theme.name === 'dark' ? '#30215f' : '#ede9fe'} style={{ top: 130, right: -80, width: 180, height: 180 }} />
      <SoftOrb color={theme.name === 'dark' ? '#172554' : '#eff6ff'} style={{ bottom: -70, right: 20, width: 220, height: 220 }} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.authScroll}>
        <View style={styles.authTopBar}>
          <HeaderButton
            label={theme.name === 'dark' ? 'Claro' : 'Oscuro'}
            theme={theme}
            onPress={() => setThemeMode(theme.name === 'dark' ? 'light' : 'dark')}
          />
        </View>

        <Animated.View style={[styles.authLogoCard, { backgroundColor: theme.surface, transform: [{ scale }] }]}>
          <Image source={logo} style={styles.authLogo} resizeMode="contain" />
        </Animated.View>

        <View style={styles.authTitleWrap}>
          <View style={styles.centerBrand}>
            <Text selectable style={[styles.authBrandHealthy, { color: theme.text }]}>Healthy</Text>
            <Text selectable style={styles.authBrandReminder}>Reminder</Text>
          </View>
          <Text selectable style={[styles.authSubtitle, { color: theme.muted }]}>Sistema Odontologico</Text>
        </View>

        <View style={[styles.segment, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          {['login', 'register'].map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={[styles.segmentItem, mode === item && { backgroundColor: theme.chip }]}>
              <Text style={[styles.segmentText, { color: mode === item ? colors.blueDark : theme.muted }]}>
                {item === 'login' ? 'Iniciar Sesion' : 'Registrarse'}
              </Text>
              {mode === item ? <View style={styles.segmentLine} /> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.formBlock}>
          <Text selectable style={[styles.screenTitle, { color: theme.text }]}>
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu acceso'}
          </Text>
          <Text selectable style={[styles.screenSubtitle, { color: theme.muted }]}>
            {mode === 'login' ? 'Inicia sesion para continuar' : 'Configura tu consultorio dental'}
          </Text>

          {mode === 'register' ? (
            <Input label="Nombre del consultorio" value="Clinica HealthyReminder" onChangeText={() => {}} theme={theme} icon="H" />
          ) : null}
          <Input label="Usuario o correo" value={email} onChangeText={setEmail} theme={theme} icon="@" />
          <Input
            label="Contrasena"
            value={password}
            onChangeText={setPassword}
            theme={theme}
            icon="#"
            secureTextEntry={!showPassword}
            rightLabel={showPassword ? 'Ocultar' : 'Ver'}
            onRightPress={() => setShowPassword((prev) => !prev)}
          />

          <Pressable>
            <Text style={styles.forgotText}>Olvidaste tu contrasena?</Text>
          </Pressable>

          <GradientButton label={mode === 'login' ? 'Ingresar' : 'Crear cuenta'} onPress={onEnter} />
        </View>

        <View style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <IconBadge icon="!" color={colors.blue} size={54} />
          <View style={{ flex: 1 }}>
            <Text selectable style={[styles.tipTitle, { color: theme.text }]}>Consejo</Text>
            <Text selectable style={[styles.tipCopy, { color: theme.muted }]}>
              Activa las notificaciones para recibir alertas de tus citas y recordatorios importantes.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Input({ label, theme, icon, rightLabel, onRightPress, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputShell, { backgroundColor: theme.input, borderColor: theme.line }]}>
        <Text style={[styles.inputIcon, { color: theme.muted }]}>{icon}</Text>
        <TextInput
          placeholderTextColor={theme.soft}
          style={[styles.input, { color: theme.text }]}
          autoCapitalize="none"
          {...props}
        />
        {rightLabel ? (
          <Pressable onPress={onRightPress} hitSlop={10}>
            <Text style={[styles.inputAction, { color: colors.blue }]}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MainApp({ theme, themeMode, setThemeMode, onLogout }) {
  const [screen, setScreen] = useState('dashboard');
  const [selectedDay, setSelectedDay] = useState('Lun');
  const [patients, setPatients] = useState(patientsSeed);
  const [appointments, setAppointments] = useState(appointmentsSeed);
  const [reminders, setReminders] = useState(remindersSeed);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTooth, setSelectedTooth] = useState('11');
  const [toothMap, setToothMap] = useState({ 11: 'sano', 12: 'restauracion', 26: 'caries', 36: 'endo' });
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const activeTitle = {
    dashboard: 'Dashboard',
    patients: 'Pacientes',
    agenda: 'Agenda',
    clinical: 'Clinico',
    payments: 'Pagos',
    reminders: 'Recordatorios',
    assistant: 'Asistente IA',
    settings: 'Ajustes',
    more: 'Mas',
  }[screen];

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const addPatient = () => {
    setPatients((prev) => [
      { id: Date.now(), name: 'Nuevo Paciente', phone: '55 0000 0000', next: 'Sin cita', balance: 0, tag: 'Nuevo' },
      ...prev,
    ]);
    setSheet(null);
    notify('Paciente agregado');
  };

  const addAppointment = () => {
    setAppointments((prev) => [
      { id: Date.now(), time: '17:30', patient: 'Nuevo Paciente', service: 'Revision', status: 'Nueva', color: colors.blue },
      ...prev,
    ]);
    setSheet(null);
    notify('Cita programada');
  };

  const addReminder = () => {
    setReminders((prev) => [
      { id: Date.now(), title: 'Nuevo seguimiento clinico', time: 'Hoy 19:00', type: 'Clinico' },
      ...prev,
    ]);
    setSheet(null);
    notify('Recordatorio creado');
  };

  const screenNode = {
    dashboard: (
      <DashboardScreen
        theme={theme}
        setScreen={setScreen}
        appointments={appointments}
        setSheet={setSheet}
        compact={compact}
      />
    ),
    patients: (
      <PatientsScreen
        theme={theme}
        patients={filteredPatients}
        search={search}
        setSearch={setSearch}
        setSheet={setSheet}
      />
    ),
    agenda: (
      <AgendaScreen
        theme={theme}
        appointments={appointments}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        setSheet={setSheet}
      />
    ),
    clinical: (
      <ClinicalScreen
        theme={theme}
        selectedTooth={selectedTooth}
        setSelectedTooth={setSelectedTooth}
        toothMap={toothMap}
        setToothMap={setToothMap}
        notify={notify}
      />
    ),
    payments: <PaymentsScreen theme={theme} patients={patients} setSheet={setSheet} />,
    reminders: <RemindersScreen theme={theme} reminders={reminders} setSheet={setSheet} />,
    assistant: <AssistantScreen theme={theme} />,
    settings: (
      <SettingsScreen
        theme={theme}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onLogout={onLogout}
      />
    ),
    more: <MoreScreen theme={theme} setScreen={setScreen} setSheet={setSheet} />,
  }[screen];

  return (
    <View style={[styles.appRoot, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <SoftOrb color={theme.name === 'dark' ? '#172554' : '#dbeafe'} style={{ top: -90, right: -80, width: 190, height: 190 }} />
      <View style={[styles.appHeader, { backgroundColor: theme.veil, borderColor: theme.line }]}>
        <View style={styles.headerLeft}>
          {['payments', 'reminders', 'assistant', 'settings', 'more'].includes(screen) ? (
            <Pressable onPress={() => setScreen('dashboard')} style={[styles.backButton, { borderColor: theme.line, backgroundColor: theme.input }]}>
              <Text style={[styles.backText, { color: theme.text }]}>{'<'}</Text>
            </Pressable>
          ) : null}
          <View>
            <Text selectable style={[styles.headerTitle, { color: theme.text }]}>{activeTitle}</Text>
            <Text selectable style={[styles.headerMeta, { color: theme.muted }]}>lun 6 de jul</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => notify('3 notificaciones pendientes')}
            style={[styles.roundButton, { backgroundColor: theme.input, borderColor: theme.line }]}>
            <Text style={[styles.roundButtonText, { color: theme.text }]}>!</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </Pressable>
          <Pressable
            onPress={() => setThemeMode(theme.name === 'dark' ? 'light' : 'dark')}
            style={[styles.roundButton, { backgroundColor: theme.input, borderColor: theme.line }]}>
            <Text style={[styles.roundButtonText, { color: theme.text }]}>{theme.name === 'dark' ? 'S' : 'M'}</Text>
          </Pressable>
        </View>
      </View>

      {screenNode}

      <BottomNav theme={theme} active={screen} setScreen={setScreen} />
      <ActionSheet
        theme={theme}
        sheet={sheet}
        onClose={() => setSheet(null)}
        onAddPatient={addPatient}
        onAddAppointment={addAppointment}
        onAddReminder={addReminder}
        notify={notify}
      />
      {toast ? (
        <View style={[styles.toast, { backgroundColor: theme.name === 'dark' ? '#e8ecf4' : '#0f172a' }]}>
          <Text style={[styles.toastText, { color: theme.name === 'dark' ? '#0f172a' : '#ffffff' }]}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

function DashboardScreen({ theme, setScreen, appointments, setSheet, compact }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.welcomeRow}>
        <View style={{ flex: 1 }}>
          <Text selectable style={styles.hello}>Buenos dias</Text>
          <Text selectable style={[styles.bigTitle, { color: theme.text }]}>Doctor</Text>
          <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>
            Hoy tienes <Text style={{ color: colors.blue, fontWeight: '800' }}>6 citas</Text> y <Text style={{ color: colors.red, fontWeight: '800' }}>$2,600.00</Text> pendientes
          </Text>
        </View>
        <AppLogo theme={theme} compact />
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={{ flex: 1 }}>
          <Text selectable style={[styles.heroEyebrow, { color: colors.purple }]}>Resumen inteligente</Text>
          <Text selectable style={[styles.heroText, { color: theme.text }]}>Tu consultorio esta estable y con buena agenda.</Text>
          <Text selectable style={[styles.heroSmall, { color: theme.muted }]}>Revisa cobros pendientes antes de cerrar el dia.</Text>
        </View>
        <GradientButton label="Ver pagos" right="$" onPress={() => setScreen('payments')} style={styles.heroButton} />
      </View>

      <View style={styles.statsGrid}>
        {baseStats.map((stat) => (
          <Pressable
            key={stat.label}
            onPress={() => stat.label === 'Pendiente' ? setScreen('payments') : setSheet({ type: 'stat', data: stat })}
            style={({ pressed }) => [
              styles.statCard,
              { backgroundColor: theme.card, borderColor: theme.line, width: compact ? '100%' : '48%' },
              pressed && styles.pressed,
            ]}>
            <IconBadge icon={stat.icon} color={stat.tone} />
            <Text selectable style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
            <Text selectable style={[styles.statLabel, { color: theme.muted }]}>{stat.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Ingresos semanales" action="Reporte" theme={theme} onPress={() => setScreen('payments')} />
      <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.barChart}>
          {weeklyIncome.map((item, index) => (
            <View key={days[index]} style={styles.barWrap}>
              <View style={[styles.barTrack, { backgroundColor: theme.input }]}>
                <View style={[styles.barFill, { height: `${item}%`, backgroundColor: index === 5 ? colors.green : colors.blue }]} />
              </View>
              <Text style={[styles.barLabel, { color: theme.muted }]}>{days[index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionHeader title="Agenda de hoy" action="Nueva" theme={theme} onPress={() => setSheet({ type: 'appointment' })} />
      <View style={{ gap: 12 }}>
        {appointments.slice(0, 3).map((item) => <AppointmentCard key={item.id} item={item} theme={theme} />)}
      </View>
    </ScrollView>
  );
}

function PatientsScreen({ theme, patients, search, setSearch, setSheet }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.screenActions}>
        <View style={[styles.searchBox, { backgroundColor: theme.input, borderColor: theme.line }]}>
          <Text style={[styles.searchIcon, { color: theme.soft }]}>?</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar paciente..."
            placeholderTextColor={theme.soft}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
        <Pressable onPress={() => setSheet({ type: 'patient' })} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        {patients.map((patient) => (
          <Pressable
            key={patient.id}
            onPress={() => setSheet({ type: 'patientDetail', data: patient })}
            style={({ pressed }) => [
              styles.patientCard,
              { backgroundColor: theme.card, borderColor: theme.line },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.avatar, { backgroundColor: theme.chip }]}>
              <Text style={styles.avatarText}>{patient.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{patient.name}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{patient.phone}</Text>
              <View style={styles.inlineChips}>
                <Text style={[styles.smallChip, { color: colors.blue, backgroundColor: `${colors.blue}14` }]}>{patient.tag}</Text>
                <Text style={[styles.smallChip, { color: patient.balance ? colors.red : colors.green, backgroundColor: patient.balance ? `${colors.red}14` : `${colors.green}14` }]}>
                  {patient.balance ? `$${patient.balance}` : 'Al dia'}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text selectable style={[styles.cardTime, { color: theme.text }]}>{patient.next}</Text>
              <Text style={[styles.chevron, { color: theme.soft }]}>{'>'}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function AgendaScreen({ theme, appointments, selectedDay, setSelectedDay, setSheet }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {days.map((day, index) => (
          <Pressable
            key={day}
            onPress={() => setSelectedDay(day)}
            style={[styles.dayPill, { backgroundColor: selectedDay === day ? colors.blue : theme.card, borderColor: theme.line }]}>
            <Text style={[styles.dayName, { color: selectedDay === day ? '#ffffff' : theme.muted }]}>{day}</Text>
            <Text style={[styles.dayNum, { color: selectedDay === day ? '#ffffff' : theme.text }]}>{6 + index}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.scheduleHero, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <IconBadge icon="C" color={colors.purple} />
        <View style={{ flex: 1 }}>
          <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Agenda organizada</Text>
          <Text selectable style={[styles.cardSub, { color: theme.muted }]}>4 citas visibles para {selectedDay}. Arrastra esta logica al backend cuando este listo.</Text>
        </View>
        <Pressable onPress={() => setSheet({ type: 'appointment' })} style={styles.miniAdd}>
          <Text style={styles.miniAddText}>+</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        {appointments.map((item) => <AppointmentCard key={item.id} item={item} theme={theme} detailed />)}
      </View>
    </ScrollView>
  );
}

function ClinicalScreen({ theme, selectedTooth, setSelectedTooth, toothMap, setToothMap, notify }) {
  const selectedCondition = conditions.find((c) => c.id === toothMap[selectedTooth]) || conditions[0];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.clinicalHero, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View>
          <Text selectable style={[styles.heroEyebrow, { color: colors.blue }]}>Odontograma movil</Text>
          <Text selectable style={[styles.heroText, { color: theme.text }]}>Pieza #{selectedTooth}</Text>
          <Text selectable style={[styles.heroSmall, { color: theme.muted }]}>Estado actual: {selectedCondition.label}</Text>
        </View>
        <IconBadge icon="T" color={selectedCondition.color} size={58} />
      </View>

      <View style={[styles.teethBoard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {teeth.map((tooth) => {
          const cond = conditions.find((c) => c.id === toothMap[tooth]);
          const selected = tooth === selectedTooth;
          return (
            <Pressable
              key={tooth}
              onPress={() => setSelectedTooth(tooth)}
              style={[
                styles.toothButton,
                {
                  backgroundColor: selected ? colors.blue : theme.input,
                  borderColor: cond ? cond.color : theme.line,
                },
              ]}>
              <Text style={[styles.toothText, { color: selected ? '#ffffff' : cond ? cond.color : theme.muted }]}>{tooth}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Condicion" theme={theme} />
      <View style={styles.conditionGrid}>
        {conditions.map((condition) => (
          <Pressable
            key={condition.id}
            onPress={() => setToothMap((prev) => ({ ...prev, [selectedTooth]: condition.id }))}
            style={[
              styles.conditionChip,
              {
                backgroundColor: toothMap[selectedTooth] === condition.id ? condition.color : theme.card,
                borderColor: condition.color,
              },
            ]}>
            <Text style={[styles.conditionText, { color: toothMap[selectedTooth] === condition.id ? '#ffffff' : condition.color }]}>
              {condition.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Nota clinica</Text>
        <TextInput
          multiline
          placeholder="Escribe observaciones, diagnostico o tratamiento..."
          placeholderTextColor={theme.soft}
          style={[styles.noteInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line }]}
        />
        <GradientButton label="Guardar registro" right="OK" onPress={() => notify(`Pieza ${selectedTooth} actualizada`)} />
      </View>
    </ScrollView>
  );
}

function PaymentsScreen({ theme, patients, setSheet }) {
  const debtors = patients.filter((patient) => patient.balance > 0);
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.payHero, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View>
          <Text selectable style={[styles.heroEyebrow, { color: colors.red }]}>Pagos pendientes</Text>
          <Text selectable style={[styles.bigTitle, { color: theme.text }]}>$2,600.00</Text>
          <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>2 pacientes con saldo abierto</Text>
        </View>
        <GradientButton label="Registrar" right="$" onPress={() => setSheet({ type: 'payment' })} style={styles.heroButton} />
      </View>

      <View style={{ gap: 12 }}>
        {debtors.map((patient) => (
          <View key={patient.id} style={[styles.paymentCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <View style={styles.paymentTop}>
              <View>
                <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{patient.name}</Text>
                <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{patient.tag}</Text>
              </View>
              <Text selectable style={[styles.paymentAmount, { color: colors.red }]}>${patient.balance}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.input }]}>
              <View style={[styles.progressFill, { width: patient.balance > 1000 ? '48%' : '70%', backgroundColor: colors.blue }]} />
            </View>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Progreso de pago del tratamiento</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function RemindersScreen({ theme, reminders, setSheet }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <SectionHeader title="Proximos avisos" action="Crear" theme={theme} onPress={() => setSheet({ type: 'reminder' })} />
      <View style={{ gap: 12 }}>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={[styles.reminderCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <IconBadge icon="!" color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{reminder.title}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{reminder.time}</Text>
            </View>
            <Text style={[styles.smallChip, { color: colors.purple, backgroundColor: `${colors.purple}14` }]}>{reminder.type}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function AssistantScreen({ theme }) {
  const [messages, setMessages] = useState([
    { id: 1, from: 'ai', text: 'Puedo ayudarte a redactar notas clinicas, recordatorios o resumenes de citas.' },
    { id: 2, from: 'user', text: 'Prepara una nota para limpieza dental.' },
  ]);
  const [draft, setDraft] = useState('');

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'user', text: draft.trim() },
      { id: Date.now() + 1, from: 'ai', text: 'Listo. Sugerencia: incluye motivo de consulta, hallazgos, procedimiento y proxima revision.' },
    ]);
    setDraft('');
  };

  return (
    <View style={[styles.chatRoot, { backgroundColor: theme.bg }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatContent}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              {
                alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.from === 'user' ? colors.blue : theme.card,
                borderColor: theme.line,
              },
            ]}>
            <Text selectable style={[styles.messageText, { color: message.from === 'user' ? '#ffffff' : theme.text }]}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.composer, { backgroundColor: theme.veil, borderColor: theme.line }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Pregunta algo..."
          placeholderTextColor={theme.soft}
          style={[styles.composerInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line }]}
        />
        <Pressable onPress={send} style={styles.sendButton}>
          <Text style={styles.sendText}>{'>'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SettingsScreen({ theme, themeMode, setThemeMode, onLogout }) {
  const [notifications, setNotifications] = useState(true);
  const [sync, setSync] = useState(true);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <AppLogo theme={theme} />
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>admin@healthyreminder.com</Text>
      </View>

      <SettingRow theme={theme} title="Modo oscuro" subtitle="Adapta la paleta como en la web" value={themeMode === 'dark'} onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')} />
      <SettingRow theme={theme} title="Notificaciones" subtitle="Citas, pagos y recordatorios" value={notifications} onValueChange={setNotifications} />
      <SettingRow theme={theme} title="Sincronizacion" subtitle="Preparado para conectar API" value={sync} onValueChange={setSync} />

      <Pressable onPress={onLogout} style={[styles.logoutButton, { borderColor: `${colors.red}40`, backgroundColor: `${colors.red}12` }]}>
        <Text style={styles.logoutText}>Cerrar Sesion</Text>
      </Pressable>
    </ScrollView>
  );
}

function MoreScreen({ theme, setScreen, setSheet }) {
  const items = [
    { title: 'Pagos', subtitle: 'Cobros y saldos', screen: 'payments', icon: '$', color: colors.green },
    { title: 'Recordatorios', subtitle: 'Alertas inteligentes', screen: 'reminders', icon: '!', color: colors.amber },
    { title: 'Asistente IA', subtitle: 'Notas clinicas rapidas', screen: 'assistant', icon: 'AI', color: colors.pink },
    { title: 'Ajustes', subtitle: 'Tema y consultorio', screen: 'settings', icon: 'A', color: colors.purple },
  ];
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <IconBadge icon="+" color={colors.blue} size={54} />
        <View style={{ flex: 1 }}>
          <Text selectable style={[styles.tipTitle, { color: theme.text }]}>Acciones rapidas</Text>
          <Text selectable style={[styles.tipCopy, { color: theme.muted }]}>Crea pacientes, citas o recordatorios desde una hoja inferior.</Text>
        </View>
      </View>
      <View style={styles.quickGrid}>
        <GradientButton label="Paciente" right="+" onPress={() => setSheet({ type: 'patient' })} style={styles.quickButton} />
        <GradientButton label="Cita" right="+" onPress={() => setSheet({ type: 'appointment' })} style={styles.quickButton} />
      </View>
      <View style={{ gap: 12 }}>
        {items.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => setScreen(item.screen)}
            style={({ pressed }) => [styles.moreCard, { backgroundColor: theme.card, borderColor: theme.line }, pressed && styles.pressed]}>
            <IconBadge icon={item.icon} color={item.color} />
            <View style={{ flex: 1 }}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{item.subtitle}</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.soft }]}>{'>'}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function SettingRow({ theme, title, subtitle, value, onValueChange }) {
  return (
    <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={{ flex: 1 }}>
        <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: theme.line, true: `${colors.blue}80` }} thumbColor={value ? colors.blue : '#f8fafc'} />
    </View>
  );
}

function AppointmentCard({ item, theme, detailed = false }) {
  return (
    <View style={[styles.appointmentCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={[styles.timeBlock, { backgroundColor: `${item.color}16` }]}>
        <Text selectable style={[styles.timeText, { color: item.color }]}>{item.time}</Text>
      </View>
      <View style={[styles.timeline, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{item.patient}</Text>
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{item.service}</Text>
        {detailed ? <Text selectable style={[styles.cardSub, { color: theme.soft }]}>Consultorio 1 - Dra. Sanchez</Text> : null}
      </View>
      <Text style={[styles.smallChip, { color: item.color, backgroundColor: `${item.color}14` }]}>{item.status}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onPress, theme }) {
  return (
    <View style={styles.sectionHeader}>
      <Text selectable style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BottomNav({ theme, active, setScreen }) {
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: 'D' },
    { id: 'patients', label: 'Pacientes', icon: 'P' },
    { id: 'agenda', label: 'Agenda', icon: 'C' },
    { id: 'clinical', label: 'Clinico', icon: 'T' },
    { id: 'more', label: 'Mas', icon: '+' },
  ];
  const normalizedActive = ['payments', 'reminders', 'assistant', 'settings'].includes(active) ? 'more' : active;

  return (
    <View style={[styles.bottomNav, { backgroundColor: theme.nav, borderColor: theme.line }]}>
      {items.map((item) => {
        const isActive = normalizedActive === item.id;
        return (
          <Pressable key={item.id} onPress={() => setScreen(item.id)} style={styles.navItem}>
            <View style={[styles.navIcon, { backgroundColor: isActive ? colors.blue : 'transparent' }]}>
              <Text style={[styles.navIconText, { color: isActive ? '#ffffff' : theme.soft }]}>{item.icon}</Text>
            </View>
            <Text style={[styles.navLabel, { color: isActive ? colors.blue : theme.soft }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionSheet({ theme, sheet, onClose, onAddPatient, onAddAppointment, onAddReminder, notify }) {
  const title = {
    patient: 'Nuevo paciente',
    appointment: 'Nueva cita',
    payment: 'Registrar pago',
    reminder: 'Nuevo recordatorio',
    patientDetail: sheet?.data?.name,
    stat: sheet?.data?.label,
  }[sheet?.type] || '';

  const submit = () => {
    if (sheet?.type === 'patient') onAddPatient();
    else if (sheet?.type === 'appointment') onAddAppointment();
    else if (sheet?.type === 'reminder') onAddReminder();
    else {
      onClose();
      notify(sheet?.type === 'payment' ? 'Pago registrado' : 'Listo');
    }
  };

  return (
    <Modal visible={Boolean(sheet)} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
        <View style={styles.sheetHeader}>
          <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
          </Pressable>
        </View>

        {sheet?.type === 'patientDetail' ? (
          <View style={{ gap: 14 }}>
            <View style={[styles.detailBand, { backgroundColor: theme.input }]}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{sheet.data.phone}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Proxima cita: {sheet.data.next}</Text>
            </View>
            <GradientButton label="Abrir expediente" onPress={submit} right=">" />
          </View>
        ) : sheet?.type === 'stat' ? (
          <View style={{ gap: 14 }}>
            <IconBadge icon={sheet.data.icon} color={sheet.data.tone} size={62} />
            <Text selectable style={[styles.bigTitle, { color: theme.text }]}>{sheet.data.value}</Text>
            <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>Este indicador viene del resumen movil y puede conectarse a /dashboard.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Input label="Nombre" value={sheet?.type === 'payment' ? 'Sofia Aguilar' : ''} onChangeText={() => {}} theme={theme} icon="A" />
            <Input label={sheet?.type === 'payment' ? 'Monto' : 'Detalle'} value={sheet?.type === 'payment' ? '$900' : ''} onChangeText={() => {}} theme={theme} icon={sheet?.type === 'payment' ? '$' : '#'} />
            <GradientButton label={sheet?.type === 'payment' ? 'Confirmar pago' : 'Guardar'} onPress={submit} right="OK" />
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState('light');
  const [loggedIn, setLoggedIn] = useState(false);
  const theme = useMemo(() => themes[themeMode], [themeMode]);

  if (!loggedIn) {
    return <AuthScreen theme={theme} setThemeMode={setThemeMode} onEnter={() => setLoggedIn(true)} />;
  }

  return (
    <MainApp
      theme={theme}
      themeMode={themeMode}
      setThemeMode={setThemeMode}
      onLogout={() => setLoggedIn(false)}
    />
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    overflow: 'hidden',
  },
  authRoot: {
    flex: 1,
    overflow: 'hidden',
  },
  authScroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 34,
  },
  authTopBar: {
    alignItems: 'flex-end',
    minHeight: 40,
  },
  authLogoCard: {
    width: 104,
    height: 104,
    borderRadius: 30,
    borderCurve: 'continuous',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    boxShadow: '0 16px 50px rgba(37,99,235,0.18)',
  },
  authLogo: {
    width: 72,
    height: 72,
  },
  authTitleWrap: {
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 26,
  },
  centerBrand: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  authBrandHealthy: {
    fontSize: 33,
    fontWeight: '900',
    letterSpacing: 0,
  },
  authBrandReminder: {
    fontSize: 33,
    fontWeight: '900',
    letterSpacing: 0,
    color: colors.purple,
  },
  authSubtitle: {
    fontSize: 16,
    marginTop: 6,
    fontWeight: '500',
  },
  segment: {
    height: 60,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
    marginBottom: 30,
    borderCurve: 'continuous',
  },
  segmentItem: {
    flex: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '800',
  },
  segmentLine: {
    position: 'absolute',
    bottom: 0,
    width: '72%',
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.blue,
  },
  formBlock: {
    gap: 18,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  screenSubtitle: {
    fontSize: 16,
    marginTop: -12,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  inputShell: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  inputIcon: {
    fontSize: 18,
    fontWeight: '800',
    width: 22,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 50,
  },
  inputAction: {
    fontSize: 12,
    fontWeight: '900',
  },
  forgotText: {
    color: colors.blue,
    fontWeight: '800',
    fontSize: 14,
  },
  gradientButton: {
    minHeight: 60,
    borderRadius: 17,
    borderCurve: 'continuous',
    backgroundColor: colors.blue,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    boxShadow: '0 14px 32px rgba(59,130,246,0.30)',
  },
  gradientRight: {
    position: 'absolute',
    right: -20,
    top: 0,
    bottom: 0,
    width: '58%',
    backgroundColor: colors.purple,
    opacity: 0.92,
    transform: [{ skewX: '-12deg' }],
  },
  gradientGlow: {
    position: 'absolute',
    left: 40,
    top: -30,
    width: 110,
    height: 110,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  gradientLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    zIndex: 1,
  },
  gradientArrow: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    zIndex: 1,
  },
  tipCard: {
    marginTop: 30,
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 5,
  },
  tipCopy: {
    fontSize: 14,
    lineHeight: 21,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  brandLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandHealthy: {
    fontSize: 24,
    fontWeight: '900',
  },
  brandReminder: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.purple,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.58,
  },
  iconBadge: {
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontWeight: '900',
    fontSize: 16,
  },
  headerButton: {
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  appHeader: {
    paddingTop: 44,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  headerMeta: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  content: {
    padding: 18,
    paddingBottom: 112,
    gap: 18,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hello: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  bigTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  mutedCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  heroText: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  heroSmall: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  heroButton: {
    minHeight: 48,
    minWidth: 102,
    borderRadius: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
  },
  barChart: {
    height: 170,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    width: '100%',
    maxWidth: 26,
    height: 132,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 999,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  appointmentCard: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeBlock: {
    width: 58,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '900',
  },
  timeline: {
    width: 3,
    height: 42,
    borderRadius: 999,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 19,
  },
  smallChip: {
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  screenActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    borderCurve: 'continuous',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
    fontWeight: '900',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 48,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  patientCard: {
    borderWidth: 1,
    borderRadius: 21,
    borderCurve: 'continuous',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: '900',
  },
  inlineChips: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  cardTime: {
    fontSize: 14,
    fontWeight: '900',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '900',
  },
  dayRow: {
    gap: 10,
    paddingRight: 6,
  },
  dayPill: {
    width: 64,
    height: 82,
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '900',
  },
  dayNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  scheduleHero: {
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  miniAdd: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAddText: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '800',
  },
  clinicalHero: {
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teethBoard: {
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  toothButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toothText: {
    fontSize: 12,
    fontWeight: '900',
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12,
  },
  noteInput: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  payHero: {
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  paymentCard: {
    borderWidth: 1,
    borderRadius: 21,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12,
  },
  paymentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentAmount: {
    fontSize: 21,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  reminderCard: {
    borderWidth: 1,
    borderRadius: 21,
    borderCurve: 'continuous',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatRoot: {
    flex: 1,
  },
  chatContent: {
    padding: 18,
    paddingBottom: 106,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 74,
    borderTopWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
    gap: 12,
  },
  settingRow: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: '900',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    minHeight: 54,
  },
  moreCard: {
    borderWidth: 1,
    borderRadius: 21,
    borderCurve: 'continuous',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 68,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    boxShadow: '0 12px 30px rgba(15,23,42,0.16)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: {
    fontSize: 12,
    fontWeight: '900',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 34,
    gap: 18,
  },
  sheetGrabber: {
    width: 44,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '900',
  },
  detailBand: {
    borderRadius: 18,
    borderCurve: 'continuous',
    padding: 16,
    gap: 4,
  },
  toast: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    boxShadow: '0 10px 22px rgba(0,0,0,0.18)',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
