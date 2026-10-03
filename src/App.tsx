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
} from 'lucide-react';

import { Dashboard, WeekItem, SubjectItem, TaskItem } from './types';
import {
  INITIAL_DASHBOARDS,
  MATERIAS_DEFAULT,
  ACTIVIDADES_CLASES,
  ACTIVIDADES_PARCIALES,
  esSemanaDeParciales,
} from './constants/initialData';

import { WelcomeModal } from './components/WelcomeModal';
import { WizardModal } from './components/WizardModal';
import { DrawerDashboards } from './components/DrawerDashboards';
import { PromptModal, ConfirmModal } from './components/ActionModals';
import { StartDateModal } from './components/StartDateModal';
import { TaskNoteModal } from './components/TaskNoteModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ParcialSplashModal } from './components/ParcialSplashModal';
import { BloqueTareasWidget } from './components/BloqueTareasWidget';
import { SegmentedLoader } from './components/SegmentedLoader';
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

import { cloudSave, cloudLoad } from './services/supabase';
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

  // Segmented Loader (User's original HTML screen)
  const [showSegmentedLoader, setShowSegmentedLoader] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Dashboards state
  const [dashboards, setDashboards] = useState<Dashboard[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((d: Dashboard) => ({
            ...d,
            accessCode: !d.accessCode || d.accessCode === 'UEES-2026' ? 'oo' : d.accessCode,
          }));
        }
      }
    } catch {}
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

  const SHARE_URL_STORAGE_KEY = 'academic_custom_share_url';
  const DEFAULT_SHARE_URL = 'https://task-ecru-eight-84.vercel.app';

  const [shareableUrl, setShareableUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('academic_custom_share_url');
      if (saved && !saved.includes('run.app') && !saved.includes('google')) {
        return saved;
      }
    } catch {}

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
    } catch {}
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

  // Streak calculation (completed consecutive weeks)
  const streakWeeks = useMemo(() => {
    if (!currentDashboard) return 11;
    let count = 0;
    for (const w of currentDashboard.weeks) {
      if (w.status === 'COMPLETADO') count++;
    }
    return count || 11;
  }, [currentDashboard]);

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

    const newWeek: WeekItem = {
      id: `week-${nextNum}-${Date.now()}`,
      weekNumber: nextNum,
      dateRange: `Semana ${nextNum}`,
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
  const handlePromptDownload = (code: string) => {
    if (!code.trim()) return;
    setPendingDownloadCode(code.trim().toUpperCase());
    setShowDownloadPrompt(false);
    setShowDownloadConfirm(true);
  };

  const handleConfirmDownload = async () => {
    setShowDownloadConfirm(false);
    setIsSyncing(true);

    try {
      const codeUpper = pendingDownloadCode.trim().toUpperCase();
      const currentCodeUpper = (currentDashboard?.accessCode || '').trim().toUpperCase();
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
          // Case 1: Array of dashboards
          if (Array.isArray(raw) && raw.length > 0) {
            setDashboards(raw);
            setActiveDashId(raw[0].id);
            setIsSyncing(false);
            setToastMessage('¡Información completa (Tareas, Enlaces, Promedios, Horario) descargada con éxito!');
            return;
          }
          // Case 2: Single dashboard object with weeks
          if (raw && typeof raw === 'object' && Array.isArray(raw.weeks)) {
            const singleDash: Dashboard = {
              id: raw.id || 'dash-uees',
              name: raw.name || 'UEES',
              accessCode: raw.accessCode || 'oo',
              startDate: raw.startDate || '6 de jul 2026',
              startDateISO: raw.startDateISO || '2026-07-06',
              lastUpdated: raw.lastUpdated || new Date().toLocaleString(),
              subjects: raw.subjects || INITIAL_DASHBOARDS[0].subjects,
              defaultTaskNames: raw.defaultTaskNames || INITIAL_DASHBOARDS[0].defaultTaskNames,
              weeks: raw.weeks,
              activeWeekId: raw.activeWeekId || raw.weeks[raw.weeks.length - 1]?.id || 'week-12',
            };
            setDashboards([singleDash]);
            setActiveDashId(singleDash.id);
            setIsSyncing(false);
            setToastMessage('¡Información completa (Tareas, Enlaces, Promedios, Horario) descargada con éxito!');
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

  if (!currentDashboard || !currentWeek) {
    return <div className="p-8 text-center text-white">Cargando dashboard...</div>;
  }

  // 6 Curated Cyber-Luxe Prismatic Themes with Vibrant Chromatic Accents
  const THEMES = [
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

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-black-canvas text-stone-100' : 'bg-light-canvas text-stone-900'
      } flex flex-col font-sans select-none pb-28 relative overflow-x-hidden`}
    >
      {/* Toast Alert */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Segmented Loader (User's original HTML screen) */}
      <SegmentedLoader
        isOpen={showSegmentedLoader}
        onEnter={() => setShowSegmentedLoader(false)}
      />

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

      {/* 3D Topographic Mesh Canvas Background for Liquid Glass Refraction */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-700 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle at 50% 10%, rgba(139, 92, 246, 0.14) 0%, transparent 60%), radial-gradient(circle at 90% 70%, rgba(6, 182, 212, 0.10) 0%, transparent 50%), linear-gradient(180deg, rgba(8, 8, 12, 0.52) 0%, rgba(5, 5, 8, 0.76) 100%), url('/liquid_glass_bg.jpg')`,
            backgroundPosition: 'center 20%',
          }}
        />
        <div
          className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-700 ${
            !isDark ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle at 50% 10%, rgba(168, 85, 247, 0.08) 0%, transparent 60%), radial-gradient(circle at 90% 70%, rgba(14, 165, 233, 0.06) 0%, transparent 50%), linear-gradient(180deg, rgba(246, 248, 251, 0.88) 0%, rgba(240, 243, 248, 0.94) 100%), url('/liquid_glass_bg.jpg')`,
            backgroundPosition: 'center 20%',
          }}
        />
      </div>

      {/* Main Container - Responsive on Mobile & Desktop */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-8 pt-4 sm:pt-6 pb-20 flex-1 flex flex-col relative z-10"
      >
        {/* Top Header Title with Holographic Prismatic Gradient */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-center mb-3.5"
        >
          <h1
            onClick={() => setShowSegmentedLoader(true)}
            title="Toca para abrir la pantalla de bienvenida"
            className="text-xl sm:text-2xl font-black tracking-widest uppercase cursor-pointer hover:scale-[1.02] transition-transform inline-block bg-gradient-to-r from-violet-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(168,85,247,0.35)]"
          >
            ✦ DASHBOARD ACADÉMICO ✦
          </h1>
          <div className="flex justify-center mt-1">
            <button
              onClick={() => setShowDrawer(true)}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 border backdrop-blur-md ${
                isDark
                  ? 'bg-white/[0.06] border-white/15 text-yellow-300 hover:border-yellow-400/50 shadow-xs'
                  : 'bg-white/80 border-stone-200 text-amber-700 hover:border-amber-400 shadow-2xs'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentDashboard.name}</span>
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </motion.div>

        {/* Hidden JSON file input for backup restoration */}
        <input
          type="file"
          ref={jsonInputRef}
          onChange={handleImportJSON}
          accept=".json"
          className="hidden"
        />

        {/* Sliding Navigation Bar (Tabs & Gestos de Deslizamiento) */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="mb-4"
        >
          {/* Segmented Capsule Control */}
          <div
            className={`p-1.5 rounded-2xl border backdrop-blur-md flex items-center relative transition-all ${
              isDark ? 'bg-black/50 border-white/10' : 'bg-stone-100/90 border-stone-200'
            }`}
          >
            {/* Tab 0 Button: Tareas Pendientes */}
            <button
              onClick={() => handleSwitchTab(0)}
              className={`relative z-10 flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 0
                  ? isDark
                    ? 'text-white'
                    : 'text-stone-900'
                  : isDark
                  ? 'text-stone-400 hover:text-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Actividades Pendientes</span>
              {weekStats.pendingTasks > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 0
                      ? 'bg-rose-500 text-white'
                      : isDark
                      ? 'bg-rose-500/30 text-rose-300'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {weekStats.pendingTasks}
                </span>
              )}
            </button>

            {/* Tab 1 Button: Horario, Enlaces & JSON */}
            <button
              onClick={() => handleSwitchTab(1)}
              className={`relative z-10 flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 1
                  ? isDark
                    ? 'text-white'
                    : 'text-stone-900'
                  : isDark
                  ? 'text-stone-400 hover:text-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Horario, Enlaces & JSON</span>
            </button>

            {/* Animated Sliding Background Indicator */}
            <motion.div
              className={`absolute inset-y-1.5 rounded-xl pointer-events-none ${
                isDark
                  ? 'bg-gradient-to-r from-violet-600/40 via-cyan-600/30 to-emerald-600/40 border border-white/20 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-white shadow-sm border border-stone-200'
              }`}
              animate={{
                left: activeTab === 0 ? '6px' : 'calc(50% + 2px)',
                width: 'calc(50% - 8px)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          </div>

          {/* Swipe Hint Indicator */}
          <div className="flex items-center justify-between px-3 pt-1.5 text-[10px] font-mono">
            <span className={activeTab === 0 ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
              {activeTab === 0 ? '● Tareas activas' : '○ Tareas'}
            </span>
            <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              <span>⇄ Desliza con el dedo para cambiar</span>
            </span>
            <span className={activeTab === 1 ? 'text-cyan-400 font-bold' : 'text-stone-500'}>
              {activeTab === 1 ? '● Recursos & JSON' : '○ Recursos'}
            </span>
          </div>
        </motion.div>

        {/* Touch Swipe Views Container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full flex-1 touch-pan-y"
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 0 ? (
              <motion.div
                key="vista-tareas"
                initial={{ opacity: 0, x: slideDirection === 'right' ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === 'right' ? 40 : -40 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >

        {/* Unified Academic Dashboard Header (Fechas, Sincronización Nube, Clave oo y Respaldo) */}
        <UnifiedDashboardHeader
          isDark={isDark}
          startDate={currentDashboard.startDate}
          daysElapsed={daysTranscurridos}
          cloudStatus={cloudStatus}
          lastUpdated={currentDashboard.lastUpdated}
          accessCode={currentDashboard.accessCode}
          quickNote={currentDashboard.quickNote}
          isSyncing={isSyncing}
          onOpenStartDate={() => setShowStartDateModal(true)}
          onOpenEditNote={() => setShowEditNotePrompt(true)}
          onResetWeekTasks={handleResetCurrentWeekTasks}
          onUploadCloud={() => setShowUploadConfirm(true)}
          onDownloadCloud={() => setShowDownloadPrompt(true)}
          onExportJSON={handleExportJSON}
          onImportJSONClick={() => jsonInputRef.current?.click()}
          onCopyCode={handleCopyLink}
        />

        {/* Bloque Tareas Widget (📌 ACTIVIDADES A CUMPLIR from user's HTML) */}
        <BloqueTareasWidget
          tareas={currentWeek.bloqueTareas || []}
          isDark={isDark}
          onToggle={handleToggleBloqueTarea}
          onDelete={handleDeleteBloqueTarea}
          onAdd={handleAddBloqueTarea}
        />

        {/* Week Pill / Selector with Parcial Badge if week 6, 12, etc. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="flex flex-col items-center justify-center mb-4"
        >
          <button
            onClick={() => setShowDrawer(true)}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-black transition-all cursor-pointer active:scale-95 ${
              isParcialWeek
                ? isDark
                  ? 'border-pink-500/80 bg-pink-500/20 text-pink-300 shadow-[0_0_18px_rgba(244,63,94,0.35)] backdrop-blur-md'
                  : 'border-pink-300 bg-pink-50/90 text-pink-700 shadow-xs backdrop-blur-md'
                : currentWeek.status === 'EN PROCESO'
                ? isDark
                  ? 'border-violet-400/50 bg-violet-500/15 text-violet-200 shadow-[0_0_18px_rgba(168,85,247,0.25)] backdrop-blur-md'
                  : 'border-violet-300 bg-violet-50/90 text-violet-800 shadow-xs backdrop-blur-md'
                : isDark
                ? 'liquid-pill-dark text-stone-200 shadow-[0_4px_15px_rgba(0,0,0,0.5)]'
                : 'liquid-pill-light text-stone-800'
            }`}
          >
            <span className="tracking-wide">Semana {currentWeek.weekNumber}</span>
            {isParcialWeek && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDark ? 'text-pink-300 bg-pink-500/30' : 'text-pink-700 bg-pink-100'
                }`}
              >
                🎯 PARCIALES
              </span>
            )}
            {currentWeek.dateRange && (
              <span
                className={`text-[11px] font-medium flex items-center gap-1 font-mono ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {currentWeek.dateRange}
              </span>
            )}
          </button>
        </motion.div>

        {/* Toggle to view hidden completed subjects */}
        {weekStats.completedSubjects > 0 && !allWeekDone && (
          <div className="flex justify-end mb-2 px-1">
            <button
              onClick={() => setShowCompletedSubjects(!showCompletedSubjects)}
              className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-yellow-400' : 'text-stone-600 hover:text-amber-700'
              }`}
            >
              {showCompletedSubjects ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ocultar materias listas ({weekStats.completedSubjects})</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Ver materias listas ({weekStats.completedSubjects})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Victory Screen from user HTML when all tasks of week are finished */}
        {allWeekDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-6 p-6 rounded-2xl border text-center shadow-xl ${
              isDark
                ? 'bg-[#141210] border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-white border-emerald-300 shadow-emerald-500/10'
            }`}
          >
            <div className="text-4xl mb-2">🗿</div>
            <h2 className="text-lg font-black text-emerald-500 uppercase mb-1">
              ¡Terminastes la jornada bro!
            </h2>
            <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              Terminastes las actividades y jornadas que tenías bro!! ✨ .
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleAddWeek}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                + Nueva Semana
              </button>
              <button
                onClick={handleResetCurrentWeekTasks}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#22201d] hover:bg-[#2c2925] text-stone-300'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
              >
                Reiniciar Tareas
              </button>
            </div>
          </motion.div>
        )}

        {/* Subject Cards List: AUTOMATICALLY DISAPPEARS WHEN ALL CHECKS ARE FILLED (Responsive Grid on Desktop) */}
        <div className="space-y-3 mb-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 items-start">
          <AnimatePresence mode="popLayout">
            {visibleSubjects.map((subject, index) => {
              const tasks = currentWeek.subjectTasks[subject.id] || [];
              const isSubjectAllDone = tasks.length > 0 && tasks.every((t) => t.completed);
              const theme = THEMES[index % THEMES.length];

              return (
                <motion.div
                  key={subject.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    y: 15,
                    transition: { duration: 0.3 },
                  }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.04,
                    ease: 'easeOut',
                  }}
                  className={`rounded-3xl p-4.5 transition-all liquid-gloss ${
                    isDark ? 'liquid-card-dark' : 'liquid-card-light'
                  } ${
                    isParcialWeek
                      ? isDark
                        ? 'border-purple-500/60 shadow-[0_0_24px_rgba(168,85,247,0.25)]'
                        : 'border-purple-300 shadow-purple-300/20'
                      : isSubjectAllDone
                      ? isDark
                        ? 'border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.25)]'
                        : 'border-emerald-300 shadow-emerald-500/10'
                      : isDark
                      ? theme.cardDark
                      : theme.cardLight
                  }`}
                >
                  {/* Subject Header with Aesthetic Chromatic Gradient */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base select-none shrink-0">{theme.icon}</span>
                      <h3
                        className={`font-black text-sm tracking-wide uppercase truncate ${
                          isParcialWeek
                            ? isDark
                              ? 'text-purple-300'
                              : 'text-purple-700'
                            : isSubjectAllDone
                            ? isDark
                              ? 'text-emerald-300'
                              : 'text-emerald-700'
                            : isDark
                            ? theme.titleDark
                            : theme.titleLight
                        }`}
                      >
                        {subject.name}
                      </h3>

                      {/* Edit Subject Pencil Button */}
                      <button
                        onClick={() => setEditingSubject(subject)}
                        title={`Editar o renombrar "${subject.name}"`}
                        className={`p-1 rounded-md transition-colors cursor-pointer text-xs shrink-0 ${
                          isDark
                            ? 'text-stone-500 hover:text-yellow-400 hover:bg-stone-800/60'
                            : 'text-stone-400 hover:text-amber-600 hover:bg-stone-100'
                        }`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>

                    {isSubjectAllDone && (
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border font-mono shrink-0 ${
                          isDark
                            ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'text-emerald-700 bg-emerald-100 border-emerald-300'
                        }`}
                      >
                        LISTA ✓
                      </span>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5">
                    {tasks.map((task) => {
                      const deadlineInfo = getDeadlineStatus(task.deadlineISO);
                      return (
                        <div
                          key={task.id}
                        className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                          task.completed
                            ? isDark
                              ? 'bg-black/30 text-stone-500 border border-transparent'
                              : 'bg-black/5 text-stone-400 border border-transparent'
                            : isDark
                            ? 'bg-white/[0.04] border border-white/[0.09] text-stone-200 hover:bg-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]'
                            : 'bg-white/80 border border-black/5 text-stone-800 hover:bg-white shadow-2xs'
                        }`}
                      >
                        {/* Clickable task checkbox + name */}
                        <div
                          onClick={() => handleToggleTask(subject.id, task.id)}
                          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                        >
                          <motion.div
                            whileTap={{ scale: 0.85 }}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                              task.completed
                                ? isParcialWeek
                                  ? 'bg-pink-500 border-pink-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                                  : isDark
                                  ? `${theme.checkDark}`
                                  : `${theme.checkLight}`
                                : isDark
                                ? 'border-white/25 bg-white/[0.04] hover:border-white/45'
                                : 'border-stone-300 bg-white hover:border-stone-400'
                            }`}
                          >
                            {task.completed && (
                              <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </motion.div>
                            )}
                          </motion.div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-semibold ${
                                  task.completed ? 'line-through opacity-70' : ''
                                }`}
                              >
                                {task.name}
                              </span>

                              {/* Deadline Countdown Pill */}
                              {deadlineInfo && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                                    task.completed
                                      ? isDark
                                        ? 'bg-stone-800 text-stone-500 line-through'
                                        : 'bg-stone-200 text-stone-500 line-through'
                                      : deadlineInfo.isPast
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                      : deadlineInfo.isUrgent
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : isDark
                                      ? 'bg-stone-800/80 text-stone-300 border border-stone-700/60'
                                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                                  }`}
                                >
                                  {deadlineInfo.text}
                                </span>
                              )}
                            </div>

                            {task.note && (
                              <span
                                className={`text-[10px] font-medium italic truncate max-w-[200px] ${
                                  isDark ? 'text-yellow-400/90' : 'text-amber-700'
                                }`}
                              >
                                📝 {task.note}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Note & Deadline Button */}
                        <div className="flex items-center gap-1.5">
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
                            title={
                              task.deadlineISO
                                ? `Límite: ${task.deadlineISO.replace('T', ' ')}. Toca para editar`
                                : task.note
                                ? `Nota: ${task.note}. Toca para editar`
                                : 'Agregar nota o fecha límite'
                            }
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              task.note || task.deadlineISO
                                ? isDark
                                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isDark
                                ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <div className={`text-xs px-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            {task.completed ? '✓' : '—'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                    {tasks.length === 0 && (
                      <p className={`text-xs italic py-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        Sin tareas asignadas.
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visibleSubjects.length === 0 && !allWeekDone && (
            <p className={`text-center text-xs py-4 italic ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              No hay materias pendientes para mostrar.
            </p>
          )}
        </div>

        {/* Statistics & Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`rounded-3xl p-5 mb-4 transition-all liquid-gloss ${
            isDark
              ? 'liquid-card-dark text-stone-100'
              : 'liquid-card-light text-stone-900'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-4 font-mono">
            <span>📊</span>
            <span className={isDark ? 'text-white' : 'text-stone-900'}>
              ESTADÍSTICAS Y RENDIMIENTO
            </span>
          </div>

          {/* 3 Metric Cards with Aesthetic Gradient Accents */}
          <div className="grid grid-cols-3 gap-2.5 mb-5 text-center font-mono">
            {/* Completitud */}
            <div
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-white/[0.04] border-white/10 hover:border-violet-500/30 backdrop-blur-md shadow-xs' : 'bg-white/70 border-black/5 shadow-2xs backdrop-blur-md'
              }`}
            >
              <span className={`text-[9px] font-bold tracking-wider uppercase ${isDark ? 'text-violet-300/80' : 'text-stone-500'}`}>
                COMPLETITUD
              </span>
              <span className={`text-lg font-black my-1 ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 drop-shadow-[0_2px_8px_rgba(168,85,247,0.35)]' : 'text-violet-700'}`}>
                {weekStats.completionRate}%
              </span>
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}>
                <div
                  className={`h-full transition-all duration-300 ${isDark ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600'}`}
                  style={{ width: `${weekStats.completionRate}%` }}
                />
              </div>
            </div>

            {/* Materias Listas */}
            <div
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-white/[0.04] border-white/10 hover:border-cyan-500/30 backdrop-blur-md shadow-xs' : 'bg-white/70 border-black/5 shadow-2xs backdrop-blur-md'
              }`}
            >
              <span className={`text-[9px] font-bold tracking-wider uppercase ${isDark ? 'text-cyan-300/80' : 'text-stone-500'}`}>
                MATERIAS LISTAS
              </span>
              <span className={`text-lg font-black my-1 ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 drop-shadow-[0_2px_8px_rgba(6,182,212,0.35)]' : 'text-emerald-700'}`}>
                {weekStats.completedSubjects} / {currentDashboard.subjects.length}
              </span>
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}>
                <div
                  className={`h-full transition-all duration-300 ${isDark ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-cyan-600 to-emerald-600'}`}
                  style={{
                    width: `${
                      currentDashboard.subjects.length > 0
                        ? (weekStats.completedSubjects / currentDashboard.subjects.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Racha Semanas */}
            <div
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-white/[0.04] border-white/10 hover:border-amber-500/30 backdrop-blur-md shadow-xs' : 'bg-white/70 border-black/5 shadow-2xs backdrop-blur-md'
              }`}
            >
              <span className={`text-[9px] font-bold tracking-wider uppercase ${isDark ? 'text-amber-300/80' : 'text-stone-500'}`}>
                RACHA SEMANAS
              </span>
              <div className="flex items-center justify-center gap-1.5 my-1">
                <span className={`text-lg font-black ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]' : 'text-amber-700'}`}>
                  {streakWeeks}
                </span>
                <span className="text-base animate-bounce">🔥</span>
              </div>
              <span className={`text-[9px] font-bold ${isDark ? 'text-amber-400/80' : 'text-stone-400'}`}>Activo</span>
            </div>
          </div>

          {/* Performance Chart Curve with animated draw */}
          <PerformanceChart
            weeks={currentDashboard.weeks}
            activeWeekNumber={currentWeek.weekNumber}
            isDark={isDark}
          />
        </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="vista-herramientas"
                initial={{ opacity: 0, x: slideDirection === 'right' ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === 'right' ? -40 : 40 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <ToolsAndLinksView
                  isDark={isDark}
                  cloudStatus={cloudStatus}
                  accessCode={currentDashboard.accessCode}
                  startDate={currentDashboard.startDate}
                  daysElapsed={daysTranscurridos}
                  pendingTasksCount={weekStats.pendingTasks}
                  onBackToTasks={() => handleSwitchTab(0)}
                  onExportJSON={handleExportJSON}
                  onImportJSONClick={() => jsonInputRef.current?.click()}
                  onOpenSchedule={() => setShowScheduleModal(true)}
                  onOpenLinks={() => setShowLinksModal(true)}
                  onOpenGrades={() => setShowGradesModal(true)}
                  onOpenPomodoro={() => setShowPomodoroModal(true)}
                  onOpenStartDate={() => setShowStartDateModal(true)}
                  onUploadCloud={() => setShowUploadConfirm(true)}
                  onDownloadCloud={() => setShowDownloadPrompt(true)}
                  onCopyLink={handleCopyLink}
                  onOpenShareModal={() => setShowShareModal(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom Floating Bar with Aesthetic Capsule Liquid Glass */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm md:max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={`flex items-center justify-around px-4 py-2 rounded-full transition-all liquid-gloss ${
            isDark
              ? 'liquid-glass-dark text-stone-100 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.85)] border-white/20'
              : 'liquid-glass-light text-stone-800 shadow-lg'
          }`}
        >
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title="Cambiar tema claro / oscuro"
            className={`p-2 rounded-full transition-all cursor-pointer active:scale-90 ${
              isDark ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-stone-100 text-indigo-600'
            }`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Drawer Weeks/Dashboards */}
          <button
            onClick={() => setShowDrawer(true)}
            title="Ver semanas y dashboards"
            className={`px-3 py-1.5 rounded-full transition-all text-xs font-black flex items-center gap-1 cursor-pointer font-mono active:scale-95 ${
              isDark
                ? 'bg-violet-500/15 border border-violet-400/30 text-violet-300 hover:border-violet-400/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-violet-50 border border-violet-200 text-violet-700'
            }`}
          >
            <span>Sem. {currentWeek.weekNumber}</span>
          </button>

          {/* Quick Tab Switcher Button */}
          <button
            onClick={() => handleSwitchTab(activeTab === 0 ? 1 : 0)}
            title={activeTab === 0 ? 'Deslizar a Horario, Enlaces y JSON' : 'Volver a Tareas Pendientes'}
            className={`px-3 py-1.5 rounded-full transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer font-mono active:scale-95 ${
              activeTab === 0
                ? isDark
                  ? 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                : isDark
                ? 'bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}
          >
            {activeTab === 0 ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Recursos</span>
                <span>→</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>←</span>
                <span className="hidden sm:inline">Tareas</span>
              </>
            )}
          </button>

          {/* Notification Reminders Modal */}
          <button
            onClick={() => setShowNotificationModal(true)}
            title="Recordatorios automáticos de materias pendientes"
            className={`p-2 rounded-full transition-all cursor-pointer relative active:scale-90 ${
              isDark ? 'hover:bg-white/10 text-amber-300' : 'hover:bg-stone-100 text-amber-600'
            }`}
          >
            <BellRing className="w-5 h-5 animate-pulse" />
            {weekStats.pendingTasks > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-black animate-ping" />
            )}
          </button>

          {/* Welcome / Config wizard button */}
          <button
            onClick={() => setShowWelcome(true)}
            title="Abrir bienvenida ¡CRACK!"
            className={`p-2 rounded-full transition-all cursor-pointer active:scale-90 ${
              isDark ? 'hover:bg-white/10 text-yellow-400 hover:text-yellow-300' : 'hover:bg-stone-100 text-amber-600'
            }`}
          >
            <Sparkles className="w-5 h-5 hover:scale-110 transition-transform" />
          </button>

          {/* Share Web Link Button (For sharing or opening in browser from APK) */}
          <button
            onClick={() => setShowShareModal(true)}
            title="Copiar o compartir enlace de la web"
            className={`p-2 rounded-full transition-all cursor-pointer active:scale-90 ${
              isDark ? 'hover:bg-white/10 text-cyan-300 hover:text-cyan-200' : 'hover:bg-stone-100 text-cyan-600'
            }`}
          >
            <Share2 className="w-5 h-5 hover:scale-110 transition-transform" />
          </button>

          {/* New Dashboard Wizard */}
          <button
            onClick={() => setShowWizard(true)}
            title="Crear nuevo dashboard"
            className={`p-2 rounded-full transition-all cursor-pointer active:scale-90 ${
              isDark ? 'hover:bg-white/10 text-fuchsia-300 hover:text-fuchsia-200' : 'hover:bg-stone-100 text-fuchsia-600'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Reset All */}
          <button
            onClick={() => setShowResetConfirm(true)}
            title="Restablecer todo"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-rose-400 hover:bg-stone-800/40' : 'text-stone-500 hover:text-rose-600 hover:bg-stone-100'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

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
        onOpenAccessCode={() => setShowDownloadPrompt(true)}
      />

      {/* Side Drawer for Dashboards & Weeks with Delete options */}
      <DrawerDashboards
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        dashboards={dashboards}
        activeDashboard={currentDashboard}
        isDark={isDark}
        onSelectDashboard={(id) => setActiveDashId(id)}
        onSelectWeek={handleSelectWeek}
        onNewDashboard={() => {
          setShowDrawer(false);
          setShowWizard(true);
        }}
        onAddWeek={handleAddWeek}
        onDeleteDashboard={handleDeleteDashboard}
        onDeleteWeek={handleDeleteWeek}
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
        placeholder="Ingresa tu clave (ej. oo)"
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
