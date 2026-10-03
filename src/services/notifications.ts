import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 15, 30, 60, 120
  lastSent?: number; // timestamp in ms of last sent or last scheduled base
}

const SETTINGS_KEY = 'academic_dashboard_notif_settings';
export const NOTIF_SETTINGS_EVENT = 'academic_notification_settings_changed';

// IDs reserved for periodic native Android background reminders
const NATIVE_REMINDER_ID_START = 9101;
const NATIVE_REMINDER_SLOTS = 12; // Pre-schedule up to 12 upcoming intervals into Android AlarmManager

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          enabled: parsed.enabled !== false,
          intervalMinutes: Number(parsed.intervalMinutes) || 30,
          lastSent: Number(parsed.lastSent) || Date.now(),
        };
      }
    }
  } catch { }
  return { enabled: true, intervalMinutes: 30, lastSent: Date.now() };
}

export function saveNotificationSettings(settings: NotificationSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(
      new CustomEvent(NOTIF_SETTINGS_EVENT, { detail: settings })
    );
  } catch (e) {
    console.warn('Error saving notification settings:', e);
  }
}

// Calculate remaining milliseconds until the next scheduled reminder
export function getRemainingMsUntilNextReminder(): number {
  const settings = getNotificationSettings();
  if (!settings.enabled) return 0;

  const intervalMs = Math.max(1, settings.intervalMinutes) * 60 * 1000;
  const lastSent = settings.lastSent || Date.now();
  const elapsed = Date.now() - lastSent;
  const remaining = intervalMs - elapsed;

  return Math.max(0, remaining);
}

// Ensure high-priority notification channel for Android (Heads-up banner like WhatsApp)
export const ANDROID_CHANNEL_ID = 'academic_reminders_v2';
let channelInitialized = false;

export async function ensureAndroidChannel() {
  if (channelInitialized) return;
  try {
    if (Capacitor.isNativePlatform()) {
      // Clean up previous channel that may have been created without sound resource
      await LocalNotifications.deleteChannel({ id: 'academic_high_priority' }).catch(() => { });

      await LocalNotifications.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'Recordatorios de Entregas',
        description: 'Avisos destacados estilo banner emergente con timbre para entregas pendientes',
        importance: 5, // 5 = IMPORTANCE_HIGH / HEADS_UP
        visibility: 1, // VISIBILITY_PUBLIC (Shows on lockscreen)
        sound: 'beep.wav',
        vibration: true,
        lights: true,
        lightColor: '#facc15',
      });
      channelInitialized = true;
    }
  } catch (e) {
    console.warn('Channel creation error:', e);
  }
}

// Pleasant notification chime using both audio file & Web Audio API
export function playNotificationSound() {
  let played = false;
  try {
    const audio = new Audio('/beep.wav');
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          played = true;
        })
        .catch(() => {
          if (!played) playSynthesizedChime();
        });
    }
  } catch {
    playSynthesizedChime();
  }
}

function playSynthesizedChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const t = ctx.currentTime;

    // Note 1: G5 (784 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(783.99, t);
    gain1.gain.setValueAtTime(0.55, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.35);

    // Note 2: C6 (1046.5 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, t + 0.08);
    gain2.gain.setValueAtTime(0.75, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.55);
  } catch { }
}

export async function requestNotificationPermission(): Promise<boolean> {
  // If running as native Android APK
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } catch {
      return false;
    }
  }

  // Fallback to Web Notification API
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'default';
    } catch {
      return 'default';
    }
  }

  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Schedule future background reminders in Android AlarmManager so they fire even when app is CLOSED or IN SLEEP/DOZE MODE
export async function syncAndroidBackgroundSchedule(
  pendingSubjects: string[],
  totalPendingCount: number
) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await ensureAndroidChannel();

    // 1. Cancel previous scheduled slots
    const cancelList = Array.from({ length: NATIVE_REMINDER_SLOTS }, (_, idx) => ({
      id: NATIVE_REMINDER_ID_START + idx,
    }));
    await LocalNotifications.cancel({ notifications: cancelList }).catch(() => { });

    const settings = getNotificationSettings();
    if (!settings.enabled) return;

    const intervalMs = Math.max(1, settings.intervalMinutes) * 60 * 1000;
    const subjectsStr =
      pendingSubjects.length > 2
        ? `${pendingSubjects.slice(0, 2).join(', ')} y más`
        : pendingSubjects.join(' y ');

    const title =
      totalPendingCount > 0
        ? `📚 (${totalPendingCount} pendientes)`
        : '🎉 ¡Al día con tus materias!';

    const body =
      totalPendingCount > 0
        ? `¡${subjectsStr}! 🔥`
        : '¡No tienes actividades pendientes esta semana! ¡Buen trabajo! 🗿';

    const notificationsToSchedule = [];
    const baseTime = Date.now();

    for (let i = 1; i <= NATIVE_REMINDER_SLOTS; i++) {
      notificationsToSchedule.push({
        id: NATIVE_REMINDER_ID_START + (i - 1),
        title,
        body,
        schedule: {
          at: new Date(baseTime + i * intervalMs),
          allowWhileIdle: true, // CRITICAL: Wakes up phone even in Android Doze Mode
        },
        channelId: ANDROID_CHANNEL_ID,
        sound: 'beep.wav',
        smallIcon: 'ic_stat_icon_config_sample',
        actionTypeId: '',
        extra: null,
      });
    }

    await LocalNotifications.schedule({
      notifications: notificationsToSchedule,
    });
  } catch (e) {
    console.warn('Error scheduling native background notifications:', e);
  }
}

// Immediate notification trigger (Web & Native Android)
export async function sendSystemNotification(title: string, body: string) {
  // Sound feedback
  playNotificationSound();

  // 1. If running as native Android APK (Capacitor Local Notifications)
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureAndroidChannel();
      const notifId = Math.floor(Date.now() % 100000);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            schedule: { at: new Date(Date.now() + 200) },
            channelId: ANDROID_CHANNEL_ID,
            sound: 'beep.wav',
            smallIcon: 'ic_stat_icon_config_sample',
            actionTypeId: '',
            extra: null,
          },
        ],
      });
      return;
    } catch (e) {
      console.warn('Capacitor native notification warning:', e);
    }
  }

  // 2. Web / Browser fallback
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            // @ts-ignore
            vibrate: [200, 100, 200],
          });
        })
        .catch(() => {
          new Notification(title, { body, icon: '/pwa-192x192.png' });
        });
    } else {
      new Notification(title, { body, icon: '/pwa-192x192.png' });
    }
  } catch (e) {
    console.warn('Error enviando notificación web:', e);
  }
}

// Check and trigger reminder based on pending subjects
export function checkAndTriggerPendingReminder(
  pendingSubjects: string[],
  totalPendingCount: number,
  isManualTest = false
) {
  const settings = getNotificationSettings();
  if (!settings.enabled && !isManualTest) return;

  const subjectsStr =
    pendingSubjects.length > 2
      ? `${pendingSubjects.slice(0, 2).join(', ')} y más`
      : pendingSubjects.length > 0
        ? pendingSubjects.join(' y ')
        : 'tus materias';

  if (totalPendingCount > 0) {
    sendSystemNotification(
      `📚 (${totalPendingCount} pendientes)`,
      `¡${subjectsStr}! 🔥`
    );
  } else {
    sendSystemNotification(
      '🎉 ¡Al día bro!',
      '¡No tienes materias pendientes por entregar esta semana! ¡Sigue así! 🗿'
    );
  }

  // Update lastSent timestamp
  settings.lastSent = Date.now();
  saveNotificationSettings(settings);

  // Sync Android native alarms for future intervals
  syncAndroidBackgroundSchedule(pendingSubjects, totalPendingCount);
}
