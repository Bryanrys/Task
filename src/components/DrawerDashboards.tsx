import React from 'react';
import { X, Plus, CheckCircle, Clock, Sparkles, User } from 'lucide-react';
import { Dashboard } from '../types';
import { esSemanaDeParciales } from '../constants/initialData';
import { formatOrResolveWeekDateRange } from '../utils/dateRange';

interface DrawerDashboardsProps {
  isOpen: boolean;
  onClose: () => void;
  dashboards: Dashboard[];
  activeDashboard: Dashboard;
  isDark?: boolean;
  loggedUser?: string;
  onSelectDashboard: (dashId: string) => void;
  onSelectWeek: (weekId: string) => void;
  onNewDashboard: () => void;
  onAddWeek: () => void;
  onDeleteDashboard: (dashId: string) => void;
  onDeleteWeek: (weekId: string) => void;
  onTriggerCelebration?: () => void;
  onLogout?: () => void;
}

export const DrawerDashboards: React.FC<DrawerDashboardsProps> = ({
  isOpen,
  onClose,
  dashboards,
  activeDashboard,
  isDark = true,
  loggedUser,
  onSelectDashboard,
  onSelectWeek,
  onNewDashboard,
  onAddWeek,
  onDeleteDashboard,
  onDeleteWeek,
  onTriggerCelebration,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-sm border-l flex flex-col shadow-2xl transition-colors backdrop-blur-2xl ${isDark
              ? 'liquid-modal-dark border-white/15 text-white'
              : 'liquid-modal-light border-black/10 text-stone-900'
            }`}
        >
          {/* Header */}
          <div
            className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-[#24242c]' : 'border-stone-200'
              }`}
          >
            <h2
              className={`font-extrabold text-sm tracking-wider uppercase font-mono ${isDark ? 'text-slate-100' : 'text-stone-900'
                }`}
            >
              DASHBOARDS Y SEMANAS
            </h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
                }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* User Profile Card (Estilo Sidebar HTML UEES) */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                isDark
                  ? 'bg-[#18191e] border-white/10 shadow-sm'
                  : 'bg-white border-zinc-200 shadow-xs'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${
                  isDark ? 'bg-white !text-black text-black border-white' : 'bg-black !text-white text-white border-black'
                }`}>
                  {loggedUser ? loggedUser.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-black tracking-wide uppercase">
                    {loggedUser || 'Estudiante UEES'}
                  </p>
                  <p className={`text-[10px] font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    En línea • Pro
                  </p>
                </div>
              </div>

              {onTriggerCelebration && (
                <button
                  onClick={onTriggerCelebration}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                  }`}
                  title="Celebrar logro académico"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dashboard Selector */}
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2 font-mono ${isDark ? 'text-slate-400' : 'text-stone-500'
                  }`}
              >
                DASHBOARD ACTIVO
              </label>

              <div className="space-y-2">
                <select
                  value={activeDashboard.id}
                  onChange={(e) => onSelectDashboard(e.target.value)}
                  className={`w-full font-bold text-sm rounded-xl px-3.5 py-2.5 outline-none cursor-pointer border transition-colors ${isDark
                      ? 'bg-[#1c1c22] border-[#2e2e38] text-yellow-400 focus:border-yellow-400'
                      : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-amber-500'
                    }`}
                >
                  {dashboards.map((d) => (
                    <option key={d.id} value={d.id}>
                      [ {d.name} ]
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={onNewDashboard}
                    className={`flex-1 py-2 px-3 border text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isDark
                        ? 'border-[#33333f] hover:border-yellow-400/50 hover:bg-yellow-400/5 text-slate-300'
                        : 'border-stone-300 hover:border-amber-500 hover:bg-amber-50 text-stone-700'
                      }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Nuevo Dashboard</span>
                  </button>

                  <button
                    onClick={() => onDeleteDashboard(activeDashboard.id)}
                    title={`Eliminar dashboard [${activeDashboard.name}]`}
                    className="py-2 px-3 border border-rose-500/30 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-500 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>❌</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Weeks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-stone-500'
                    }`}
                >
                  SEMANAS DE ESTE DASHBOARD
                </label>
                <span
                  className={`text-[10px] font-semibold font-mono ${isDark ? 'text-slate-500' : 'text-stone-400'
                    }`}
                >
                  {activeDashboard.weeks.length} semanas
                </span>
              </div>

              <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {activeDashboard.weeks.map((week) => {
                  const isActive = week.id === activeDashboard.activeWeekId;
                  const isParcial = esSemanaDeParciales(week.weekNumber);

                  return (
                    <div
                      key={week.id}
                      className={`rounded-2xl p-3.5 transition-all flex items-center justify-between border ${
                        isActive
                          ? isDark
                            ? 'border-white bg-white/10 text-white shadow-md'
                            : 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                          : isDark
                            ? 'border-white/5 bg-[#18191e] hover:border-white/20 text-zinc-300'
                            : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      <div
                        onClick={() => {
                          onSelectWeek(week.id);
                          onClose();
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${
                            isActive
                              ? 'text-white'
                              : isDark ? 'text-zinc-100' : 'text-zinc-900'
                          }`}>
                            Semana {week.weekNumber}
                          </span>
                          {isActive && !isParcial && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                              isDark
                                ? 'bg-white/20 text-white border-white/30'
                                : 'bg-white/20 text-white border-white/30'
                            }`}>
                              EN CURSO
                            </span>
                          )}
                          {isParcial && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/30'
                                : isDark
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              🎯 PARCIAL
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] mt-0.5 font-mono ${
                          isActive
                            ? 'text-zinc-300'
                            : isDark ? 'text-zinc-400' : 'text-zinc-500'
                        }`}>
                          {formatOrResolveWeekDateRange(week.weekNumber, activeDashboard.startDateISO, week.dateRange)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {week.status === 'COMPLETADO' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                            COMPLETADO
                            <CheckCircle className="w-3 h-3 text-emerald-500 inline" />
                          </span>
                        )}
                        {week.status === 'EN PROCESO' && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono border ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : isDark
                              ? 'text-zinc-300 bg-white/5 border-white/10'
                              : 'text-zinc-700 bg-zinc-100 border-zinc-200'
                          }`}>
                            EN PROCESO...
                            <Clock className="w-3 h-3 inline animate-spin text-zinc-400" />
                          </span>
                        )}
                        {week.status === 'PENDIENTE' && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${isDark
                                ? 'text-slate-400 bg-slate-800/40 border border-slate-700/50'
                                : 'text-stone-500 bg-stone-200/60 border border-stone-300'
                              }`}
                          >
                            PENDIENTE
                          </span>
                        )}

                        {/* Delete week button ⛔ */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWeek(week.id);
                          }}
                          title={`Eliminar Semana ${week.weekNumber}`}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer text-xs"
                        >
                          ⛔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div
            className={`p-4 border-t space-y-2 ${isDark ? 'border-[#24242c] bg-[#121215]' : 'border-stone-200 bg-white'
              }`}
          >
            <button
              onClick={onAddWeek}
              className={`w-full py-2.5 px-4 active:scale-[0.98] border font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${isDark
                  ? 'bg-[#1c1c24] hover:bg-[#252532] border-[#33333f] text-white'
                  : 'bg-stone-900 hover:bg-stone-800 border-stone-900 text-white shadow-sm'
                }`}
            >
              <Plus className="w-4 h-4 text-yellow-400" />
              <span>+ Agregar Semana</span>
            </button>



          </div>
        </div>
      </div>
    </div>
  );
};
