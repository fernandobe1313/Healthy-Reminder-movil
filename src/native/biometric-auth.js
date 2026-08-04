import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const ENABLED_KEY_PREFIX = 'hr_device_auth_enabled:';

function preferenceKey(userId) {
  return `${ENABLED_KEY_PREFIX}${String(userId || 'default')}`;
}

export async function getDeviceAuthCapability() {
  if (process.env.EXPO_OS === 'web') return { available: false, label: 'No disponible en web', types: [] };
  try {
    const [hardware, enrolled, level, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const hasDeviceCredential = level >= LocalAuthentication.SecurityLevel.SECRET;
    const labels = [];
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) labels.push(process.env.EXPO_OS === 'ios' ? 'Face ID' : 'reconocimiento facial');
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) labels.push(process.env.EXPO_OS === 'ios' ? 'Touch ID' : 'huella');
    return {
      available: Boolean((hardware && enrolled) || hasDeviceCredential),
      biometricAvailable: Boolean(hardware && enrolled),
      hasDeviceCredential,
      types,
      label: labels.length ? labels.join(' o ') : hasDeviceCredential ? 'PIN, patrón o contraseña del dispositivo' : 'No configurado',
    };
  } catch {
    return { available: false, biometricAvailable: false, hasDeviceCredential: false, label: 'No disponible', types: [] };
  }
}

export async function authenticateDeviceOwner() {
  const capability = await getDeviceAuthCapability();
  if (!capability.available) return { success: false, error: 'not_available', capability };
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear HealthyReminder',
    promptSubtitle: 'Protege el acceso a la información clínica',
    promptDescription: 'Confirma tu identidad para continuar',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar código del dispositivo',
    disableDeviceFallback: false,
    biometricsSecurityLevel: 'weak',
  });
  return { ...result, capability };
}

export async function isDeviceAuthEnabled(userId) {
  if (process.env.EXPO_OS === 'web') return false;
  return (await SecureStore.getItemAsync(preferenceKey(userId))) === 'true';
}

export async function setDeviceAuthPreference(userId, enabled) {
  if (process.env.EXPO_OS === 'web') return;
  const key = preferenceKey(userId);
  if (enabled) await SecureStore.setItemAsync(key, 'true');
  else await SecureStore.deleteItemAsync(key);
}
