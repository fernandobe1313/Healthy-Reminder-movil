import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { GradientButton, HeaderButton, IconBadge, Input, LedText, SoftOrb } from '../components/common';

const logo = require('../../assets/logoHR.png');

export function AuthScreen({ theme, setThemeMode, onEnter }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('dentist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.authScroll,
          {
            paddingTop: Math.max(34, insets.top + 14),
            paddingBottom: Math.max(34, insets.bottom + 28),
          },
        ]}>
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
            <LedText selectable style={styles.authBrandReminder}>Reminder</LedText>
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
            {mode === 'login' ? 'Inicia sesion para continuar' : 'Configura tu acceso a HealthyReminder'}
          </Text>

          <View style={[styles.segment, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {[
              { id: 'dentist', label: 'Dentista' },
              { id: 'patient', label: 'Paciente' },
            ].map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setRole(item.id);
                  setEmail('');
                }}
                style={[styles.segmentItem, role === item.id && { backgroundColor: theme.chip }]}>
                <Text style={[styles.segmentText, { color: role === item.id ? colors.blueDark : theme.muted }]}>
                  {item.label}
                </Text>
                {role === item.id ? <View style={styles.segmentLine} /> : null}
              </Pressable>
            ))}
          </View>

          {mode === 'register' ? (
            <Input
              label={role === 'patient' ? 'Codigo de invitacion' : 'Nombre del consultorio'}
              value={role === 'patient' ? 'HR-ALAN-2026' : 'Clinica HealthyReminder'}
              onChangeText={() => {}}
              theme={theme}
              icon="H"
            />
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

          <Pressable onPress={() => Alert.alert('Recuperar acceso', `Enviaremos instrucciones a ${email || 'tu correo registrado'}.`)}>
            <Text style={styles.forgotText}>Olvidaste tu contrasena?</Text>
          </Pressable>

          <GradientButton
            label={submitting ? 'Verificando...' : mode === 'login' ? `Entrar como ${role === 'patient' ? 'paciente' : 'dentista'}` : 'Crear cuenta'}
            onPress={async () => {
              if (mode === 'register') {
                Alert.alert('Registro protegido', 'Solicita al administrador que cree tu acceso desde la web.');
                return;
              }
              if (submitting) return;
              setSubmitting(true);
              try {
                const user = await onEnter(email.trim(), password);
                if (user.role !== role) Alert.alert('Rol actualizado', `Ingresaste con el perfil ${user.role === 'patient' ? 'paciente' : 'dentista'}.`);
              } catch (error) {
                Alert.alert('No fue posible iniciar sesión', error.message);
              } finally {
                setSubmitting(false);
              }
            }}
          />
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
