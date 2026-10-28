import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Servicio unificado de respuesta táctil háptica (Haptic Feedback)
 * Compatible con Android nativo (Capacitor) y navegadores web móviles (navigator.vibrate)
 */
export async function triggerHaptic(type: HapticType = 'light'): Promise<void> {
  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
  } catch {
    // Fallback universal a navigator.vibrate para navegadores móviles
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        if (type === 'light') navigator.vibrate(15);
        else if (type === 'medium') navigator.vibrate(30);
        else if (type === 'heavy') navigator.vibrate(50);
        else if (type === 'success') navigator.vibrate([15, 40, 20]);
        else if (type === 'warning') navigator.vibrate([30, 50, 30]);
        else if (type === 'error') navigator.vibrate([50, 40, 50]);
      }
    } catch {}
  }
}
