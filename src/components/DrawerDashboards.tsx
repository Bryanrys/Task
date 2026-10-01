import React from 'react';
import { X, Plus, CheckCircle, Clock, Download } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Dashboard } from '../types';
import { esSemanaDeParciales } from '../constants/initialData';

interface DrawerDashboardsProps {
  isOpen: boolean;
  onClose: () => void;
  dashboards: Dashboard[];
  activeDashboard: Dashboard;
  isDark?: boolean;
  onSelectDashboard: (dashId: string) => void;
  onSelectWeek: (weekId: string) => void;
  onNewDashboard: () => void;
  onAddWeek: () => void;
  onDeleteDashboard: (dashId: string) => void;
  onDeleteWeek: (weekId: string) => void;
}

export const DrawerDashboards: React.FC<DrawerDashboardsProps> = ({
  isOpen,
  onClose,
  dashboards,
  activeDashboard,
  isDark = true,
  onSelectDashboard,
  onSelectWeek,
  onNewDashboard,
  onAddWeek,
  onDeleteDashboard,
  onDeleteWeek,
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
          className={`w-screen max-w-sm border-l flex flex-col shadow-2xl transition-colors backdrop-blur-2xl ${
            isDark
              ? 'liquid-modal-dark border-white/15 text-white'
              : 'liquid-modal-light border-black/10 text-stone-900'
          }`}
        >
          {/* Header */}
          <div
            className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-[#24242c]' : 'border-stone-200'
            }`}
          >
            <h2
              className={`font-extrabold text-sm tracking-wider uppercase font-mono ${
                isDark ? 'text-slate-100' : 'text-stone-900'
              }`}
            >
              DASHBOARDS Y SEMANAS
            </h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Dashboard Selector */}
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2 font-mono ${
                  isDark ? 'text-slate-400' : 'text-stone-500'
                }`}
              >
                DASHBOARD ACTIVO
              </label>

              <div className="space-y-2">
                <select
                  value={activeDashboard.id}
                  onChange={(e) => onSelectDashboard(e.target.value)}
                  className={`w-full font-bold text-sm rounded-xl px-3.5 py-2.5 outline-none cursor-pointer border transition-colors ${
                    isDark
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
                    className={`flex-1 py-2 px-3 border text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'border-[#33333f] hover:border-yellow-400/50 hover:bg-yellow-400/5 text-slate-300'
                        : 'border-stone-300 hover:border-amber-500 hover:bg-amber-50 text-stone-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-yellow-500" />
                    <span>+ Nuevo Dashboard</span>
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
                  className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                    isDark ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  SEMANAS DE ESTE DASHBOARD
                </label>
                <span
                  className={`text-[10px] font-semibold font-mono ${
                    isDark ? 'text-slate-500' : 'text-stone-400'
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
                          ? isParcial
                            ? isDark
                              ? 'border-pink-500 bg-pink-950/25 shadow-lg shadow-pink-500/15'
                              : 'border-pink-400 bg-pink-50/80 shadow-sm'
                            : isDark
                            ? 'border-yellow-400/80 bg-yellow-400/10 shadow-lg shadow-yellow-500/10'
                            : 'border-amber-400 bg-amber-50/80 shadow-sm'
                          : isParcial
                          ? isDark
                            ? 'border-pink-500/25 bg-[#17171d] hover:border-pink-500/50'
                            : 'border-pink-200 bg-pink-50/30 hover:border-pink-300'
                          : isDark
                          ? 'border-[#22222a] bg-[#17171d] hover:border-slate-600'
                          : 'border-stone-200 bg-stone-50/80 hover:bg-stone-100 hover:border-stone-300'
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
                          <span
                            className={`font-black text-sm ${
                              isActive
                                ? isParcial
                                  ? isDark
                                    ? 'text-pink-300'
                                    : 'text-pink-600'
                                  : isDark
                                  ? 'text-yellow-300'
                                  : 'text-amber-800'
                                : isDark
                                ? 'text-slate-100'
                                : 'text-stone-800'
                            }`}
                          >
                            Semana {week.weekNumber}
                          </span>
                          {isParcial && (
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                isDark
                                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                  : 'bg-pink-100 text-pink-700 border border-pink-300'
                              }`}
                            >
                              🎯 PARCIAL
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 font-mono ${
                            isDark ? 'text-slate-400' : 'text-stone-500'
                          }`}
                        >
                          {week.dateRange}
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
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                              isParcial
                                ? 'text-pink-400 bg-pink-500/10 border border-pink-500/30'
                                : isDark
                                ? 'text-yellow-300 bg-yellow-400/10 border border-yellow-400/30'
                                : 'text-amber-800 bg-amber-100 border border-amber-300'
                            }`}
                          >
                            EN PROCESO...
                            <Clock
                              className={`w-3 h-3 inline animate-spin ${
                                isParcial
                                  ? 'text-pink-400'
                                  : isDark
                                  ? 'text-yellow-300'
                                  : 'text-amber-800'
                              }`}
                            />
                          </span>
                        )}
                        {week.status === 'PENDIENTE' && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                              isDark
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
            className={`p-4 border-t space-y-2 ${
              isDark ? 'border-[#24242c] bg-[#121215]' : 'border-stone-200 bg-white'
            }`}
          >
            <button
              onClick={onAddWeek}
              className={`w-full py-2.5 px-4 active:scale-[0.98] border font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#1c1c24] hover:bg-[#252532] border-[#33333f] text-white'
                  : 'bg-stone-900 hover:bg-stone-800 border-stone-900 text-white shadow-sm'
              }`}
            >
              <Plus className="w-4 h-4 text-yellow-400" />
              <span>+ Agregar Semana</span>
            </button>

            {/* Direct Project ZIP Download for Android Studio (Only visible on web/PC, never on native APK) */}
            {!Capacitor.isNativePlatform() && (
              <a
                href="/proyecto-dashboard.zip"
                download="proyecto-dashboard.zip"
                className={`w-full py-2 px-3 border text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'border-yellow-400/30 hover:border-yellow-400 bg-yellow-400/5 hover:bg-yellow-400/10 text-yellow-300'
                    : 'border-amber-300 hover:border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-800'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Proyecto (.ZIP)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
