import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/palette';
import { LedText } from '../components/common';

export function BiometricLockScreen({ theme, user, capability, busy, error, onUnlock, onUseAccountPassword }) {
  const insets = useSafeAreaInsets();

  useEffect(() => { onUnlock(); }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, backgroundColor: theme.bg }}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <View style={{ borderWidth: 1, borderColor: theme.line, borderRadius: 30, padding: 24, gap: 18, alignItems: 'center', backgroundColor: theme.card }}>
        <View style={{ width: 76, height: 76, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.blue}18`, borderWidth: 1, borderColor: `${colors.blue}45` }}>
          <Text style={{ color: colors.blue, fontSize: 34 }}>◎</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 7 }}>
          <LedText selectable style={{ fontSize: 13, fontWeight: '900', letterSpacing: 1.4 }}>ACCESO PROTEGIDO</LedText>
          <Text selectable style={{ color: theme.text, fontSize: 25, fontWeight: '900', textAlign: 'center' }}>Desbloquear HealthyReminder</Text>
          <Text selectable style={{ color: theme.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }}>
            {user?.full_name || user?.username || 'Usuario'} · Usa {capability?.label || 'la seguridad del dispositivo'} para acceder a la información clínica.
          </Text>
        </View>
        {error ? <Text selectable style={{ color: colors.red, textAlign: 'center', fontWeight: '700' }}>{error}</Text> : null}
        <Pressable disabled={busy} onPress={onUnlock} style={({ pressed }) => ({ width: '100%', minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue, opacity: busy ? 0.6 : pressed ? 0.82 : 1 })}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Desbloquear</Text>}
        </Pressable>
        <Pressable disabled={busy} onPress={onUseAccountPassword} hitSlop={10}>
          <Text style={{ color: theme.muted, fontSize: 14, fontWeight: '800' }}>Usar contraseña de la cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}
