/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  Download,
  Upload,
  Link as LinkIcon,
  Edit3,
  Calendar,
  Plus,
  Check,
  Sun,
  Moon,
  Laptop,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Bell,
  BellRing,
  FileText,
  Eye,
  EyeOff,
  Calculator,
  Timer,
  BookOpen,
  FileDown,
  FileUp,
  GraduationCap,
  Edit2,
  Share2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  LogOut,
  User,
  Menu,
  Clock,
  MessageSquare,
  Code2,
  Atom,
  Binary,
  CalendarDays,
  ExternalLink,
  Globe,
  X,
  Bot,
} from 'lucide-react';

import { Dashboard, WeekItem, SubjectItem, TaskItem } from './types';
import {
  INITIAL_DASHBOARDS,
  MATERIAS_DEFAULT,
  ACTIVIDADES_CLASES,
  ACTIVIDADES_PARCIALES,
  esSemanaDeParciales,
} from './constants/initialData';

import { LoginScreen } from './components/LoginScreen';
import { SidebarNav } from './components/SidebarNav';
import { AnalyticsSection } from './components/AnalyticsSection';
import { WelcomeModal } from './components/WelcomeModal';
import { WizardModal } from './components/WizardModal';
import { DrawerDashboards } from './components/DrawerDashboards';
import { PromptModal, ConfirmModal } from './components/ActionModals';
import { StartDateModal } from './components/StartDateModal';
import { TaskNoteModal } from './components/TaskNoteModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ParcialSplashModal } from './components/ParcialSplashModal';
import { BloqueTareasWidget } from './components/BloqueTareasWidget';
import { Toast } from './components/Toast';
import { PerformanceChart } from './components/PerformanceChart';
import { GradeCalculatorModal } from './components/GradeCalculatorModal';
import { PomodoroTimerModal } from './components/PomodoroTimerModal';
import { ClassScheduleModal } from './components/ClassScheduleModal';
import { UniversityLinksModal } from './components/UniversityLinksModal';
import { EditSubjectModal } from './components/EditSubjectModal';
import { ShareAppModal } from './components/ShareAppModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ThemeModal, THEME_PALETTES } from './components/ThemeModal';
import { PensumConfigModal } from './components/PensumConfigModal';
import { syncTaskWidget } from './services/pensumWidgetService';
import { ToolsAndLinksView } from './components/ToolsAndLinksView';
import { UnifiedDashboardHeader } from './components/UnifiedDashboardHeader';
import { triggerHaptic } from './services/hapticsService';
import { getDeadlineStatus } from './utils/deadline';
import { formatOrResolveWeekDateRange, computeWeekRangeFromDate } from './utils/dateRange';
import {
  calculateUeesGrade,
  findGradeDataForSubject,
  getSavedGradesData,
  SubjectGradeData,
} from './utils/gradeCalculation';

import { cloudSave, cloudLoad } from './services/supabase';
import { Capacitor } from '@capacitor/core';
import {
  getNotificationSettings,
  sendSystemNotification,
  checkAndTriggerPendingReminder,
  requestNotificationPermission,
  syncAndroidBackgroundSchedule,
  NOTIF_SETTINGS_EVENT,
} from './services/notifications';

const STORAGE_KEY = 'academic_dashboard_data_v2';
const THEME_KEY = 'academic_dashboard_theme_v1';

export function calculateDaysElapsed(startDateStr?: string, startDateISO?: string): number {
  let dateObj: Date | null = null;
  if (startDateISO) {
    dateObj = new Date(startDateISO + 'T00:00:00');
  } else if (startDateStr) {
    const months: Record<string, number> = {
      ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
      JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11
    };
    const parts = startDateStr.split(' ');
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const mStr = parts[1].substring(0, 3).toUpperCase();
      const month = months[mStr] ?? 6;
      const year = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    } else {
      dateObj = new Date(startDateStr);
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) return 84;

  const now = new Date();
  const d1 = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export type ThemeMode = 'system' | 'dark' | 'light';

export default function App() {
  // Theme state con detección automática del sistema (Sistema / Oscuro / Claro)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('uees_theme_mode') as ThemeMode;
      if (saved === 'system' || saved === 'dark' || saved === 'light') return saved;
      const legacy = localStorage.getItem(THEME_KEY) as ThemeMode;
      if (legacy === 'system' || legacy === 'dark' || legacy === 'light') return legacy;
    } catch {}
    return 'system';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const mode = (localStorage.getItem('uees_theme_mode') || localStorage.getItem(THEME_KEY)) as ThemeMode;
      if (mode === 'dark') return true;
      if (mode === 'light') return false;
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('uees_theme_mode', mode);
      localStorage.setItem(THEME_KEY, mode);
      const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
      const willBeDark = mode === 'system' ? (mediaQuery ? mediaQuery.matches : true) : mode === 'dark';
      setIsDark(willBeDark);
      if (willBeDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch {}
    setToastMessage(`🌓 Modo cambiado a: ${mode === 'system' ? 'AUTOMÁTICO' : mode === 'dark' ? 'OSCURO' : 'CLARO'}`);
  };

  const cycleThemeMode = () => {
    const nextMode: ThemeMode = themeMode === 'system' ? 'dark' : themeMode === 'dark' ? 'light' : 'system';
    handleSelectThemeMode(nextMode);
  };

  // Authentication & Session state (Login Screen Pro UEES)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('uees_academic_auth_v1') === 'authenticated';
    } catch {
      return false;
    }
  });

  const [loggedUser, setLoggedUser] = useState<string>(() => {
    try {
      return localStorage.getItem('uees_logged_user') || 'Admin';
    } catch {
      return 'Admin';
    }
  });

  const handleLoginSuccess = (user: string) => {
    setLoggedUser(user);
    setIsAuthenticated(true);
    setToastMessage(`¡Bienvenido al Dashboard Académico, ${user}! ✨`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('uees_academic_auth_v1');
    } catch { }
    setIsAuthenticated(false);
    setShowDrawer(false);
    setToastMessage('Sesión cerrada correctamente');
  };

  const handleTriggerCelebration = () => {
    setToastMessage('✨ ¡Excelente trabajo manteniéndote al día con tus estudios! 🎉');
  };

  // Modal de Nota Rápida del Dashboard
  const [showQuickNoteModal, setShowQuickNoteModal] = useState<boolean>(false);
  const [quickNoteDraft, setQuickNoteDraft] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Dashboards state
  const [dashboards, setDashboards] = useState<Dashboard[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((d: Dashboard) => {
            const isUeesCiclo2 =
              d.name?.includes('UEES') ||
              d.id === 'dash-uees' ||
              d.weeks?.some(
                (w) =>
                  w.dateRange?.includes('jul') ||
                  w.dateRange?.includes('ago') ||
                  w.dateRange?.includes('sep') ||
                  w.dateRange?.includes('oct')
              );
            const needsStartDateFix =
              isUeesCiclo2 &&
              (d.startDateISO === '2026-01-19' || d.startDate?.includes('19 ENE'));

            const resolvedStartDateISO = needsStartDateFix ? '2026-07-06' : d.startDateISO || '2026-07-06';
            const resolvedStartDate = needsStartDateFix ? '06 JUL 2026' : d.startDate || '06 JUL 2026';

            const isGenericSubjects =
              !d.subjects ||
              (d.subjects.length <= 3 &&
                d.subjects.every((s: SubjectItem) => s.name.startsWith('Materia ')));

            const resolvedSubjects = isGenericSubjects ? INITIAL_DASHBOARDS[0].subjects : d.subjects;

            return {
              ...d,
              startDateISO: resolvedStartDateISO,
              startDate: resolvedStartDate,
              accessCode: !d.accessCode || d.accessCode === 'UEES-2026' ? 'oo' : d.accessCode,
              subjects: resolvedSubjects,
              weeks: Array.isArray(d.weeks)
                ? d.weeks.map((w: WeekItem) => {
                    const taskMap = { ...(w.subjectTasks || {}) };
                    resolvedSubjects.forEach((subj) => {
                      if (!taskMap[subj.id] || taskMap[subj.id].length === 0) {
                        taskMap[subj.id] = (d.defaultTaskNames || ACTIVIDADES_CLASES).map((tName, tIdx) => ({
                          id: `task-${w.weekNumber}-${subj.id}-${tIdx}`,
                          name: tName,
                          completed: false,
                        }));
                      }
                    });
                    return {
                      ...w,
                      dateRange: formatOrResolveWeekDateRange(
                        w.weekNumber,
                        resolvedStartDateISO,
                        w.dateRange
                      ),
                      subjectTasks: taskMap,
                    };
                  })
                : d.weeks,
            };
          });
        }
      }
    } catch { }
    return INITIAL_DASHBOARDS;
  });

  const [activeDashId, setActiveDashId] = useState<string>(() => {
    return dashboards[0]?.id || 'dash-uees';
  });

  // Grades tracker state & synchronization for live UI updates
  const [gradesTracker, setGradesTracker] = useState<Record<string, SubjectGradeData>>(() => {
    return getSavedGradesData();
  });
  const [selectedGradeSubjectId, setSelectedGradeSubjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleSyncGrades = () => {
      setGradesTracker(getSavedGradesData());
    };
    window.addEventListener('academic_data_synced', handleSyncGrades);
    window.addEventListener('storage', handleSyncGrades);
    return () => {
      window.removeEventListener('academic_data_synced', handleSyncGrades);
      window.removeEventListener('storage', handleSyncGrades);
    };
  }, []);

  // Toggle whether to show completed subjects or keep them automatically hidden
  const [showCompletedSubjects, setShowCompletedSubjects] = useState<boolean>(false);

  // Cloud status string
  const [cloudStatus, setCloudStatus] = useState<string>('🟢 RECIENTE');

  // Modals & UI States
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showStartDateModal, setShowStartDateModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showParcialSplash, setShowParcialSplash] = useState<boolean>(false);
  const [showGradesModal, setShowGradesModal] = useState<boolean>(false);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [showPomodoroModal, setShowPomodoroModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showLinksModal, setShowLinksModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showPensumModal, setShowPensumModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Paleta de temas personalizada (titanium, oled, nord, emerald, sepia)
  const [activePalette, setActivePalette] = useState<string>(() => {
    try {
      return localStorage.getItem('uees_custom_palette') || 'titanium';
    } catch {
      return 'titanium';
    }
  });

  const handleSelectPalette = (paletteId: string) => {
    setActivePalette(paletteId);
    try {
      localStorage.setItem('uees_custom_palette', paletteId);
      document.documentElement.setAttribute('data-palette', paletteId);
    } catch {}
    const pal = THEME_PALETTES.find((p) => p.id === paletteId);
    setToastMessage(`🎨 Paleta aplicada: ${pal ? pal.name : paletteId.toUpperCase()}`);
  };

  // View switcher (Dashboard Principal, Horario & Clases, Base de Datos Nube - Estilo Image 2)
  const [currentView, setCurrentView] = useState<'dashboard' | 'schedule' | 'cloud'>('dashboard');
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);
  // Selected Subject Focus (abre solo esa materia y los ajustes)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // New Task for Subject Modal
  const [targetSubjectForNewTask, setTargetSubjectForNewTask] = useState<SubjectItem | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDesc, setNewTaskDesc] = useState<string>('');

  const handleOpenNewTaskModal = (subject: SubjectItem) => {
    setTargetSubjectForNewTask(subject);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleSaveNewTask = () => {
    if (!targetSubjectForNewTask || !newTaskTitle.trim()) {
      setToastMessage('Por favor ingresa un título para la actividad');
      return;
    }
    const taskName = newTaskTitle.trim();
    const desc = newTaskDesc.trim();

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        return {
          ...d,
          weeks: d.weeks.map((w) => {
            if (!currentWeek || w.id !== currentWeek.id) return w;
            const currentList = w.subjectTasks[targetSubjectForNewTask.id] || [];
            const newTaskItem: TaskItem = {
              id: `task-${Date.now()}`,
              name: taskName,
              completed: false,
              note: desc || undefined,
            };
            return {
              ...w,
              subjectTasks: {
                ...w.subjectTasks,
                [targetSubjectForNewTask.id]: [...currentList, newTaskItem],
              },
            };
          }),
        };
      })
    );

    setTargetSubjectForNewTask(null);
    setToastMessage(`Tarea agregada exitosamente a ${targetSubjectForNewTask.name}`);
  };

  const scrollToSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setCurrentView('dashboard');
    setTimeout(() => {
      const el = document.getElementById(`subject-${subjectId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-zinc-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-zinc-400'), 2000);
      }
    }, 120);
  };

  const SHARE_URL_STORAGE_KEY = 'academic_custom_share_url';
  const DEFAULT_SHARE_URL = 'https://task-ecru-eight-84.vercel.app';

  const [shareableUrl, setShareableUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('academic_custom_share_url');
      if (saved && !saved.includes('run.app') && !saved.includes('google')) {
        return saved;
      }
    } catch { }

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (
        origin &&
        !origin.includes('localhost') &&
        !origin.includes('127.0.0.1') &&
        !origin.startsWith('capacitor://') &&
        !origin.startsWith('file://') &&
        !origin.includes('run.app')
      ) {
        return origin;
      }
    }
    return 'https://task-ecru-eight-84.vercel.app';
  });

  const handleUpdateShareUrl = (newUrl: string) => {
    setShareableUrl(newUrl);
    try {
      localStorage.setItem('academic_custom_share_url', newUrl);
    } catch { }
  };

  // Hidden file input ref for JSON import
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // Sliding Views Navigation (0: Tareas pendientes, 1: Horario, Enlaces & JSON)
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const handleSwitchTab = (tab: 0 | 1) => {
    if (tab === activeTab) return;
    setSlideDirection(tab === 1 ? 'right' : 'left');
    setActiveTab(tab);
  };

  // Touch Swipe Gesture Detection for Mobile / Android
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    // Detect horizontal swipe (> 45px, predominantly horizontal)
    if (Math.abs(diffX) > Math.abs(diffY) * 1.15 && Math.abs(diffX) > 45) {
      if (diffX < 0 && activeTab === 0) {
        // Swiped finger left -> go to Tab 1 (Herramientas, Horario & JSON)
        handleSwitchTab(1);
      } else if (diffX > 0 && activeTab === 1) {
        // Swiped finger right -> return to Tab 0 (Tareas)
        handleSwitchTab(0);
      } else if (diffX > 0 && activeTab === 0) {
        // Also support literal swipe right if user drags right on tab 0
        handleSwitchTab(1);
      } else if (diffX < 0 && activeTab === 1) {
        // Also support swipe left on tab 1 to return to tab 0
        handleSwitchTab(0);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Task Note Modal state
  const [activeNoteTarget, setActiveNoteTarget] = useState<{
    subjectId: string;
    taskId: string;
    taskName: string;
    note: string;
    deadlineISO?: string;
  } | null>(null);

  // Action & Deletion Modals
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [pendingDownloadCode, setPendingDownloadCode] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEditNotePrompt, setShowEditNotePrompt] = useState(false);

  const [pendingDeleteDashId, setPendingDeleteDashId] = useState<string | null>(null);
  const [pendingDeleteWeekId, setPendingDeleteWeekId] = useState<string | null>(null);

  // Persist dashboards
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  }, [dashboards]);

  // Persist theme & sincronización en tiempo real con el sistema operativo
  useEffect(() => {
    const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    const applyTheme = (forcedSystemDark?: boolean) => {
      let activeDark = false;
      if (themeMode === 'system') {
        if (typeof forcedSystemDark === 'boolean') {
          activeDark = forcedSystemDark;
        } else if (mediaQuery) {
          activeDark = mediaQuery.matches;
        }
      } else {
        activeDark = themeMode === 'dark';
      }

      setIsDark(activeDark);
      if (activeDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
      document.documentElement.setAttribute('data-palette', activePalette);
    };

    applyTheme();

    try {
      localStorage.setItem('uees_theme_mode', themeMode);
      localStorage.setItem(THEME_KEY, themeMode);
    } catch {}

    // Listener para MediaQueryList del navegador/WebView
    const handleMediaQueryChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (themeMode === 'system') {
        applyTheme(e.matches);
      }
    };

    if (mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaQueryChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleMediaQueryChange);
      }
    }

    // Listener nativo directo emitido por MainActivity.java (Android)
    const handleAndroidThemeChange = (e: any) => {
      if (themeMode === 'system' && e && e.detail && typeof e.detail.isDark === 'boolean') {
        applyTheme(e.detail.isDark);
      }
    };
    window.addEventListener('androidThemeChange', handleAndroidThemeChange);

    // Re-evaluar tema cuando el usuario vuelve a la app desde los ajustes del sistema
    const handleVisibilityOrFocus = () => {
      if (themeMode === 'system') {
        applyTheme();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMediaQueryChange);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(handleMediaQueryChange);
        }
      }
      window.removeEventListener('androidThemeChange', handleAndroidThemeChange);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [themeMode, activePalette]);

  // Deslizar el dedo para abrir/cerrar el panel lateral SOLO en la app nativa (APK / Capacitor)
  useEffect(() => {
    // Exclusivo para la aplicación móvil nativa (Capacitor / Android APK).
    // En la versión web (navegadores) permanece estrictamente inactivo.
    if (!Capacitor.isNativePlatform() || !isAuthenticated) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isVerticalScroll = false;
    let hasTriggered = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (window.innerWidth >= 768) return;

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isVerticalScroll = false;
      hasTriggered = false;

      // No activar sobre inputs, textareas, selects o scroll horizontal de semanas/pestañas
      const target = touch.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], .overflow-x-auto, [data-no-swipe]'
        )
      ) {
        isVerticalScroll = true;
        return;
      }

      // Si hay un modal abierto, no interferir con la navegación del modal
      const isModalOpen =
        showQuickNoteModal ||
        showWelcome ||
        showWizard ||
        showDrawer ||
        showStartDateModal ||
        showNotificationModal ||
        showParcialSplash ||
        showGradesModal ||
        showAIAssistant ||
        showPomodoroModal ||
        showScheduleModal ||
        showLinksModal ||
        showShareModal ||
        showUploadConfirm ||
        showDownloadPrompt ||
        showDownloadConfirm ||
        showResetConfirm ||
        showEditNotePrompt ||
        Boolean(targetSubjectForNewTask) ||
        Boolean(editingSubject) ||
        Boolean(activeNoteTarget);

      if (!showMobileSidebar && isModalOpen) {
        isVerticalScroll = true;
        return;
      }

      // Para abrir el panel, el gesto debe iniciar en el área izquierda o central (hasta el 75% del ancho de la pantalla)
      if (!showMobileSidebar && touchStartX > window.innerWidth * 0.75) {
        isVerticalScroll = true;
        return;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isVerticalScroll || hasTriggered || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Si el movimiento vertical inicial predomina sobre el horizontal, es scroll vertical de la pantalla
      if (absY > 12 && absY > absX) {
        isVerticalScroll = true;
        return;
      }

      // Panel cerrado: deslizar el dedo hacia la derecha (swipe right) abre el panel
      if (!showMobileSidebar) {
        if (deltaX > 50 && deltaX > absY * 1.3) {
          hasTriggered = true;
          setShowMobileSidebar(true);
        }
      } else {
        // Panel abierto: deslizar hacia la izquierda (swipe left) cierra el panel
        if (deltaX < -45 && absX > absY * 1.2) {
          hasTriggered = true;
          setShowMobileSidebar(false);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isVerticalScroll && !hasTriggered && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const deltaTime = Date.now() - touchStartTime;

        // Soporte para gestos rápidos (flicks)
        if (deltaTime < 450) {
          if (!showMobileSidebar && deltaX > 40 && deltaX > absY * 1.3) {
            setShowMobileSidebar(true);
          } else if (showMobileSidebar && deltaX < -40 && absX > absY * 1.2) {
            setShowMobileSidebar(false);
          }
        }
      }
      isVerticalScroll = false;
      hasTriggered = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    isAuthenticated,
    showMobileSidebar,
    showQuickNoteModal,
    showWelcome,
    showWizard,
    showDrawer,
    showStartDateModal,
    showNotificationModal,
    showParcialSplash,
    showGradesModal,
    showAIAssistant,
    showPomodoroModal,
    showScheduleModal,
    showLinksModal,
    showShareModal,
    showUploadConfirm,
    showDownloadPrompt,
    showDownloadConfirm,
    showResetConfirm,
    showEditNotePrompt,
    targetSubjectForNewTask,
    editingSubject,
    activeNoteTarget,
  ]);

  // Current active dashboard
  const currentDashboard = useMemo(() => {
    return dashboards.find((d) => d.id === activeDashId) || dashboards[0];
  }, [dashboards, activeDashId]);

  // Current active week
  const currentWeek = useMemo(() => {
    if (!currentDashboard) return null;
    return (
      currentDashboard.weeks.find((w) => w.id === currentDashboard.activeWeekId) ||
      currentDashboard.weeks[0]
    );
  }, [currentDashboard]);

  // Is current week a Parcial week (e.g. week 6, week 12, week 18)?
  const isParcialWeek = useMemo(() => {
    if (!currentWeek) return false;
    return esSemanaDeParciales(currentWeek.weekNumber);
  }, [currentWeek]);

  // Calculate Days Transcurridos in real time
  const daysTranscurridos = useMemo(() => {
    if (!currentDashboard) return 84;
    return calculateDaysElapsed(currentDashboard.startDate, currentDashboard.startDateISO);
  }, [currentDashboard]);

  // Statistics calculation for the current week
  const weekStats = useMemo(() => {
    if (!currentWeek || !currentDashboard) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completionRate: 0,
        completedSubjects: 0,
        pendingSubjectNames: [] as string[],
      };
    }

    let totalTasks = 0;
    let completedTasks = 0;
    let completedSubjects = 0;
    const pendingSubjectNames: string[] = [];

    currentDashboard.subjects.forEach((subj) => {
      const tasks = currentWeek.subjectTasks[subj.id] || [];
      const allDone = tasks.length > 0 && tasks.every((t) => t.completed);
      if (allDone) {
        completedSubjects++;
      } else {
        pendingSubjectNames.push(subj.name);
      }
      tasks.forEach((t) => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const pendingTasks = totalTasks - completedTasks;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      completedSubjects,
      pendingSubjectNames,
    };
  }, [currentWeek, currentDashboard]);

  // Sincronizar en tiempo real el Widget de Android con las tareas que hacen falta
  useEffect(() => {
    if (!currentWeek || !currentDashboard) return;

    let nextPending = '¡Al día! No tienes pendientes 🎉';
    if (weekStats.pendingTasks > 0) {
      for (const subj of currentDashboard.subjects) {
        const tasks = currentWeek.subjectTasks[subj.id] || [];
        const pending = tasks.find((t) => !t.completed);
        if (pending) {
          nextPending = `${subj.name} • ${pending.name}`;
          break;
        }
      }
    }

    syncTaskWidget({
      semana: currentWeek.weekNumber,
      pendientes: weekStats.pendingTasks,
      completadas: weekStats.completedTasks,
      total: weekStats.totalTasks,
      materias: currentDashboard.subjects.length,
      porcentaje: weekStats.completionRate,
      proximaTarea: nextPending,
    });
  }, [currentWeek, currentDashboard, weekStats]);

  // Filter subjects: automatically hides a card when all of its tasks are completed!
  const visibleSubjects = useMemo(() => {
    if (!currentDashboard || !currentWeek) return [];
    if (showCompletedSubjects) return currentDashboard.subjects;

    return currentDashboard.subjects.filter((subj) => {
      const tasks = currentWeek.subjectTasks[subj.id] || [];
      const isDone = tasks.length > 0 && tasks.every((t) => t.completed);
      return !isDone;
    });
  }, [currentDashboard, currentWeek, showCompletedSubjects]);

  // Check if all tasks in active week are completed for Victory Screen
  const allWeekDone = weekStats.totalTasks > 0 && weekStats.pendingTasks === 0;

  // Periodic Notification Engine & Heartbeat Check (Robust across Android & Web)
  useEffect(() => {
    requestNotificationPermission();

    // Sync Android native alarms for background execution immediately
    syncAndroidBackgroundSchedule(
      weekStats.pendingSubjectNames,
      weekStats.pendingTasks
    );

    const checkReminderCondition = () => {
      const settings = getNotificationSettings();
      if (!settings.enabled) return;

      const intervalMs = Math.max(1, settings.intervalMinutes) * 60 * 1000;
      const lastSent = settings.lastSent || 0;
      const now = Date.now();

      // If time elapsed is greater than or equal to configured interval, trigger!
      if (now - lastSent >= intervalMs) {
        checkAndTriggerPendingReminder(
          weekStats.pendingSubjectNames,
          weekStats.pendingTasks
        );
      }
    };

    // Run check on mount
    checkReminderCondition();

    // High-precision heartbeat every 10 seconds (never gets wiped out by task re-renders!)
    const heartbeatTimer = setInterval(checkReminderCondition, 10000);

    // Check immediately when returning to tab / app from lockscreen or background
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkReminderCondition();
      }
    };

    // React immediately when user changes frequency or toggles settings in modal
    const handleSettingsChanged = () => {
      checkReminderCondition();
      syncAndroidBackgroundSchedule(
        weekStats.pendingSubjectNames,
        weekStats.pendingTasks
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener(NOTIF_SETTINGS_EVENT, handleSettingsChanged);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener(NOTIF_SETTINGS_EVENT, handleSettingsChanged);
    };
  }, [weekStats.pendingSubjectNames, weekStats.pendingTasks]);

  // Test notification function
  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      setToastMessage('⚠️ Por favor permite las notificaciones en tu dispositivo/navegador.');
      return;
    }

    checkAndTriggerPendingReminder(
      weekStats.pendingSubjectNames,
      weekStats.pendingTasks,
      true
    );
    setToastMessage('🔔 ¡Notificación de prueba enviada con éxito!');
  };

  // Save new start date
  const handleSaveStartDate = (newDateISO: string, formattedStr: string) => {
    if (!currentDashboard) return;

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        return {
          ...d,
          startDateISO: newDateISO,
          startDate: formattedStr,
        };
      })
    );

    setShowStartDateModal(false);
    const newDays = calculateDaysElapsed(formattedStr, newDateISO);
    setToastMessage(`Fecha de inicio actualizada: ${formattedStr} (${newDays} días transcurridos).`);
  };

  // Ejecución de acciones ordenadas por el Copiloto IA
  const handleExecuteAgentAction = (action: any) => {
    if (!action || typeof action !== 'object' || !currentDashboard || !currentWeek) return;

    if (action.action === 'create_task') {
      const subjectName = (action.subjectName || '').toLowerCase();
      const targetSubj =
        currentDashboard.subjects.find(
          (s) =>
            s.name.toLowerCase().includes(subjectName) ||
            subjectName.includes(s.name.toLowerCase())
        ) || currentDashboard.subjects[0];

      if (!targetSubj) return;

      const newTaskName = action.taskName || 'Nueva actividad académica';
      const newId = `task-${currentWeek.weekNumber}-${targetSubj.id}-${Date.now()}`;

      const newTask: TaskItem = {
        id: newId,
        name: newTaskName,
        completed: false,
        deadlineISO: action.deadline || undefined,
      };

      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== currentDashboard.id) return d;
          return {
            ...d,
            weeks: d.weeks.map((w) => {
              if (w.id !== currentWeek.id) return w;
              const prevTasks = w.subjectTasks[targetSubj.id] || [];
              return {
                ...w,
                subjectTasks: {
                  ...w.subjectTasks,
                  [targetSubj.id]: [...prevTasks, newTask],
                },
              };
            }),
          };
        })
      );
      setToastMessage(`🤖 Tarea creada por el Copiloto IA: "${newTaskName}" en ${targetSubj.name}`);
    } else if (action.action === 'complete_task') {
      const taskName = (action.taskName || '').toLowerCase();
      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== currentDashboard.id) return d;
          return {
            ...d,
            weeks: d.weeks.map((w) => {
              if (w.id !== currentWeek.id) return w;
              const newSubjTasks = { ...w.subjectTasks };
              Object.keys(newSubjTasks).forEach((sId) => {
                newSubjTasks[sId] = newSubjTasks[sId].map((t) => {
                  if (t.name.toLowerCase().includes(taskName)) {
                    return { ...t, completed: true };
                  }
                  return t;
                });
              });
              return { ...w, subjectTasks: newSubjTasks };
            }),
          };
        })
      );
      setToastMessage(`✓ Tarea marcada como entregada por el Copiloto IA`);
    } else if (action.action === 'open_pomodoro') {
      setShowAIAssistant(false);
      setShowPomodoroModal(true);
      setToastMessage('⏱️ Temporizador Pomodoro abierto por KALI');
    } else if (action.action === 'open_grades') {
      setShowAIAssistant(false);
      setShowGradesModal(true);
      setToastMessage('📊 Calculadora de Notas UEES abierta por KALI');
    } else if (action.action === 'open_schedule') {
      setShowAIAssistant(false);
      setShowScheduleModal(true);
      setToastMessage('📅 Horario de Clases abierto por KALI');
    } else if (action.action === 'open_links') {
      setShowAIAssistant(false);
      setShowLinksModal(true);
      setToastMessage('🔗 Enlaces Universitarios abiertos por KALI');
    }
  };

  // Toggle task checkbox
  const handleToggleTask = (subjectId: string, taskId: string) => {
    if (!currentDashboard || !currentWeek) return;

    const currentTasksForHaptic = currentWeek.subjectTasks[subjectId] || [];
    const taskTarget = currentTasksForHaptic.find((t) => t.id === taskId);
    if (taskTarget) {
      triggerHaptic(!taskTarget.completed ? 'success' : 'light');
    }

    setDashboards((prev) =>
      prev.map((dash) => {
        if (dash.id !== currentDashboard.id) return dash;

        const updatedWeeks = dash.weeks.map((week) => {
          if (week.id !== currentWeek.id) return week;

          const currentTasks = week.subjectTasks[subjectId] || [];
          const updatedTasks = currentTasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );

          const newSubjectTasks = {
            ...week.subjectTasks,
            [subjectId]: updatedTasks,
          };

          let allTasksCount = 0;
          let doneTasksCount = 0;
          Object.values(newSubjectTasks).forEach((tasks) => {
            tasks.forEach((t) => {
              allTasksCount++;
              if (t.completed) doneTasksCount++;
            });
          });

          const newStatus: 'COMPLETADO' | 'EN PROCESO' | 'PENDIENTE' =
            allTasksCount > 0 && doneTasksCount === allTasksCount
              ? 'COMPLETADO'
              : doneTasksCount > 0
                ? 'EN PROCESO'
                : 'PENDIENTE';

          return {
            ...week,
            subjectTasks: newSubjectTasks,
            status: newStatus,
          };
        });

        const now = new Date();
        const formattedDate = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

        return {
          ...dash,
          weeks: updatedWeeks,
          lastUpdated: formattedDate,
        };
      })
    );
  };

  // Save task note and deadline
  const handleSaveTaskNote = (noteText: string, deadlineISO?: string) => {
    if (!activeNoteTarget || !currentDashboard || !currentWeek) return;

    const { subjectId, taskId } = activeNoteTarget;

    setDashboards((prev) =>
      prev.map((dash) => {
        if (dash.id !== currentDashboard.id) return dash;

        const updatedWeeks = dash.weeks.map((week) => {
          if (week.id !== currentWeek.id) return week;

          const currentTasks = week.subjectTasks[subjectId] || [];
          const updatedTasks = currentTasks.map((t) =>
            t.id === taskId
              ? {
                ...t,
                note: noteText || undefined,
                deadlineISO: deadlineISO || undefined,
              }
              : t
          );

          return {
            ...week,
            subjectTasks: {
              ...week.subjectTasks,
              [subjectId]: updatedTasks,
            },
          };
        });

        return { ...dash, weeks: updatedWeeks };
      })
    );

    setActiveNoteTarget(null);
    setToastMessage('Detalles de la tarea actualizados.');
  };

  // Bloque Tareas Handlers (📌 ACTIVIDADES A CUMPLIR)
  const handleToggleBloqueTarea = (tareaId: string) => {
    if (!currentDashboard || !currentWeek) return;

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        const wks = d.weeks.map((w) => {
          if (w.id !== currentWeek.id) return w;
          const currentList = w.bloqueTareas || [];
          const updated = currentList.map((t) =>
            t.id === tareaId ? { ...t, completada: !t.completada } : t
          );
          return { ...w, bloqueTareas: updated };
        });
        return { ...d, weeks: wks };
      })
    );
  };

  const handleDeleteBloqueTarea = (tareaId: string) => {
    if (!currentDashboard || !currentWeek) return;

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        const wks = d.weeks.map((w) => {
          if (w.id !== currentWeek.id) return w;
          const currentList = w.bloqueTareas || [];
          return { ...w, bloqueTareas: currentList.filter((t) => t.id !== tareaId) };
        });
        return { ...d, weeks: wks };
      })
    );
  };

  const handleAddBloqueTarea = (texto: string) => {
    if (!currentDashboard || !currentWeek) return;

    const newItem = {
      id: `bt-${Date.now()}`,
      texto,
      completada: false,
    };

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        const wks = d.weeks.map((w) => {
          if (w.id !== currentWeek.id) return w;
          return { ...w, bloqueTareas: [...(w.bloqueTareas || []), newItem] };
        });
        return { ...d, weeks: wks };
      })
    );

    setToastMessage(`Tarea "${texto}" agregada a pendientes.`);
  };

  // Select week with smooth sync animation & check for Parcial Splash
  const handleSelectWeek = (weekId: string) => {
    if (!currentDashboard) return;
    const targetWeek = currentDashboard.weeks.find((w) => w.id === weekId);

    setIsSyncing(true);
    setTimeout(() => {
      setDashboards((prev) =>
        prev.map((dash) =>
          dash.id === currentDashboard.id ? { ...dash, activeWeekId: weekId } : dash
        )
      );
      setIsSyncing(false);

      if (targetWeek && esSemanaDeParciales(targetWeek.weekNumber)) {
        setShowParcialSplash(true);
      }
    }, 250);
  };

  // Add week to current dashboard (Applies class activities or partials depending on week number)
  const handleAddWeek = () => {
    if (!currentDashboard) return;

    const nextNum = currentDashboard.weeks.length + 1;
    const isParcial = esSemanaDeParciales(nextNum);
    const taskNames = isParcial ? ACTIVIDADES_PARCIALES : ACTIVIDADES_CLASES;

    const newSubjectTasks: Record<string, TaskItem[]> = {};

    currentDashboard.subjects.forEach((subj) => {
      newSubjectTasks[subj.id] = taskNames.map((tName, i) => ({
        id: `task-${nextNum}-${subj.id}-${i}`,
        name: tName,
        completed: false,
      }));
    });

    const calculatedDateRange = formatOrResolveWeekDateRange(nextNum, currentDashboard.startDateISO);

    const newWeek: WeekItem = {
      id: `week-${nextNum}-${Date.now()}`,
      weekNumber: nextNum,
      dateRange: calculatedDateRange,
      status: 'PENDIENTE',
      subjectTasks: newSubjectTasks,
      bloqueTareas: [],
    };

    setDashboards((prev) =>
      prev.map((dash) => {
        if (dash.id !== currentDashboard.id) return dash;
        return {
          ...dash,
          weeks: [...dash.weeks, newWeek],
          activeWeekId: newWeek.id,
        };
      })
    );

    if (isParcial) {
      setShowParcialSplash(true);
    }

    setToastMessage(`Semana ${nextNum} ${isParcial ? '🎯 (PARCIALES)' : ''} agregada.`);
  };

  // Delete Dashboard Handler
  const handleDeleteDashboard = (dashId: string) => {
    if (dashboards.length <= 1) {
      setToastMessage('⚠️ Debes tener al menos un dashboard activo.');
      return;
    }
    setPendingDeleteDashId(dashId);
  };

  const confirmDeleteDashboard = () => {
    if (!pendingDeleteDashId) return;

    const remaining = dashboards.filter((d) => d.id !== pendingDeleteDashId);
    setDashboards(remaining);

    if (activeDashId === pendingDeleteDashId) {
      setActiveDashId(remaining[0]?.id || '');
    }

    setPendingDeleteDashId(null);
    setToastMessage('Dashboard eliminado correctamente.');
  };

  // Delete Week Handler
  const handleDeleteWeek = (weekId: string) => {
    if (!currentDashboard) return;
    if (currentDashboard.weeks.length <= 1) {
      setToastMessage('⚠️ Debes tener al menos una semana en el dashboard.');
      return;
    }
    setPendingDeleteWeekId(weekId);
  };

  const confirmDeleteWeek = () => {
    if (!pendingDeleteWeekId || !currentDashboard) return;

    const remainingWeeks = currentDashboard.weeks.filter((w) => w.id !== pendingDeleteWeekId);
    const newActiveWeekId =
      currentDashboard.activeWeekId === pendingDeleteWeekId
        ? remainingWeeks[remainingWeeks.length - 1]?.id || ''
        : currentDashboard.activeWeekId;

    setDashboards((prev) =>
      prev.map((d) =>
        d.id === currentDashboard.id
          ? { ...d, weeks: remainingWeeks, activeWeekId: newActiveWeekId }
          : d
      )
    );

    setPendingDeleteWeekId(null);
    setToastMessage('Semana eliminada correctamente.');
  };

  // Create new Dashboard from Wizard
  const handleFinishWizard = (newDash: Dashboard) => {
    setDashboards((prev) => [newDash, ...prev]);
    setActiveDashId(newDash.id);
    setShowWizard(false);
    setToastMessage(`Dashboard "${newDash.name}" creado con éxito.`);
  };

  // Upload (Push to cloud Supabase + Local backup)
  const handleConfirmUpload = async () => {
    setShowUploadConfirm(false);
    setIsSyncing(true);

    try {
      // Collect all local modules
      const localLinks = JSON.parse(localStorage.getItem('academic_university_links_v1') || 'null');
      const localGrades = JSON.parse(localStorage.getItem('academic_grades_tracker_v1') || 'null');
      const localSchedule = JSON.parse(localStorage.getItem('academic_class_schedule_v1') || 'null');
      const localNotifs = JSON.parse(localStorage.getItem('academic_notifications_settings_v1') || 'null');

      const success1 = await cloudSave('coleccion_dashboards', dashboards, {
        universityLinks: localLinks,
        gradesTracker: localGrades,
        classSchedule: localSchedule,
        notificationSettings: localNotifs,
      });

      if (currentDashboard) {
        await cloudSave('dashboard_uees', currentDashboard, {
          universityLinks: localLinks,
          gradesTracker: localGrades,
          classSchedule: localSchedule,
          notificationSettings: localNotifs,
        });
        localStorage.setItem(`cloud_backup_${currentDashboard.accessCode}`, JSON.stringify(currentDashboard));
      }

      const now = new Date();
      const formattedDate = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

      setCloudStatus(`🟢 RECIENTE (${formattedDate})`);
      setIsSyncing(false);
      setToastMessage(success1 ? '¡Información completa (Tareas, Enlaces, Promedios, Horario) subida con éxito!' : '¡Información guardada localmente!');
    } catch {
      setIsSyncing(false);
      setToastMessage('¡Información guardada localmente!');
    }
  };

  // Download (Pull from cloud Supabase + Local backup)
  // Si el usuario ya está autenticado con sus credenciales, descarga directamente sin volver a pedir clave
  const handleTriggerCloudDownload = () => {
    if (isAuthenticated) {
      setPendingDownloadCode('oo');
      handleExecuteDownload('oo');
    } else {
      setShowDownloadPrompt(true);
    }
  };

  const handlePromptDownload = (code: string) => {
    if (!code.trim()) return;
    const finalCode = code.trim().toUpperCase();
    setPendingDownloadCode(finalCode);
    setShowDownloadPrompt(false);
    handleExecuteDownload(finalCode);
  };

  const handleConfirmDownload = () => {
    handleExecuteDownload();
  };

  const handleExecuteDownload = async (codeOverride?: string) => {
    setShowDownloadConfirm(false);
    setIsSyncing(true);

    try {
      const codeUpper = (codeOverride || pendingDownloadCode || 'oo').trim().toUpperCase();
      const currentCodeUpper = (currentDashboard?.accessCode || 'oo').trim().toUpperCase();
      if (
        codeUpper === 'OO' ||
        codeUpper === '00' ||
        codeUpper === 'UEES' ||
        codeUpper === 'UEES-2026' ||
        codeUpper === currentCodeUpper
      ) {
        let cloudData = await cloudLoad('coleccion_dashboards');
        if (!cloudData || !cloudData.data) {
          cloudData = await cloudLoad('dashboard_uees');
        }
        if (!cloudData || !cloudData.data) {
          cloudData = await cloudLoad('dashboards');
        }

        if (cloudData) {
          // Restore university links (portal, moodle, etc.)
          if (cloudData.universityLinks && Array.isArray(cloudData.universityLinks)) {
            localStorage.setItem('academic_university_links_v1', JSON.stringify(cloudData.universityLinks));
          }
          // Restore grades tracker (promedios, parciales, ponderaciones)
          if (cloudData.gradesTracker && typeof cloudData.gradesTracker === 'object') {
            localStorage.setItem('academic_grades_tracker_v1', JSON.stringify(cloudData.gradesTracker));
          }
          // Restore class schedule (horario de clases)
          if (cloudData.classSchedule && Array.isArray(cloudData.classSchedule)) {
            localStorage.setItem('academic_class_schedule_v1', JSON.stringify(cloudData.classSchedule));
          }
          // Restore notification preferences
          if (cloudData.notificationSettings && typeof cloudData.notificationSettings === 'object') {
            localStorage.setItem('academic_notifications_settings_v1', JSON.stringify(cloudData.notificationSettings));
          }

          // Trigger live sync events for all modal components
          window.dispatchEvent(new Event('academic_data_synced'));
          window.dispatchEvent(new Event('storage'));

          const raw = cloudData.data;

          const sanitizeDashboard = (dashItem: Dashboard): Dashboard => {
            const isUeesCiclo2 =
              dashItem.name?.includes('UEES') ||
              dashItem.id === 'dash-uees' ||
              dashItem.weeks?.some(
                (w) =>
                  w.dateRange?.includes('jul') ||
                  w.dateRange?.includes('ago') ||
                  w.dateRange?.includes('sep') ||
                  w.dateRange?.includes('oct')
              );
            const needsStartDateFix =
              isUeesCiclo2 &&
              (dashItem.startDateISO === '2026-01-19' || dashItem.startDate?.includes('19 ENE'));

            const resolvedStartDateISO = needsStartDateFix ? '2026-07-06' : dashItem.startDateISO || '2026-07-06';
            const resolvedStartDate = needsStartDateFix ? '06 JUL 2026' : dashItem.startDate || '06 JUL 2026';

            return {
              ...dashItem,
              startDateISO: resolvedStartDateISO,
              startDate: resolvedStartDate,
              accessCode: !dashItem.accessCode || dashItem.accessCode === 'UEES-2026' ? 'oo' : dashItem.accessCode,
              weeks: Array.isArray(dashItem.weeks)
                ? dashItem.weeks.map((w: WeekItem) => {
                  // Sanitize task notes typo if present
                  const cleanSubjectTasks: Record<string, TaskItem[]> = {};
                  Object.entries(w.subjectTasks || {}).forEach(([sId, tList]) => {
                    cleanSubjectTasks[sId] = tList.map((t) => ({
                      ...t,
                      note: t.note?.replace(/VER COOSAS DE EL PROYECTO/gi, 'VER COSAS DEL PROYECTO').replace(/VER COOSAS DEL PROYECTO/gi, 'VER COSAS DEL PROYECTO'),
                    }));
                  });

                  return {
                    ...w,
                    dateRange: formatOrResolveWeekDateRange(
                      w.weekNumber,
                      resolvedStartDateISO,
                      w.dateRange
                    ),
                    subjectTasks: cleanSubjectTasks,
                  };
                })
                : dashItem.weeks,
            };
          };

          // Case 1: Array of dashboards
          if (Array.isArray(raw) && raw.length > 0) {
            const sanitizedList = raw.map(sanitizeDashboard);
            setDashboards(sanitizedList);
            setActiveDashId(sanitizedList[0].id);
            setIsSyncing(false);
            setToastMessage('¡Información completa descargada y fechas sincronizadas a Octubre con éxito!');
            return;
          }
          // Case 2: Single dashboard object with weeks
          if (raw && typeof raw === 'object' && Array.isArray(raw.weeks)) {
            const singleDash = sanitizeDashboard({
              id: raw.id || 'dash-uees',
              name: raw.name || 'UEES',
              accessCode: raw.accessCode || 'oo',
              startDate: raw.startDate || '06 JUL 2026',
              startDateISO: raw.startDateISO || '2026-07-06',
              lastUpdated: raw.lastUpdated || new Date().toLocaleString(),
              subjects: raw.subjects || INITIAL_DASHBOARDS[0].subjects,
              defaultTaskNames: raw.defaultTaskNames || INITIAL_DASHBOARDS[0].defaultTaskNames,
              weeks: raw.weeks,
              activeWeekId: raw.activeWeekId || raw.weeks[raw.weeks.length - 1]?.id || 'week-14',
            });
            setDashboards([singleDash]);
            setActiveDashId(singleDash.id);
            setIsSyncing(false);
            setToastMessage('¡Información completa descargada y fechas sincronizadas a Octubre con éxito!');
            return;
          }
        }
      }

      const backupKey = `cloud_backup_${pendingDownloadCode}`;
      const backup = localStorage.getItem(backupKey);

      if (backup) {
        try {
          const loaded = JSON.parse(backup);
          if (loaded && loaded.id && Array.isArray(loaded.weeks)) {
            setDashboards((prev) => [loaded, ...prev.filter((d) => d.id !== loaded.id)]);
            setActiveDashId(loaded.id);
            setIsSyncing(false);
            setToastMessage('¡Información descargada con éxito!');
            return;
          }
        } catch {
          // Si el respaldo local está corrupto, usar INITIAL_DASHBOARDS como fallback seguro
        }
      }

      const uees = INITIAL_DASHBOARDS[0];
      setDashboards((prev) => [uees, ...prev.filter((d) => d.id !== uees.id)]);
      setActiveDashId(uees.id);
      setIsSyncing(false);
      setToastMessage('¡Información descargada con éxito!');
    } catch {
      setIsSyncing(false);
      setToastMessage('Descarga completada.');
    }
  };

  // Reset all
  const handleResetAll = () => {
    setShowResetConfirm(false);
    localStorage.removeItem(STORAGE_KEY);
    setDashboards(INITIAL_DASHBOARDS);
    setActiveDashId(INITIAL_DASHBOARDS[0].id);
    setToastMessage('Datos restablecidos correctamente.');
  };

  // Reset Current Week Tasks (Uncheck all)
  const handleResetCurrentWeekTasks = () => {
    if (!currentDashboard || !currentWeek) return;

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        const wks = d.weeks.map((w) => {
          if (w.id !== currentWeek.id) return w;
          const resetTasks: Record<string, TaskItem[]> = {};
          Object.entries(w.subjectTasks).forEach(([sId, tList]) => {
            resetTasks[sId] = tList.map((t) => ({ ...t, completed: false }));
          });
          return { ...w, subjectTasks: resetTasks, status: 'EN PROCESO' as const };
        });
        return { ...d, weeks: wks };
      })
    );

    setToastMessage('Tareas de la semana reiniciadas.');
  };

  // Copy share link
  const handleCopyLink = () => {
    const code = currentDashboard?.accessCode || 'oo';
    navigator.clipboard?.writeText(code);
    setToastMessage(`Código [${code}] copiado al portapapeles.`);
  };

  // Update quick note
  const handleUpdateNote = (newNote: string) => {
    setShowEditNotePrompt(false);
    if (!currentDashboard) return;
    setDashboards((prev) =>
      prev.map((d) => (d.id === currentDashboard.id ? { ...d, quickNote: newNote } : d))
    );
    setToastMessage('Nota actualizada.');
  };

  // Export Dashboards as JSON file (Complete backup including Links, Grades and Schedule)
  const handleExportJSON = () => {
    try {
      const fullBackup = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        dashboards,
        universityLinks: JSON.parse(localStorage.getItem('academic_university_links_v1') || 'null'),
        gradesTracker: JSON.parse(localStorage.getItem('academic_grades_tracker_v1') || 'null'),
        classSchedule: JSON.parse(localStorage.getItem('academic_class_schedule_v1') || 'null'),
        notificationSettings: JSON.parse(localStorage.getItem('academic_notifications_settings_v1') || 'null'),
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `dashboard-completo-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setToastMessage('💾 ¡Respaldo completo (Tareas, Enlaces, Promedios, Horario) descargado con éxito!');
    } catch {
      setToastMessage('⚠️ Error al exportar archivo.');
    }
  };

  // Import Dashboards from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let loadedDashboards: Dashboard[] | null = null;
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].weeks) {
          // Direct array format
          loadedDashboards = parsed;
        } else if (parsed && Array.isArray(parsed.dashboards)) {
          // Full bundle format
          loadedDashboards = parsed.dashboards;
          if (parsed.universityLinks) {
            localStorage.setItem('academic_university_links_v1', JSON.stringify(parsed.universityLinks));
          }
          if (parsed.gradesTracker) {
            localStorage.setItem('academic_grades_tracker_v1', JSON.stringify(parsed.gradesTracker));
          }
          if (parsed.classSchedule) {
            localStorage.setItem('academic_class_schedule_v1', JSON.stringify(parsed.classSchedule));
          }
          if (parsed.notificationSettings) {
            localStorage.setItem('academic_notifications_settings_v1', JSON.stringify(parsed.notificationSettings));
          }
          window.dispatchEvent(new Event('academic_data_synced'));
          window.dispatchEvent(new Event('storage'));
        }

        if (loadedDashboards) {
          setDashboards(loadedDashboards);
          setActiveDashId(loadedDashboards[0].id);
          setToastMessage('✅ ¡Respaldo completo importado y sincronizado con éxito!');
        } else {
          setToastMessage('⚠️ El archivo JSON no tiene un formato válido.');
        }
      } catch {
        setToastMessage('⚠️ Error al leer el archivo JSON.');
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Rename subject
  const handleRenameSubject = (subjectId: string, newName: string) => {
    if (!newName.trim() || !currentDashboard) return;

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        return {
          ...d,
          subjects: d.subjects.map((s) =>
            s.id === subjectId ? { ...s, name: newName.trim().toUpperCase() } : s
          ),
        };
      })
    );

    setToastMessage('Nombre de materia actualizado.');
  };

  // Delete subject
  const handleDeleteSubject = (subjectId: string) => {
    if (!currentDashboard) return;
    if (currentDashboard.subjects.length <= 1) {
      setToastMessage('⚠️ Debes mantener al menos una materia.');
      return;
    }

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== currentDashboard.id) return d;
        const updatedWeeks = d.weeks.map((w) => {
          const updatedTasks = { ...w.subjectTasks };
          delete updatedTasks[subjectId];
          return {
            ...w,
            subjectTasks: updatedTasks,
          };
        });

        return {
          ...d,
          subjects: d.subjects.filter((s) => s.id !== subjectId),
          weeks: updatedWeeks,
        };
      })
    );

    setToastMessage('Materia eliminada del dashboard.');
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      </>
    );
  }

  if (!currentDashboard || !currentWeek) {
    return <div className="p-8 text-center text-white">Cargando dashboard...</div>;
  }



  const displayDateRange = formatOrResolveWeekDateRange(
    currentWeek.weekNumber,
    currentDashboard?.startDateISO,
    currentWeek.dateRange
  );
  const semesterProgressPct = Math.min(100, Math.round((daysTranscurridos / (16 * 7)) * 100));

  // Promedio General de todas las materias del ciclo (para Speedometer Gauge)
  const overallUeesAvg = useMemo(() => {
    if (!currentDashboard.subjects.length) return '0.0';
    let sum = 0;
    let count = 0;
    for (const s of currentDashboard.subjects) {
      const data = findGradeDataForSubject(s.id, s.name, gradesTracker);
      const calc = calculateUeesGrade(data);
      const avg = parseFloat(calc.ueesAverageFormatted);
      if (!isNaN(avg)) {
        sum += avg;
        count++;
      }
    }
    return count > 0 ? (sum / count).toFixed(1) : '0.0';
  }, [currentDashboard.subjects, gradesTracker]);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row relative transition-colors duration-200 font-sans select-none overflow-x-hidden ${
      isDark ? 'bg-canvas-dark text-zinc-100' : 'bg-canvas-light text-zinc-900'
    }`}>
      {/* Toast Alert */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Modal de Nota Rápida del Ciclo */}
      <AnimatePresence>
        {showQuickNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
            onClick={() => setShowQuickNoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 transition-all ${
                isDark ? 'bg-[#131417] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-white/10' : 'border-zinc-200/80'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-white/10 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                  }`}>
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}>
                    Nota Rápida del Ciclo
                  </h3>
                </div>
                <button
                  onClick={() => setShowQuickNoteModal(false)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className={`text-xs block mb-1.5 ${
                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                }`}>
                  Escribe una nota, apunte importante o recordatorio para tener a la mano:
                </label>
                <textarea
                  value={quickNoteDraft}
                  onChange={(e) => setQuickNoteDraft(e.target.value)}
                  placeholder="Ej: Recordar entregar el proyecto final el 24 de oct..."
                  rows={4}
                  className={`w-full p-3.5 rounded-2xl border text-xs focus:outline-none resize-none leading-relaxed transition-all ${
                    isDark ? 'bg-white/5 border-white/10 text-white focus:border-white/30' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowQuickNoteModal(false)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const text = quickNoteDraft.trim();
                    setDashboards((prev) =>
                      prev.map((d) => (d.id === currentDashboard.id ? { ...d, quickNote: text } : d))
                    );
                    setShowQuickNoteModal(false);
                    setToastMessage('Nota rápida actualizada con éxito ✨');
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isDark ? 'bg-white !text-black text-black hover:bg-zinc-200' : 'bg-black !text-white text-white hover:bg-zinc-800'
                  }`}
                >
                  Guardar Nota
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parcial Splash Modal */}
      <ParcialSplashModal
        isOpen={showParcialSplash}
        weekNumber={currentWeek.weekNumber}
        onClose={() => setShowParcialSplash(false)}
      />

      {/* Syncing Overlay Indicator */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs"
          >
            <div className="relative flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span className="mt-4 text-xs font-bold tracking-widest text-white uppercase font-mono">
                SINCRONIZANDO...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Layout with Sidebar (Left) and Scrollable Dashboard (Right) - Image 2 Match */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 w-full overflow-hidden">
        {/* Desktop Sidebar (Left side, permanent sticky) */}
        <SidebarNav
          currentView={currentView}
          onSwitchView={(view: 'dashboard' | 'schedule' | 'cloud') => {
            setCurrentView(view);
            if (view === 'schedule') {
              setShowScheduleModal(false);
            }
          }}
          subjects={currentDashboard.subjects}
          totalWeeksCount={currentDashboard.weeks.length}
          activeWeekNumber={currentWeek.weekNumber}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={(id) => {
            setSelectedSubjectId(id);
            setCurrentView('dashboard');
          }}
          loggedUser={loggedUser}
          onScrollToSubject={scrollToSubject}
          onOpenWeeks={() => setShowDrawer(true)}
          onOpenThemes={() => setShowThemeModal(true)}
          onOpenPomodoro={() => setShowPomodoroModal(true)}
          onOpenCalculator={() => setShowGradesModal(true)}
          onOpenPensumWidget={() => setShowPensumModal(true)}
          onOpenAIAssistant={() => setShowAIAssistant(true)}
          onTriggerCelebration={handleTriggerCelebration}
          onLogout={handleLogout}
          isDark={isDark}
          themeMode={themeMode}
          onCycleTheme={cycleThemeMode}
        />

        {/* Mobile Sidebar Overlay Drawer */}
        <AnimatePresence>
          {showMobileSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm md:hidden flex"
              onClick={() => setShowMobileSidebar(false)}
            >
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`w-72 h-full ${isDark ? 'bg-[#0c0d10] border-r border-white/10' : 'bg-white border-r border-zinc-200'} flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 overflow-y-auto">
                  <SidebarNav
                    currentView={currentView}
                    isDark={isDark}
                    themeMode={themeMode}
                    onCycleTheme={cycleThemeMode}
                    onSwitchView={(view: 'dashboard' | 'schedule' | 'cloud') => {
                      setCurrentView(view);
                      setShowMobileSidebar(false);
                    }}
                    subjects={currentDashboard.subjects}
                    totalWeeksCount={currentDashboard.weeks.length}
                    activeWeekNumber={currentWeek.weekNumber}
                    selectedSubjectId={selectedSubjectId}
                    onSelectSubject={(id) => {
                      setSelectedSubjectId(id);
                      setCurrentView('dashboard');
                      setShowMobileSidebar(false);
                    }}
                    loggedUser={loggedUser}
                    onScrollToSubject={(id: string) => {
                      scrollToSubject(id);
                      setShowMobileSidebar(false);
                    }}
                    onOpenWeeks={() => {
                      setShowDrawer(true);
                      setShowMobileSidebar(false);
                    }}
                    onOpenThemes={() => {
                      setShowThemeModal(true);
                      setShowMobileSidebar(false);
                    }}
                    onOpenPomodoro={() => {
                      setShowPomodoroModal(true);
                      setShowMobileSidebar(false);
                    }}
                    onOpenCalculator={() => {
                      setShowGradesModal(true);
                      setShowMobileSidebar(false);
                    }}
                    onOpenPensumWidget={() => {
                      setShowPensumModal(true);
                      setShowMobileSidebar(false);
                    }}
                    onOpenAIAssistant={() => {
                      setShowAIAssistant(true);
                      setShowMobileSidebar(false);
                    }}
                    onTriggerCelebration={handleTriggerCelebration}
                    onLogout={handleLogout}
                    isMobileDrawer={true}
                    onCloseMobileDrawer={() => setShowMobileSidebar(false)}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area (Right side, scrollable) con soporte Edge-to-Edge puro y espacio inferior para FAB */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen px-4 md:px-8 py-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),5.5rem)]">
          {/* Top Header Bar matching Neo-Fintech / Carbal Minimalist Style */}
          <header className={`flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b transition-colors ${
            isDark ? 'border-white/5' : 'border-zinc-200/80'
          }`}>
            {/* Left: Mobile Menu + Dashboard Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className={`md:hidden p-2 rounded-2xl border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900 shadow-2xs'
                }`}
                title="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${
                  isDark ? 'bg-white !text-black text-black' : 'bg-black !text-white text-white'
                }`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h1 className={`text-sm sm:text-base font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}>
                    Dashboard Académico
                  </h1>
                  <p className={`text-[10px] font-mono -mt-0.5 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    UEES • Ciclo {currentDashboard.startDate || '2026'}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Desktop Pill Navigation (matching reference image tabs) */}
            <div className="hidden lg:flex items-center">
              <div className={`p-1 rounded-full border flex items-center gap-1 ${
                isDark ? 'neo-pill-container-dark' : 'neo-pill-container-light'
              }`}>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setSelectedSubjectId(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    currentView === 'dashboard' && !selectedSubjectId
                      ? isDark
                        ? 'bg-white !text-black text-black shadow-xs'
                        : 'bg-black !text-white text-white shadow-xs'
                      : isDark
                      ? 'text-zinc-300 hover:text-white'
                      : 'text-zinc-700 hover:text-black'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('schedule')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    currentView === 'schedule'
                      ? isDark
                        ? 'bg-white !text-black text-black shadow-xs'
                        : 'bg-black !text-white text-white shadow-xs'
                      : isDark
                      ? 'text-zinc-300 hover:text-white'
                      : 'text-zinc-700 hover:text-black'
                  }`}
                >
                  Horario
                </button>
                <button
                  onClick={() => setCurrentView('cloud')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    currentView === 'cloud'
                      ? isDark
                        ? 'bg-white !text-black text-black shadow-xs'
                        : 'bg-black !text-white text-white shadow-xs'
                      : isDark
                      ? 'text-zinc-300 hover:text-white'
                      : 'text-zinc-700 hover:text-black'
                  }`}
                >
                  Nube Sync
                </button>
                <button
                  onClick={() => setShowGradesModal(true)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Calculadora
                </button>
                <button
                  onClick={() => setShowPomodoroModal(true)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Pomodoro
                </button>
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>KALI IA</span>
                </button>
              </div>
            </div>

            {/* Right: Theme Mode Toggle + Notifications + Semanas */}
            <div className="flex items-center gap-2">
              {/* Theme Mode Toggle Pill Button with System Auto detection */}
              <button
                onClick={cycleThemeMode}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200'
                    : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-2xs'
                }`}
                title={`Tema actual: ${themeMode === 'system' ? 'Auto (Sistema)' : themeMode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}. Clic para cambiar.`}
              >
                {themeMode === 'system' ? (
                  <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                ) : isDark ? (
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className="text-[10px] font-mono font-bold sm:hidden">
                  {themeMode === 'system' ? 'AUTO' : themeMode === 'dark' ? 'DARK' : 'LIGHT'}
                </span>
                <span className="hidden sm:inline">
                  {themeMode === 'system'
                    ? `Auto (${isDark ? 'Oscuro' : 'Claro'})`
                    : themeMode === 'dark'
                    ? 'Oscuro'
                    : 'Claro'}
                </span>
              </button>

              {/* Pending Activities Badge */}
              <button
                onClick={() => setShowNotificationModal(true)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                    : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-2xs'
                }`}
                title="Ver recordatorios de materias pendientes"
              >
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <span>{weekStats.pendingTasks}</span>
                <span className="hidden sm:inline">Pendientes</span>
              </button>

              {/* Weeks Selector Button */}
              <button
                onClick={() => setShowDrawer(true)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isDark
                    ? 'bg-white !text-black text-black hover:bg-zinc-200'
                    : 'bg-black !text-white text-white hover:bg-zinc-800'
                }`}
                title="Seleccionar semana o dashboard"
              >
                <CalendarDays className={`w-3.5 h-3.5 stroke-[2.2] ${isDark ? '!text-black text-black' : '!text-white text-white'}`} />
                <span className="font-bold">Semanas</span>
              </button>
            </div>
          </header>

          {/* Hidden JSON file input for backup restoration */}
          <input
            type="file"
            ref={jsonInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          {/* Conditional View Rendering */}
          {currentView === 'dashboard' && (
            <div>
              {/* Contenido Superior General (Semana activa, 4 Métricas, Barra de Acciones y Notas) - Solo visible cuando NO hay una materia enfocada */}
              {!selectedSubjectId && (
                <>
                  {/* Dashboard Subheader & Week Indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        isDark ? 'text-white' : 'text-zinc-900'
                      }`}>
                        Dashboard
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-zinc-300'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                        }`}>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Semana {currentWeek.weekNumber} en curso</span>
                        </span>
                        {displayDateRange && (
                          <span className={`text-xs font-mono hidden sm:inline ${
                            isDark ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            • {displayDateRange}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDrawer(true)}
                        className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                            : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-2xs'
                        }`}
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Ver Semanas ({currentDashboard.weeks.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Métricas Principales (Grid 4 columnas matching Reference Image) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* 1. Actividades Pendientes (Hero Obsidian Card from image) */}
                    <div className="p-5 rounded-3xl neo-card-hero flex flex-col justify-between relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-200">Actividades Pendientes</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            weekStats.pendingTasks > 0
                              ? 'bg-white/10 text-zinc-100 border-white/20'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {weekStats.pendingTasks > 0 ? `${weekStats.pendingTasks} Por entregar` : 'Al Día'}
                        </span>
                      </div>
                      
                      <div className="my-2 flex items-baseline justify-between">
                        <div className="text-4xl font-extrabold text-white tracking-tight">
                          {weekStats.pendingTasks}
                        </div>
                        {/* Mini vertical sparkline bars from reference image */}
                        <div className="flex items-end gap-1 h-7">
                          <span className={`w-1.5 rounded-full transition-all ${weekStats.pendingTasks >= 1 ? 'bg-white h-4' : 'bg-white/20 h-2'}`} />
                          <span className={`w-1.5 rounded-full transition-all ${weekStats.pendingTasks >= 2 ? 'bg-zinc-200 h-6' : 'bg-white/20 h-2'}`} />
                          <span className={`w-1.5 rounded-full transition-all ${weekStats.pendingTasks >= 3 ? 'bg-zinc-300 h-7' : 'bg-white/20 h-2'}`} />
                          <span className={`w-1.5 rounded-full transition-all ${weekStats.pendingTasks === 0 ? 'bg-emerald-400 h-5' : 'bg-white/20 h-2'}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-300 mt-2 pt-2 border-t border-white/10">
                        <span>Tareas activas</span>
                        <button
                          onClick={() => setShowDrawer(true)}
                          className="text-white hover:text-zinc-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Ver todas →
                        </button>
                      </div>
                    </div>

                    {/* 2. Inicio de Ciclo */}
                    <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                      isDark ? 'neo-card-dark' : 'neo-card-light'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>Inicio de Ciclo</span>
                        <button
                          onClick={() => setShowStartDateModal(true)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-white/10 text-zinc-200 border-white/15 hover:bg-white/20'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                          }`}
                          title="Cambiar fecha de inicio"
                        >
                          {currentDashboard.startDate || '06 Jul 2026'}
                        </button>
                      </div>
                      
                      <div className="my-2 flex items-baseline gap-2">
                        <span className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {daysTranscurridos}
                        </span>
                        <span className={`text-sm font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          Días
                        </span>
                      </div>

                      <div className={`text-xs mt-2 pt-2 border-t flex items-center justify-between ${
                        isDark ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-600'
                      }`}>
                        <span>Progreso ciclo</span>
                        <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {semesterProgressPct}%
                        </span>
                      </div>
                    </div>

                    {/* 3. Material de Estudio (with Circular Progress Ring from reference image) */}
                    <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                      isDark ? 'neo-card-dark' : 'neo-card-light'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>Material de Estudio</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDark
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          Listas
                        </span>
                      </div>
                      
                      <div className="my-2 flex items-center justify-between">
                        <div className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {weekStats.completedSubjects} / {currentDashboard.subjects.length}
                        </div>
                        {/* Circular Progress Ring matching the 75% ring from image */}
                        <div className="relative w-10 h-10 shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                              className={isDark ? "text-zinc-800" : "text-zinc-200"}
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-emerald-500 transition-all duration-700"
                              strokeDasharray={`${Math.round((weekStats.completedSubjects / Math.max(1, currentDashboard.subjects.length)) * 100)}, 100`}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono ${
                            isDark ? 'text-white' : 'text-zinc-900'
                          }`}>
                            {Math.round((weekStats.completedSubjects / Math.max(1, currentDashboard.subjects.length)) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className={`text-xs mt-2 pt-2 border-t flex items-center justify-between ${
                        isDark ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-600'
                      }`}>
                        <span>Actualizado hoy</span>
                        <button
                          onClick={() => setShowUploadConfirm(true)}
                          className={`font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                          title="Sincronizar a la nube"
                        >
                          <Cloud className="w-3 h-3" /> Sinc
                        </button>
                      </div>
                    </div>

                    {/* 4. Rendimiento & Promedio UEES (Speedometer Arc Gauge from Reference Image) */}
                    <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                      isDark ? 'neo-card-dark' : 'neo-card-light'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>Rendimiento UEES</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          parseFloat(overallUeesAvg) >= 6.0
                            ? isDark
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isDark
                              ? 'bg-white/10 text-zinc-200 border-white/20'
                              : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                        }`}>
                          {parseFloat(overallUeesAvg) >= 6.0 ? 'Aprobado' : 'En Curso'}
                        </span>
                      </div>

                      {/* Semicircular Speedometer Arc Gauge matching image */}
                      <div className="relative flex flex-col items-center justify-center my-1">
                        <svg className="w-28 h-14" viewBox="0 0 100 55">
                          <path
                            d="M 15 50 A 35 35 0 0 1 85 50"
                            fill="none"
                            stroke={isDark ? "#27272a" : "#e4e4e7"}
                            strokeWidth="7"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 15 50 A 35 35 0 0 1 85 50"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray="110"
                            strokeDashoffset={Math.max(0, 110 - (Math.min(10, parseFloat(overallUeesAvg)) / 10) * 110)}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute bottom-0 text-center">
                          <span className={`text-xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {overallUeesAvg}
                          </span>
                          <span className={`text-[9px] block -mt-1 font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            / 10.0 pts
                          </span>
                        </div>
                      </div>

                      <div className={`text-xs mt-2 pt-2 border-t flex items-center justify-between ${
                        isDark ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-600'
                      }`}>
                        <span>Prom. General</span>
                        <button
                          onClick={() => setShowGradesModal(true)}
                          className={`font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            isDark ? 'text-white hover:text-zinc-200' : 'text-zinc-900 hover:text-zinc-700'
                          }`}
                        >
                          Ver notas →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 mb-6 transition-all ${
                    isDark ? 'bg-[#131417] border-white/5 shadow-md' : 'bg-white border-zinc-200/80 shadow-2xs'
                  }`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setQuickNoteDraft(currentDashboard.quickNote || '');
                          setShowQuickNoteModal(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          isDark
                            ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                            : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-black'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar nota rápida...</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowUploadConfirm(true)}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                          isDark
                            ? 'bg-white !text-black text-black hover:bg-zinc-200'
                            : 'bg-black !text-white text-white hover:bg-zinc-800'
                        }`}
                      >
                        <Upload className={`w-3.5 h-3.5 stroke-[2.2] ${isDark ? '!text-black text-black' : '!text-white text-white'}`} />
                        <span className="font-bold">Subir Nube</span>
                      </button>

                      <button
                        onClick={handleTriggerCloudDownload}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-sm active:scale-95 ${
                          isDark
                            ? 'bg-zinc-900 hover:bg-zinc-800 border-white/20 text-white'
                            : 'bg-white hover:bg-zinc-100 border-zinc-300 text-black'
                        }`}
                        title="Descargar de la nube directamente"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500 stroke-[2.2]" />
                        <span className="font-bold">Descargar Nube</span>
                      </button>
                    </div>
                  </div>

                  {/* Banner de Nota Rápida si existe */}
                  {currentDashboard.quickNote && (
                    <div className={`p-3.5 mb-6 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      isDark ? 'bg-[#131417] border-white/10 text-zinc-300 shadow-md' : 'bg-white border-zinc-200 text-zinc-800 shadow-2xs'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base select-none shrink-0">📌</span>
                        <span className="font-semibold truncate">{currentDashboard.quickNote}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setQuickNoteDraft(currentDashboard.quickNote || '');
                            setShowQuickNoteModal(true);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            isDark ? 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setDashboards((prev) =>
                              prev.map((d) => (d.id === currentDashboard.id ? { ...d, quickNote: '' } : d))
                            );
                            setToastMessage('Nota rápida eliminada');
                          }}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                          title="Eliminar nota"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Función para renderizar tarjeta de materia */}
              {(() => {
                const renderSubjectCard = (subject: SubjectItem, sIdx: number, isSingleView: boolean = false) => {
                  const tasks = currentWeek.subjectTasks[subject.id] || [];
                  const isSubjectAllDone = tasks.length > 0 && tasks.every((t) => t.completed);
                  const subjectGradeData = findGradeDataForSubject(subject.id, subject.name, gradesTracker);
                  const ueesCalc = calculateUeesGrade(subjectGradeData);

                  const statusLabel = isSubjectAllDone ? 'Lista ✓' : 'Pendiente';
                  const badgeColor = isSubjectAllDone
                    ? isDark
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                    : isDark
                    ? 'bg-white/[0.06] text-zinc-300 border-white/10 font-bold'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 font-bold';

                  return (
                    <div
                      key={subject.id}
                      id={`subject-${subject.id}`}
                      className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                        isDark
                          ? 'bg-[#131417] border-white/[0.08] hover:border-white/15 shadow-md'
                          : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                      } ${isSingleView ? 'max-w-2xl mx-auto w-full' : ''}`}
                    >
                      {/* Header de Materia */}
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                          <div
                            onClick={() => {
                              setSelectedSubjectId(subject.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group/title"
                            title={`Enfocar materia ${subject.name}`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isSubjectAllDone ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                            <h3 className={`font-black text-sm tracking-wide uppercase truncate transition-colors ${
                              isDark ? 'text-white group-hover/title:text-zinc-300' : 'text-zinc-900 group-hover/title:text-zinc-600'
                            }`}>
                              {subject.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => setEditingSubject(subject)}
                            title={`Editar nombre de "${subject.name}"`}
                            className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                            }`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Mini-Panel de Calificación Oficial UEES (Sin sobreposición, Estilo Platino / Titanio) */}
                      <div className={`mb-3.5 p-2.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-[#18191e] border-white/5' : 'bg-zinc-50 border-zinc-200/60'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${ueesCalc.isPassed ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wide ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              Prom. UEES:
                            </span>
                            <span className={`text-xs font-mono font-black ${
                              ueesCalc.isPassed 
                                ? 'text-emerald-400' 
                                : isDark ? 'text-zinc-100' : 'text-zinc-900'
                            }`}>
                              {ueesCalc.ueesAverageFormatted}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGradeSubjectId(subject.id);
                              setShowGradesModal(true);
                            }}
                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                              isDark
                                ? 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                                : 'bg-white hover:bg-zinc-100 text-black border-zinc-300 shadow-xs'
                            }`}
                            title={`Añadir o consultar notas de ${subject.name}`}
                          >
                            <Calculator className="w-3 h-3 shrink-0" />
                            <span>Notas</span>
                          </button>
                        </div>

                        {/* Meta R3 en fila propia independiente: Estilo Platino / Titanio Minimalista */}
                        {ueesCalc.neededInR3 && !ueesCalc.isPassed && (
                          <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] font-mono ${
                            isDark ? 'border-white/5 text-zinc-400' : 'border-zinc-200/80 text-zinc-600'
                          }`}>
                            <span className="font-semibold text-[9px] uppercase tracking-wider">Meta en R3:</span>
                            <span className={`font-black px-2 py-0.5 rounded-md border text-[10px] ${
                              isDark 
                                ? 'bg-white/[0.06] border-white/15 text-white' 
                                : 'bg-zinc-100 border-zinc-200 text-zinc-900'
                            }`}>
                              {ueesCalc.neededInR3} pts
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lista de Tareas de la Materia */}
                      <div className="space-y-2 mb-4">
                        {tasks.map((task) => {
                          const deadlineInfo = getDeadlineStatus(task.deadlineISO);
                          const isForo = task.name.toLowerCase().includes('foro');
                          const isLab = task.name.toLowerCase().includes('lab');

                          return (
                            <div
                              key={task.id}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all group ${
                                isDark
                                  ? 'bg-[#18191e] hover:bg-[#1f2026] border-white/5'
                                  : 'bg-zinc-50/70 hover:bg-zinc-100/90 border-zinc-200/50'
                              }`}
                            >
                              <div
                                onClick={() => handleToggleTask(subject.id, task.id)}
                                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                              >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isDark ? 'bg-white/5 text-zinc-300' : 'bg-white border border-zinc-200 text-zinc-700'
                                }`}>
                                  {isForo ? (
                                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                                  ) : isLab ? (
                                    <Atom className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-zinc-400" />
                                  )}
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <span
                                    className={`text-xs font-semibold truncate ${
                                      task.completed
                                        ? 'line-through text-zinc-400'
                                        : isDark ? 'text-white' : 'text-zinc-950'
                                    }`}
                                  >
                                    {task.name}
                                  </span>
                                  <span className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                    {isForo ? 'Módulo semanal' : isLab ? 'Práctica técnica' : 'Evaluación'}
                                  </span>
                                  {task.note && (
                                    <div className={`mt-1 text-[10px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 border max-w-full font-mono ${
                                      isDark ? 'bg-white/[0.05] text-zinc-200 border-white/10' : 'bg-zinc-100 text-zinc-800 border-zinc-200/90'
                                    }`}>
                                      <span className="text-[10px] shrink-0 text-zinc-400">📝</span>
                                      <span className="truncate">{task.note}</span>
                                    </div>
                                  )}
                                  {deadlineInfo && (
                                    <span className={`text-[9px] font-mono mt-0.5 ${
                                      deadlineInfo.isPast
                                        ? 'text-rose-400 font-semibold'
                                        : deadlineInfo.isUrgent
                                        ? (isDark ? 'text-zinc-200 font-semibold' : 'text-zinc-800 font-semibold')
                                        : isDark ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}>
                                      {deadlineInfo.text}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {/* Botón Lápiz / Nota de Tarea */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNoteTarget({
                                      subjectId: subject.id,
                                      taskId: task.id,
                                      taskName: `${subject.name} - ${task.name}`,
                                      note: task.note || '',
                                      deadlineISO: task.deadlineISO || '',
                                    });
                                  }}
                                  className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                                    task.note
                                      ? isDark
                                        ? 'bg-white/15 border-white/30 text-white shadow-xs'
                                        : 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                                      : isDark
                                      ? 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
                                      : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-black shadow-2xs'
                                  }`}
                                  title={task.note ? 'Editar nota de la tarea' : 'Añadir nota o fecha límite a esta tarea'}
                                >
                                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                                </button>

                                {/* Botón Check de Entrega */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTask(subject.id, task.id);
                                  }}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    task.completed
                                      ? 'bg-emerald-500 text-white shadow-xs'
                                      : isDark
                                      ? 'border-2 border-zinc-700 text-transparent hover:border-zinc-500 bg-white/5'
                                      : 'border-2 border-zinc-300 text-transparent hover:border-zinc-500 bg-white'
                                  }`}
                                  title={task.completed ? 'Marcar como pendiente' : 'Marcar como entregado'}
                                >
                                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {tasks.length === 0 && (
                          <div className="text-center py-4 text-xs text-zinc-500 italic">
                            Sin tareas en esta semana.
                          </div>
                        )}
                      </div>

                      {/* Botón inferior + Agregar Tarea [Nombre Materia] */}
                      <button
                        onClick={() => handleOpenNewTaskModal(subject)}
                        className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/15'
                            : 'bg-white hover:bg-zinc-50 text-black border-zinc-300 shadow-xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Tarea {subject.name}</span>
                      </button>
                    </div>
                  );
                };

                return selectedSubjectId ? (
                  /* Vista con Materia Seleccionada + Ajustes (Foto 2) */
                  <div className="space-y-6 mb-8">
                    {/* Barra de Navegación de Materia Seleccionada */}
                    <div className={`p-4 rounded-3xl border flex flex-col gap-3 transition-all ${
                      isDark 
                        ? 'bg-[#131417] border-white/10 shadow-xl' 
                        : 'bg-white border-zinc-200/80 shadow-xs'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedSubjectId(null)}
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/15 border border-white/15 text-white'
                              : 'bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800'
                          }`}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Volver a todas las materias ({currentDashboard.subjects.length})</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedGradeSubjectId(selectedSubjectId);
                            setShowGradesModal(true);
                          }}
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white !text-black text-black hover:bg-zinc-200 shadow-xs'
                              : 'bg-black !text-white text-white hover:bg-zinc-800 shadow-xs'
                          }`}
                          title="Añadir o editar notas oficiales UEES de esta materia"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Añadir / Gestionar Notas UEES</span>
                        </button>
                      </div>

                      {/* Selector rápido tipo chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {currentDashboard.subjects.map((s, idx) => {
                          const isCurrent = s.id === selectedSubjectId;
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelectedSubjectId(s.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                                isCurrent
                                  ? (isDark 
                                      ? 'bg-white border-white !text-black text-black shadow-md font-black' 
                                      : 'bg-black border-black !text-white text-white shadow-md font-black')
                                  : (isDark
                                      ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                                      : 'bg-zinc-50 border-zinc-300 text-zinc-800 hover:text-black hover:bg-zinc-100')
                              }`}
                            >
                              <span className={`font-mono text-[10px] ${isCurrent ? (isDark ? '!text-black text-black font-black' : '!text-white text-white font-black') : (isDark ? 'text-zinc-400' : 'text-zinc-600')}`}>
                                {idx % 3 === 0 ? '</>' : idx % 3 === 1 ? '√x' : '⚙'}
                              </span>
                              <span>{s.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tarjeta exclusiva de la materia */}
                    {(() => {
                      const targetSubject = currentDashboard.subjects.find((s) => s.id === selectedSubjectId);
                      if (!targetSubject) return null;
                      const sIdx = currentDashboard.subjects.findIndex((s) => s.id === selectedSubjectId);
                      return (
                        <div className="max-w-2xl mx-auto w-full">
                          {renderSubjectCard(targetSubject, sIdx, true)}
                        </div>
                      );
                    })()}

                    {/* Separador de Herramientas y Ajustes */}
                    <div className="pt-4 flex items-center gap-3">
                      <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2 px-3.5 py-1 rounded-full border ${
                        isDark 
                          ? 'bg-[#131417] border-white/10 text-zinc-300' 
                          : 'bg-white border-zinc-200 text-zinc-700 shadow-xs'
                      }`}>
                        <span>Herramientas y Recursos</span>
                      </span>
                      <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                    </div>

                    {/* Herramientas y Ajustes (Foto 2) */}
                    <div className="pt-2">
                      <ToolsAndLinksView
                        isDark={isDark}
                        cloudStatus={cloudStatus}
                        accessCode={currentDashboard.accessCode}
                        startDate={currentDashboard.startDate}
                        daysElapsed={daysTranscurridos}
                        pendingTasksCount={weekStats.pendingTasks}
                        onBackToTasks={() => setSelectedSubjectId(null)}
                        onExportJSON={handleExportJSON}
                        onImportJSONClick={() => jsonInputRef.current?.click()}
                        onOpenSchedule={() => setShowScheduleModal(true)}
                        onOpenLinks={() => setShowLinksModal(true)}
                        onOpenGrades={() => setShowGradesModal(true)}
                        onOpenPensumWidget={() => setShowPensumModal(true)}
                        onOpenAIAssistant={() => setShowAIAssistant(true)}
                        onOpenPomodoro={() => setShowPomodoroModal(true)}
                        onOpenStartDate={() => setShowStartDateModal(true)}
                        onUploadCloud={() => setShowUploadConfirm(true)}
                        onDownloadCloud={handleTriggerCloudDownload}
                        onCopyLink={handleCopyLink}
                        onOpenShareModal={() => setShowShareModal(true)}
                      />
                    </div>
                  </div>
                ) : (
                  /* Grid con animación de esfumado al completar materia y botón para ver completadas */
                  (() => {
                    const completedSubjectsCount = currentDashboard.subjects.length - visibleSubjects.length;

                    return (
                      <>
                        {/* Control de materias completadas */}
                        <div className="flex items-center justify-between mb-4 px-1">
                          <span className={`text-xs font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            Materias ({visibleSubjects.length} pendientes{completedSubjectsCount > 0 ? ` • ${completedSubjectsCount} completada${completedSubjectsCount > 1 ? 's' : ''}` : ''})
                          </span>
                          {completedSubjectsCount > 0 && (
                            <button
                              onClick={() => setShowCompletedSubjects(!showCompletedSubjects)}
                              className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                isDark
                                  ? 'text-white bg-white/10 hover:bg-white/15 border-white/20'
                                  : 'text-black bg-white hover:bg-zinc-50 border-zinc-300 shadow-xs'
                              }`}
                            >
                              {showCompletedSubjects ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{showCompletedSubjects ? 'Ocultar completadas' : `Mostrar completadas (${completedSubjectsCount})`}</span>
                            </button>
                          )}
                        </div>

                        {visibleSubjects.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-8 text-center rounded-3xl border mb-8 ${
                              isDark
                                ? 'bg-[#131417] border-white/10 shadow-xl'
                                : 'bg-white border-zinc-200/80 shadow-xs'
                            }`}
                          >
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
                              🎉
                            </div>
                            <h3 className={`text-base font-black uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                              ¡Todas las materias completadas en la Semana {currentWeek.weekNumber}!
                            </h3>
                            <p className={`text-xs mb-4 max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              Has entregado todas tus actividades. Las materias se esfumaron del panel para mantener tu enfoque al 100%.
                            </p>
                            <button
                              onClick={() => setShowCompletedSubjects(true)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isDark
                                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                              }`}
                            >
                              Ver materias completadas
                            </button>
                          </motion.div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 items-start">
                            <AnimatePresence mode="popLayout">
                              {visibleSubjects.map((subject, sIdx) => (
                                <motion.div
                                  key={subject.id}
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    y: -25,
                                    filter: 'blur(12px)',
                                    transition: { duration: 0.5, ease: 'easeInOut' },
                                  }}
                                >
                                  {renderSubjectCard(subject, sIdx, false)}
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Analytics Section (Curva de Rendimiento + Donut Completitud) */}
                        <AnalyticsSection
                          weeks={currentDashboard.weeks}
                          activeWeekNumber={currentWeek.weekNumber}
                          completedTasksCount={weekStats.completedTasks}
                          pendingTasksCount={weekStats.pendingTasks}
                          isDark={isDark}
                        />
                      </>
                    );
                  })()
                );
              })()}
            </div>
          )}

          {/* Schedule View */}
          {currentView === 'schedule' && (
            <div className={`p-5 rounded-3xl border transition-all ${
              isDark ? 'bg-[#131417] border-white/5 shadow-md' : 'bg-white border-zinc-200/80 shadow-2xs'
            }`}>
              <ToolsAndLinksView
                isDark={isDark}
                cloudStatus={cloudStatus}
                accessCode={currentDashboard.accessCode}
                startDate={currentDashboard.startDate}
                daysElapsed={daysTranscurridos}
                pendingTasksCount={weekStats.pendingTasks}
                onBackToTasks={() => setCurrentView('dashboard')}
                onExportJSON={handleExportJSON}
                onImportJSONClick={() => jsonInputRef.current?.click()}
                onOpenSchedule={() => setShowScheduleModal(true)}
                onOpenLinks={() => setShowLinksModal(true)}
                onOpenGrades={() => setShowGradesModal(true)}
                onOpenPensumWidget={() => setShowPensumModal(true)}
                onOpenAIAssistant={() => setShowAIAssistant(true)}
                onOpenPomodoro={() => setShowPomodoroModal(true)}
                onOpenStartDate={() => setShowStartDateModal(true)}
                onUploadCloud={() => setShowUploadConfirm(true)}
                onDownloadCloud={handleTriggerCloudDownload}
                onCopyLink={handleCopyLink}
                onOpenShareModal={() => setShowShareModal(true)}
              />
            </div>
          )}

          {/* Cloud Database View */}
          {currentView === 'cloud' && (
            <div className={`max-w-3xl mx-auto p-6 rounded-3xl border transition-all space-y-6 ${
              isDark ? 'bg-[#131417] border-white/5 shadow-md' : 'bg-white border-zinc-200/80 shadow-2xs'
            }`}>
              <div className={`flex items-center justify-between pb-4 border-b ${
                isDark ? 'border-white/5' : 'border-zinc-200/80'
              }`}>
                <div>
                  <h2 className={`text-lg font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}>
                    <Cloud className="w-5 h-5 text-emerald-500" />
                    <span>Base de Datos Nube (Supabase)</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Sincroniza tus materias, tareas y progresos en la nube.
                  </p>
                </div>
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                  isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {cloudStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowUploadConfirm(true)}
                  className={`p-5 rounded-3xl border text-left transition-all cursor-pointer group ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 shadow-2xs'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${
                    isDark ? 'bg-white !text-black text-black font-bold' : 'bg-black !text-white text-white font-bold'
                  }`}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Subir a la Nube</h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Guarda el estado actual del dashboard en la base de datos central.
                  </p>
                </button>

                <button
                  onClick={handleTriggerCloudDownload}
                  className={`p-5 rounded-3xl border text-left transition-all cursor-pointer group ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 shadow-2xs'
                  }`}
                  title="Descargar de la nube directamente"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${
                    isDark ? 'bg-emerald-500 text-white font-bold' : 'bg-emerald-600 text-white font-bold'
                  }`}>
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Descargar de la Nube</h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Sincroniza directamente tus materias y tareas con la base de datos central.
                  </p>
                </button>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/80'
              }`}>
                <div>
                  <span className={`text-xs block ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Enlace público / compartir</span>
                  <span className={`text-xs font-mono font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {window.location.origin}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                    isDark ? 'bg-white !text-black text-black hover:bg-zinc-200' : 'bg-black !text-white text-white hover:bg-zinc-800'
                  }`}
                >
                  Copiar Enlace
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal para Agregar Tarea a Materia */}
      <AnimatePresence>
        {targetSubjectForNewTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
                isDark ? 'bg-[#131417] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-zinc-900'
                }`}>
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>Nueva Tarea para {targetSubjectForNewTask.name}</span>
                </h3>
                <button
                  onClick={() => setTargetSubjectForNewTask(null)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveNewTask(); }} className="space-y-4">
                <div className="space-y-3 mb-5">
                  <div>
                    <label className={`text-xs font-semibold block mb-1 ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                      Título de la Actividad *
                    </label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Ej: Foro 15, Laboratorio 4, Tarea..."
                      className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none transition-all ${
                        isDark ? 'bg-white/5 border-white/10 text-white focus:border-white/30' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                      }`}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-semibold block mb-1 ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                      Descripción / Nota (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Ej: Módulo de Algoritmos, Entrega en aula..."
                      className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none transition-all ${
                        isDark ? 'bg-white/5 border-white/10 text-white focus:border-white/30' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetSubjectForNewTask(null)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                      isDark ? 'bg-white !text-black text-black hover:bg-zinc-200' : 'bg-black !text-white text-white hover:bg-zinc-800'
                    }`}
                  >
                    Guardar Tarea
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Date Picker Modal */}
      <StartDateModal
        isOpen={showStartDateModal}
        currentDateISO={currentDashboard.startDateISO}
        onSave={handleSaveStartDate}
        onClose={() => setShowStartDateModal(false)}
      />

      {/* Task Note Modal */}
      <TaskNoteModal
        isOpen={activeNoteTarget !== null}
        taskName={activeNoteTarget?.taskName || ''}
        initialNote={activeNoteTarget?.note || ''}
        initialDeadline={activeNoteTarget?.deadlineISO || ''}
        onSave={handleSaveTaskNote}
        onClose={() => setActiveNoteTarget(null)}
        isDark={isDark}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        pendingSubjects={weekStats.pendingSubjectNames}
        totalPendingCount={weekStats.pendingTasks}
        onTestNotification={handleTestNotification}
      />

      {/* Welcome Modal with animated CRACK! card */}
      <WelcomeModal
        isOpen={showWelcome}
        onStart={() => {
          setShowWelcome(false);
          setShowWizard(true);
        }}
      />

      {/* 3-Step Wizard Modal */}
      <WizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onFinish={handleFinishWizard}
        onOpenAccessCode={handleTriggerCloudDownload}
      />

      {/* Side Drawer for Dashboards & Weeks with Delete options */}
      <DrawerDashboards
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        dashboards={dashboards}
        activeDashboard={currentDashboard}
        isDark={isDark}
        loggedUser={loggedUser}
        onSelectDashboard={(id) => setActiveDashId(id)}
        onSelectWeek={handleSelectWeek}
        onNewDashboard={() => {
          setShowDrawer(false);
          setShowWizard(true);
        }}
        onAddWeek={handleAddWeek}
        onDeleteDashboard={handleDeleteDashboard}
        onDeleteWeek={handleDeleteWeek}
        onTriggerCelebration={handleTriggerCelebration}
        onLogout={handleLogout}
      />

      {/* Delete Dashboard Confirmation Modal */}
      <ConfirmModal
        isOpen={pendingDeleteDashId !== null}
        title="¿Eliminar Dashboard?"
        subtitle={`¿Estás seguro de eliminar "${dashboards.find((d) => d.id === pendingDeleteDashId)?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Dashboard"
        cancelText="Cancelar"
        isDanger={true}
        isDark={isDark}
        onConfirm={confirmDeleteDashboard}
        onCancel={() => setPendingDeleteDashId(null)}
      />

      {/* Delete Week Confirmation Modal */}
      <ConfirmModal
        isOpen={pendingDeleteWeekId !== null}
        title="¿Eliminar Semana?"
        subtitle={`¿Estás seguro de eliminar la Semana ${currentDashboard.weeks.find((w) => w.id === pendingDeleteWeekId)?.weekNumber}?`}
        confirmText="Eliminar Semana"
        cancelText="Cancelar"
        isDanger={true}
        isDark={isDark}
        onConfirm={confirmDeleteWeek}
        onCancel={() => setPendingDeleteWeekId(null)}
      />

      {/* Upload Confirmation Modal */}
      <ConfirmModal
        isOpen={showUploadConfirm}
        title="¿Estas seguro?"
        subtitle="¿VAS A SUBIR A SUPABASE / NUBE?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        isDark={isDark}
        onConfirm={handleConfirmUpload}
        onCancel={() => setShowUploadConfirm(false)}
      />

      {/* Download Prompt Modal (Enter access code) */}
      <PromptModal
        isOpen={showDownloadPrompt}
        title="task-dashboard dice"
        message="Ingresa la clave de acceso:"
        placeholder="Ingresa tu clave"
        defaultValue=""
        isDark={isDark}
        onConfirm={handlePromptDownload}
        onCancel={() => setShowDownloadPrompt(false)}
      />

      {/* Download Confirmation Modal */}
      <ConfirmModal
        isOpen={showDownloadConfirm}
        title="¿Estas seguro?"
        subtitle="¿VAS A DESCARGAR?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        isDark={isDark}
        onConfirm={handleConfirmDownload}
        onCancel={() => setShowDownloadConfirm(false)}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="⚠️ Restablecer todo"
        subtitle="¿Deseas restablecer todo e iniciar uno completamente nuevo?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        isDanger={true}
        isDark={isDark}
        onConfirm={handleResetAll}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Edit Quick Note Prompt */}
      <PromptModal
        isOpen={showEditNotePrompt}
        title="Editar Nota del Dashboard"
        message="Ingresa una nota breve o descripción:"
        placeholder="Ej. Semestre 2026-II"
        defaultValue={currentDashboard.quickNote || ''}
        isDark={isDark}
        onConfirm={handleUpdateNote}
        onCancel={() => setShowEditNotePrompt(false)}
      />

      {/* Grade & Average Calculator Modal */}
      <GradeCalculatorModal
        isOpen={showGradesModal}
        onClose={() => {
          setShowGradesModal(false);
          setSelectedGradeSubjectId(undefined);
        }}
        subjects={currentDashboard.subjects}
        isDark={isDark}
        initialSubjectId={selectedGradeSubjectId}
      />

      {/* Pomodoro Study Timer Modal */}
      <PomodoroTimerModal
        isOpen={showPomodoroModal}
        onClose={() => setShowPomodoroModal(false)}
        isDark={isDark}
      />

      {/* Class Schedule Modal */}
      <ClassScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        isDark={isDark}
      />

      {/* University Quick Links Modal */}
      <UniversityLinksModal
        isOpen={showLinksModal}
        onClose={() => setShowLinksModal(false)}
        isDark={isDark}
      />

      {/* Share Web Link Modal */}
      <ShareAppModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        isDark={isDark}
        appUrl={shareableUrl}
        onUpdateAppUrl={handleUpdateShareUrl}
        onShowToast={setToastMessage}
      />

      {/* Edit Subject Modal (Rename subjects for the semester) */}
      <EditSubjectModal
        isOpen={editingSubject !== null}
        subject={editingSubject}
        onClose={() => setEditingSubject(null)}
        onRename={handleRenameSubject}
        onDelete={handleDeleteSubject}
        canDelete={false}
        isDark={isDark}
      />

      {/* Copiloto IA UEES Modal */}
      <AIAssistantModal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        contextData={{
          studentName: loggedUser || 'Bryan Reyes',
          activeDashboard: currentDashboard,
          currentWeek: currentWeek,
          gradesData: gradesTracker,
        }}
        onExecuteAction={handleExecuteAgentAction}
        isDark={isDark}
      />

      {/* Selector de Temas & Apariencia */}
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        isDark={isDark}
        themeMode={themeMode}
        onSelectThemeMode={handleSelectThemeMode}
        activePalette={activePalette}
        onSelectPalette={handleSelectPalette}
      />

      {/* Modal de Configuración del Widget de Pensum (Android) */}
      <PensumConfigModal
        isOpen={showPensumModal}
        onClose={() => setShowPensumModal(false)}
        isDark={isDark}
        activeSubjectsCount={currentDashboard.subjects.length}
        onShowToast={setToastMessage}
      />

      {/* Floating Action Button (FAB) para KALI IA */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 p-3 sm:px-4 sm:py-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border ${
          isDark
            ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
            : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
        }`}
        title="Abrir KALI • Copiloto IA UEES"
      >
        <div className="relative">
          <Bot className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <span className="hidden sm:inline font-mono font-bold text-xs uppercase tracking-wider">
          KALI IA
        </span>
      </button>
    </div>
  );
}
