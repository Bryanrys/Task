import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { triggerHaptic } from './hapticsService';

const BIOMETRIC_ENABLED_KEY = 'uees_biometric_enabled_v1';
const BIOMETRIC_CREDENTIAL_SERVER = 'com.uees.dashboard.auth';

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'face' | 'biometric' | 'none';
  errorMessage?: string;
}

/**
 * Verifica si el dispositivo cuenta con sensor de huella dactilar o biometría disponible
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  // 1. Verificar primero con Capacitor NativeBiometric (Android nativo)
  try {
    const result = await NativeBiometric.isAvailable();
    if (result && result.isAvailable) {
      let type: 'fingerprint' | 'face' | 'biometric' = 'fingerprint';
      const biometryTypeStr = String(result.biometryType || '').toLowerCase();
      if (biometryTypeStr.includes('face')) {
        type = 'face';
      } else if (biometryTypeStr.includes('touch') || biometryTypeStr.includes('finger')) {
        type = 'fingerprint';
      } else {
        type = 'biometric';
      }
      return {
        isAvailable: true,
        biometryType: type,
      };
    }
  } catch {
    // Si no está en entorno nativo, revisar WebAuthn
  }

  // 2. Fallback: Web Authentication API (Navegador móvil / Chrome Android)
  try {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      const isWebAuthnAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (isWebAuthnAvailable) {
        return {
          isAvailable: true,
          biometryType: 'fingerprint',
        };
      }
    }
  } catch {}

  return {
    isAvailable: false,
    biometryType: 'none',
  };
}

/**
 * Verifica si el usuario tiene activado el ingreso biométrico
 */
export function isBiometricUnlockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
}

/**
 * Guarda la preferencia de ingreso con huella
 */
export function setBiometricUnlockEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Guarda credenciales cifradas en el almacén de claves biométricas de Android (KeyStore)
 */
export async function saveBiometricCredentials(username: string, pass: string): Promise<boolean> {
  try {
    await NativeBiometric.setCredentials({
      server: BIOMETRIC_CREDENTIAL_SERVER,
      username,
      password: pass,
    });
    setBiometricUnlockEnabled(true);
    return true;
  } catch {
    // Si falla o estamos en web, guardamos solo la preferencia
    setBiometricUnlockEnabled(true);
    return true;
  }
}

/**
 * Solicita la huella dactilar del usuario para autenticar y acceder
 */
export async function authenticateWithBiometrics(
  reason: string = 'Escanea tu huella dactilar para ingresar al Dashboard Académico UEES'
): Promise<{ success: boolean; username?: string; error?: string }> {
  // Intentar con plugin nativo
  try {
    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Desbloqueo Biométrico UEES',
      subtitle: 'Coloca tu dedo en el sensor de huella',
      description: 'Accede rápidamente a tus materias, notas y actividades',
      negativeButtonText: 'Usar contraseña',
      maxAttempts: 3,
    });

    await triggerHaptic('success');

    // Intentar recuperar credenciales seguras si existen
    try {
      const creds = await NativeBiometric.getCredentials({
        server: BIOMETRIC_CREDENTIAL_SERVER,
      });
      if (creds && creds.username) {
        return { success: true, username: creds.username };
      }
    } catch {}

    const rememberedUser = localStorage.getItem('uees_logged_user') || 'Admin';
    return { success: true, username: rememberedUser };
  } catch (err: any) {
    // Si el usuario canceló deliberadamente
    const msg = String(err?.message || err || '');
    if (msg.includes('cancel') || msg.includes('userCancel')) {
      await triggerHaptic('light');
      return { success: false, error: 'Autenticación cancelada por el usuario' };
    }

    // Probar fallback WebAuthn si estamos en navegador
    try {
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof navigator.credentials?.get === 'function'
      ) {
        // Desafío WebAuthn básico para activar sensor biométrico
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'required',
          },
        });

        await triggerHaptic('success');
        const rememberedUser = localStorage.getItem('uees_logged_user') || 'Admin';
        return { success: true, username: rememberedUser };
      }
    } catch {}

    await triggerHaptic('warning');
    return { success: false, error: err?.message || 'No se pudo verificar la huella digital' };
  }
}
