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
import { ToolsAndLinksView } from './components/ToolsAndLinksView';
import { UnifiedDashboardHeader } from './components/UnifiedDashboardHeader';
import { getDeadlineStatus } from './utils/deadline';
import { formatOrResolveWeekDateRange, computeWeekRangeFromDate } from './utils/dateRange';

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

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved !== null ? saved === 'dark' : true;
  });

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

            return {
              ...d,
              startDateISO: resolvedStartDateISO,
              startDate: resolvedStartDate,
              accessCode: !d.accessCode || d.accessCode === 'UEES-2026' ? 'oo' : d.accessCode,
              weeks: Array.isArray(d.weeks)
                ? d.weeks.map((w: WeekItem) => ({
                  ...w,
                  dateRange: formatOrResolveWeekDateRange(
                    w.weekNumber,
                    resolvedStartDateISO,
                    w.dateRange
                  ),
                }))
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
  const [showPomodoroModal, setShowPomodoroModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showLinksModal, setShowLinksModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        el.classList.add('ring-2', 'ring-pink-500');
        setTimeout(() => el.classList.remove('ring-2', 'ring-pink-500'), 2000);
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

  // Persist theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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

  // Toggle task checkbox
  const handleToggleTask = (subjectId: string, taskId: string) => {
    if (!currentDashboard || !currentWeek) return;

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
        const loaded = JSON.parse(backup);
        setDashboards((prev) => [loaded, ...prev.filter((d) => d.id !== loaded.id)]);
        setActiveDashId(loaded.id);
        setIsSyncing(false);
        setToastMessage('¡Información descargada con éxito!');
        return;
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

  // 7 Curated Cyber-Luxe Prismatic Themes with Vibrant Chromatic Accents (Incluye UEES Cyber-Cosmic)
  const THEMES = [
    {
      name: 'uees-cyber-cosmic',
      cardDark: 'card-theme-cosmic',
      cardLight: 'border-pink-200 shadow-pink-500/10 hover:border-pink-300',
      titleDark: 'bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(236,72,153,0.35)]',
      titleLight: 'text-pink-800 font-extrabold',
      checkDark: 'bg-gradient-to-r from-pink-500 to-purple-600 border-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]',
      checkLight: 'bg-pink-600 border-pink-600 text-white shadow-xs',
      badgeDark: 'bg-pink-500/15 border-pink-500/30 text-pink-300',
      badgeLight: 'bg-pink-50 border-pink-200 text-pink-700',
      accentDark: 'text-pink-400',
      accentLight: 'text-pink-600',
      icon: '🎓',
    },
    {
      name: 'cyber-violet',
      cardDark: 'card-theme-violet',
      cardLight: 'border-violet-200 shadow-violet-500/10 hover:border-violet-300',
      titleDark: 'bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(168,85,247,0.35)]',
      titleLight: 'text-violet-800 font-extrabold',
      checkDark: 'bg-violet-500 border-violet-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]',
      checkLight: 'bg-violet-600 border-violet-600 text-white shadow-xs',
      badgeDark: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
      badgeLight: 'bg-violet-50 border-violet-200 text-violet-700',
      accentDark: 'text-violet-400',
      accentLight: 'text-violet-600',
      icon: '🔮',
    },
    {
      name: 'glacier-cyan',
      cardDark: 'card-theme-cyan',
      cardLight: 'border-cyan-200 shadow-cyan-500/10 hover:border-cyan-300',
      titleDark: 'bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(6,182,212,0.35)]',
      titleLight: 'text-cyan-800 font-extrabold',
      checkDark: 'bg-cyan-400 border-cyan-300 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]',
      checkLight: 'bg-cyan-600 border-cyan-600 text-white shadow-xs',
      badgeDark: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      badgeLight: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      accentDark: 'text-cyan-400',
      accentLight: 'text-cyan-600',
      icon: '❄️',
    },
    {
      name: 'sunset-peach',
      cardDark: 'card-theme-rose',
      cardLight: 'border-rose-200 shadow-rose-500/10 hover:border-rose-300',
      titleDark: 'bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(244,63,94,0.35)]',
      titleLight: 'text-rose-800 font-extrabold',
      checkDark: 'bg-rose-500 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]',
      checkLight: 'bg-rose-600 border-rose-600 text-white shadow-xs',
      badgeDark: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      badgeLight: 'bg-rose-50 border-rose-200 text-rose-700',
      accentDark: 'text-rose-400',
      accentLight: 'text-rose-600',
      icon: '🍑',
    },
    {
      name: 'aurora-emerald',
      cardDark: 'card-theme-emerald',
      cardLight: 'border-emerald-200 shadow-emerald-500/10 hover:border-emerald-300',
      titleDark: 'bg-gradient-to-r from-emerald-300 via-teal-200 to-green-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]',
      titleLight: 'text-emerald-800 font-extrabold',
      checkDark: 'bg-emerald-400 border-emerald-300 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      checkLight: 'bg-emerald-600 border-emerald-600 text-white shadow-xs',
      badgeDark: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      badgeLight: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      accentDark: 'text-emerald-400',
      accentLight: 'text-emerald-600',
      icon: '🌿',
    },
    {
      name: 'solar-amber',
      cardDark: 'card-theme-amber',
      cardLight: 'border-amber-200 shadow-amber-500/10 hover:border-amber-300',
      titleDark: 'bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]',
      titleLight: 'text-amber-800 font-extrabold',
      checkDark: 'bg-amber-400 border-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      checkLight: 'bg-amber-600 border-amber-600 text-white shadow-xs',
      badgeDark: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      badgeLight: 'bg-amber-50 border-amber-200 text-amber-700',
      accentDark: 'text-amber-400',
      accentLight: 'text-amber-600',
      icon: '⚡',
    },
    {
      name: 'prismatic-fuchsia',
      cardDark: 'card-theme-fuchsia',
      cardLight: 'border-fuchsia-200 shadow-fuchsia-500/10 hover:border-fuchsia-300',
      titleDark: 'bg-gradient-to-r from-fuchsia-300 via-pink-200 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(217,70,239,0.35)]',
      titleLight: 'text-fuchsia-800 font-extrabold',
      checkDark: 'bg-fuchsia-500 border-fuchsia-400 text-white shadow-[0_0_12px_rgba(217,70,239,0.5)]',
      checkLight: 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-xs',
      badgeDark: 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300',
      badgeLight: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
      accentDark: 'text-fuchsia-400',
      accentLight: 'text-fuchsia-600',
      icon: '✨',
    },
  ];

  const displayDateRange = formatOrResolveWeekDateRange(
    currentWeek.weekNumber,
    currentDashboard?.startDateISO,
    currentWeek.dateRange
  );
  const semesterProgressPct = Math.min(100, Math.round((daysTranscurridos / (16 * 7)) * 100));

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-[#000000] text-gray-100 font-sans select-none overflow-x-hidden">
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
              className="w-full max-w-md rounded-2xl bg-[#05070e] border border-white/10 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Nota Rápida del Ciclo
                  </h3>
                </div>
                <button
                  onClick={() => setShowQuickNoteModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Escribe una nota, apunte importante o recordatorio para tener a la mano:
                </label>
                <textarea
                  value={quickNoteDraft}
                  onChange={(e) => setQuickNoteDraft(e.target.value)}
                  placeholder="Ej: Recordar entregar el proyecto final el 24 de oct..."
                  rows={4}
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-pink-500 focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowQuickNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md hover:opacity-95 cursor-pointer"
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
              <div className="w-12 h-12 rounded-full border-3 border-transparent border-t-yellow-400 border-r-pink-500 animate-spin shadow-lg shadow-yellow-500/20" />
              <span className="mt-4 text-xs font-bold tracking-widest text-yellow-400 uppercase animate-pulse font-mono">
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
          onOpenPomodoro={() => setShowPomodoroModal(true)}
          onOpenCalculator={() => setShowGradesModal(true)}
          onTriggerCelebration={handleTriggerCelebration}
          onLogout={handleLogout}
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
                className="w-72 h-full bg-[#000000] border-r border-white/10 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 overflow-y-auto">
                  <SidebarNav
                    currentView={currentView}
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
                    onOpenPomodoro={() => {
                      setShowPomodoroModal(true);
                      setShowMobileSidebar(false);
                    }}
                    onOpenCalculator={() => {
                      setShowGradesModal(true);
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

        {/* Main Content Area (Right side, scrollable) */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen px-4 md:px-8 py-5">
          {/* Top Header Bar matching Image 2 */}
          <header className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
            {/* Left: Mobile Menu + Dashboard Title + Week Badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
                title="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wider uppercase text-white">
                  + DASHBOARD ACADÉMICO +
                </h1>
              </div>

              {/* Week Pill - Visible en Móvil y Desktop */}
              {(() => {
                const displayDateRange = formatOrResolveWeekDateRange(
                  currentWeek.weekNumber,
                  currentDashboard?.startDateISO,
                  currentWeek.dateRange
                );
                return (
                  <button
                    onClick={() => setShowDrawer(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold bg-[#0d1222] border border-pink-500/40 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.18)] hover:border-pink-500/70 transition-all cursor-pointer"
                    title="Toca para seleccionar semana"
                  >
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                    <span>Semana {currentWeek.weekNumber}</span>
                    {displayDateRange && (
                      <span className="opacity-75 font-mono text-[10px] hidden sm:inline">({displayDateRange})</span>
                    )}
                  </button>
                );
              })()}
            </div>

            {/* Right: Pending Activities Badge + Weeks Selector Button */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 transition-all cursor-pointer"
                title="Ver recordatorios de materias pendientes"
              >
                <Bell className="w-3.5 h-3.5 text-pink-400" />
                <span>{weekStats.pendingTasks} Pendientes</span>
              </button>

              <button
                onClick={() => setShowDrawer(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.35)] hover:opacity-95 transition-all cursor-pointer active:scale-95"
                title="Seleccionar semana o dashboard"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Semanas</span>
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
                  {/* Banner sutil destacado de Semana de trabajo para APK/Móvil */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 mb-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-[#0a0d1a] to-[#05070e] border border-pink-500/25 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex items-center justify-center shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping absolute" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                        <span className="text-xs font-black tracking-wide text-white">
                          Semana {currentWeek.weekNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono">
                          En Curso
                        </span>
                        {formatOrResolveWeekDateRange(currentWeek.weekNumber, currentDashboard?.startDateISO, currentWeek.dateRange) && (
                          <span className="text-[11px] text-gray-400 font-mono hidden xs:inline truncate">
                            • {formatOrResolveWeekDateRange(currentWeek.weekNumber, currentDashboard?.startDateISO, currentWeek.dateRange)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDrawer(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-pink-300 hover:text-white bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                    >
                      <CalendarDays className="w-3 h-3 text-pink-400" />
                      <span>Semanas</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 3 Métricas Principales (Grid 3 columnas AMOLED) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* 1. Actividades Pendientes */}
                    <div className="p-4 rounded-2xl bg-[#05070e] border border-white/5 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">Actividades Pendientes</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${weekStats.pendingTasks > 0
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                        >
                          {weekStats.pendingTasks > 0 ? 'Urgente' : 'Al Día'}
                        </span>
                      </div>
                      <div className="text-3xl font-black text-white my-1">{weekStats.pendingTasks}</div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <span>Tareas activas</span>
                        <button
                          onClick={() => setShowDrawer(true)}
                          className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          Ver todas →
                        </button>
                      </div>
                    </div>

                    {/* 2. Inicio de Ciclo */}
                    <div className="p-4 rounded-2xl bg-[#05070e] border border-white/5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">Inicio de Ciclo</span>
                        <button
                          onClick={() => setShowStartDateModal(true)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors cursor-pointer"
                          title="Cambiar fecha de inicio"
                        >
                          {currentDashboard.startDate || '06 Jul 2026'}
                        </button>
                      </div>
                      <div className="text-3xl font-black text-white my-1 flex items-baseline gap-1.5">
                        <span>{daysTranscurridos}</span>
                        <span className="text-sm font-semibold text-cyan-400">Días</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <span>Progreso del ciclo</span>
                        <span className="text-cyan-400 font-semibold font-mono">
                          {Math.min(100, Math.round((daysTranscurridos / (16 * 7)) * 100))}% Completado
                        </span>
                      </div>
                    </div>

                    {/* 3. Material de Estudio */}
                    <div className="p-4 rounded-2xl bg-[#05070e] border border-white/5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">Material de Estudio</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Listas
                        </span>
                      </div>
                      <div className="text-3xl font-black text-white my-1">
                        {weekStats.completedSubjects} / {currentDashboard.subjects.length}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <span>Actualizado hoy</span>
                        <button
                          onClick={() => setShowUploadConfirm(true)}
                          className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                          title="Sincronizar a la nube"
                        >
                          <Cloud className="w-3 h-3" /> Sinc
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Bar (Sin botones de JSON) */}
                  <div className="p-3 rounded-2xl bg-[#05070e] border border-white/5 flex flex-wrap items-center justify-between gap-3 mb-6 shadow-md">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setQuickNoteDraft(currentDashboard.quickNote || '');
                          setShowQuickNoteModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-pink-400" />
                        <span>+ Agregar nota rápida...</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowUploadConfirm(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30 transition-all cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Nube</span>
                      </button>

                      <button
                        onClick={handleTriggerCloudDownload}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all cursor-pointer shadow-xs"
                        title="Descargar de la nube directamente"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Nube</span>
                      </button>
                    </div>
                  </div>

                  {/* Banner de Nota Rápida si existe */}
                  {currentDashboard.quickNote && (
                    <div className="p-3 mb-6 rounded-2xl bg-[#05070e] border border-pink-500/30 flex items-center justify-between text-xs text-pink-200 shadow-md">
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
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors cursor-pointer"
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
                          className="p-1 rounded text-gray-500 hover:text-white transition-colors cursor-pointer"
                          title="Eliminar nota"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Función para renderizar tarjeta de materia (modular para vista individual y grilla completa) */}
              {(() => {
                const renderSubjectCard = (subject: SubjectItem, sIdx: number, isSingleView: boolean = false) => {
                  const tasks = currentWeek.subjectTasks[subject.id] || [];
                  const isSubjectAllDone = tasks.length > 0 && tasks.every((t) => t.completed);

                  const borderTopColor =
                    sIdx % 3 === 0
                      ? 'border-t-pink-500'
                      : sIdx % 3 === 1
                        ? 'border-t-purple-500'
                        : 'border-t-cyan-400';

                  const subjectIcon =
                    sIdx % 3 === 0 ? '</>' : sIdx % 3 === 1 ? '√x' : '⚙';

                  const statusLabel = isSubjectAllDone ? 'Lista ✓' : 'Pendiente';
                  const badgeColor = isSubjectAllDone
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-pink-500/15 text-pink-300 border-pink-500/25';

                  return (
                    <div
                      key={subject.id}
                      id={`subject-${subject.id}`}
                      className={`rounded-2xl bg-[#05070e] border border-white/5 border-t-2 ${borderTopColor} p-4.5 flex flex-col justify-between transition-all hover:bg-[#080b16] shadow-md ${isSingleView ? 'max-w-2xl mx-auto w-full' : ''
                        }`}
                    >
                      {/* Header de Materia */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            onClick={() => {
                              setSelectedSubjectId(subject.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 min-w-0 cursor-pointer group/title"
                            title={`Enfocar materia ${subject.name}`}
                          >
                            <span className="font-mono text-xs font-black text-pink-400 select-none">
                              {subjectIcon}
                            </span>
                            <h3 className="font-black text-sm tracking-wide uppercase text-white truncate group-hover/title:text-pink-300 transition-colors">
                              {subject.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => setEditingSubject(subject)}
                            title={`Editar nombre de "${subject.name}"`}
                            className="p-1 rounded text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Lista de Tareas de la Materia */}
                      <div className="space-y-2.5 mb-4">
                        {tasks.map((task) => {
                          const deadlineInfo = getDeadlineStatus(task.deadlineISO);
                          const isForo = task.name.toLowerCase().includes('foro');
                          const isLab = task.name.toLowerCase().includes('lab');

                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-[#0a0d17] hover:bg-[#0f1424] border border-white/5 transition-all group"
                            >
                              <div
                                onClick={() => handleToggleTask(subject.id, task.id)}
                                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                              >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                  {isForo ? (
                                    <MessageSquare className="w-4 h-4 text-pink-400" />
                                  ) : isLab ? (
                                    <Atom className="w-4 h-4 text-cyan-400" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-purple-400" />
                                  )}
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <span
                                    className={`text-xs font-semibold text-gray-200 truncate ${task.completed ? 'line-through opacity-60 text-gray-400' : ''
                                      }`}
                                  >
                                    {task.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 truncate">
                                    {task.note || (isForo ? 'Módulo semanal' : isLab ? 'Práctica técnica' : 'Evaluación')}
                                  </span>
                                  {deadlineInfo && (
                                    <span className="text-[9px] font-mono text-pink-300 mt-0.5">
                                      {deadlineInfo.text}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
                                  className="p-1 rounded text-gray-500 hover:text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Editar nota o fecha límite"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleToggleTask(subject.id, task.id)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${task.completed
                                    ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    : 'border-2 border-white/20 text-transparent hover:border-pink-500'
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
                          <div className="text-center py-4 text-xs text-gray-500 italic">
                            Sin tareas en esta semana.
                          </div>
                        )}
                      </div>

                      {/* Botón inferior + Agregar Tarea [Nombre Materia] */}
                      <button
                        onClick={() => handleOpenNewTaskModal(subject)}
                        className="w-full py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/10 hover:border-pink-500/40 text-xs font-semibold text-gray-300 hover:text-pink-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar Tarea {subject.name}</span>
                      </button>
                    </div>
                  );
                };

                return selectedSubjectId ? (
                  /* Vista con Materia Seleccionada + Ajustes (Foto 2) */
                  <div className="space-y-6 mb-8">
                    {/* Barra de Navegación de Materia Seleccionada */}
                    <div className="p-4 rounded-2xl bg-[#080b16] border border-pink-500/25 flex flex-col gap-3 shadow-lg">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedSubjectId(null)}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span> ({currentDashboard.subjects.length})</span>
                        </button>
                        <span className="text-[11px] font-mono text-gray-400">

                        </span>
                      </div>

                      {/* Selector rápido tipo chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {currentDashboard.subjects.map((s, idx) => {
                          const isCurrent = s.id === selectedSubjectId;
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelectedSubjectId(s.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${isCurrent
                                ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/25 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                              <span className="font-mono text-pink-400 text-[10px]">
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
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-xs font-black uppercase tracking-wider text-pink-300 font-mono flex items-center gap-2 px-3 py-1 rounded-full bg-[#080b16] border border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.15)]">
                        <span></span>
                        <span></span>
                      </span>
                      <div className="h-px bg-white/10 flex-1" />
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
                          <span className="text-xs font-mono font-bold text-gray-400">
                            Materias ({visibleSubjects.length} pendientes{completedSubjectsCount > 0 ? ` • ${completedSubjectsCount} completada${completedSubjectsCount > 1 ? 's' : ''}` : ''})
                          </span>
                          {completedSubjectsCount > 0 && (
                            <button
                              onClick={() => setShowCompletedSubjects(!showCompletedSubjects)}
                              className="text-xs font-bold text-pink-300 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 transition-all cursor-pointer"
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
                            className="p-8 text-center rounded-3xl bg-[#080b16] border border-emerald-500/30 mb-8 shadow-xl"
                          >
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl">
                              🎉
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-wider mb-1">
                              ¡Todas las materias completadas en la Semana {currentWeek.weekNumber}!
                            </h3>
                            <p className="text-xs text-gray-400 mb-4 max-w-md mx-auto">
                              Has entregado todas tus actividades. Las materias se esfumaron del panel para mantener tu enfoque al 100%.
                            </p>
                            <button
                              onClick={() => setShowCompletedSubjects(true)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
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
            <div className="p-4 rounded-2xl bg-[#05070e] border border-white/5">
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
            <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-[#05070e] border border-white/5 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-cyan-400" />
                    <span>Base de Datos Nube (Supabase)</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Sincroniza tus materias, tareas y progresos en la nube.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {cloudStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowUploadConfirm(true)}
                  className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 hover:border-pink-500 text-left transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-300 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Subir a la Nube</h3>
                  <p className="text-xs text-gray-400">
                    Guarda el estado actual del dashboard en la base de datos central.
                  </p>
                </button>

                <button
                  onClick={handleTriggerCloudDownload}
                  className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500 text-left transition-all cursor-pointer group"
                  title="Descargar de la nube directamente"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Descargar de la Nube</h3>
                  <p className="text-xs text-gray-400">
                    Sincroniza directamente tus materias y tareas con la base de datos central.
                  </p>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Enlace público / compartir</span>
                  <span className="text-xs font-mono text-cyan-300">
                    {window.location.origin}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              className="w-full max-w-md rounded-2xl bg-[#05070e] border border-white/10 p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-pink-400" />
                  <span>Nueva Tarea para {targetSubjectForNewTask.name}</span>
                </h3>
                <button
                  onClick={() => setTargetSubjectForNewTask(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Título de la Actividad *
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ej: Foro 15, Laboratorio 4, Tarea..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-pink-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Descripción / Nota (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Ej: Módulo de Algoritmos, Entrega en aula..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setTargetSubjectForNewTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNewTask}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md hover:opacity-95 cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
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
        onConfirm={handleUpdateNote}
        onCancel={() => setShowEditNotePrompt(false)}
      />

      {/* Grade & Average Calculator Modal */}
      <GradeCalculatorModal
        isOpen={showGradesModal}
        onClose={() => setShowGradesModal(false)}
        subjects={currentDashboard.subjects}
        isDark={isDark}
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
    </div>
  );
}
