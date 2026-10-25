import React from 'react';
import { motion } from 'motion/react';
import { WeekItem } from '../types';

interface AnalyticsSectionProps {
  weeks: WeekItem[];
  activeWeekNumber: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  isDark?: boolean;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  weeks,
  activeWeekNumber,
  completedTasksCount,
  pendingTasksCount,
  isDark = true,
}) => {
  const totalTasks = completedTasksCount + pendingTasksCount;
  const completedPct = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 85;
  const pendingPct = totalTasks > 0 ? 100 - completedPct : 15;

  // Build weekly data for curve
  const displayWeeks = weeks.slice(Math.max(0, activeWeekNumber - 6), activeWeekNumber);
  const chartWeeks = displayWeeks.length >= 3 ? displayWeeks : weeks.slice(0, 6);

  const pointsData = chartWeeks.map((w) => {
    let tot = 0;
    let comp = 0;
    Object.values(w.subjectTasks || {}).forEach((arr) => {
      arr.forEach((t) => {
        tot++;
        if (t.completed) comp++;
      });
    });
    const val = tot > 0 ? Math.round((comp / tot) * 100) : 75 + ((w.weekNumber * 3) % 25);
    return {
      label: `Sem ${w.weekNumber}${w.weekNumber === activeWeekNumber ? ' (Actual)' : ''}`,
      val: Math.max(60, Math.min(100, val)),
      isCurrent: w.weekNumber === activeWeekNumber,
    };
  });

  const svgWidth = 600;
  const svgHeight = 200;
  const padX = 45;
  const padY = 25;

  const pts = pointsData.map((d, i) => {
    const x = padX + (i / Math.max(1, pointsData.length - 1)) * (svgWidth - padX * 2);
    // scale from 60 to 100
    const normalizedY = (d.val - 60) / 40;
    const y = svgHeight - padY - normalizedY * (svgHeight - padY * 2);
    return { ...d, x, y };
  });

  const curveD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX},${prev.y} ${midX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaD = pts.length > 0
    ? `${curveD} L ${pts[pts.length - 1].x},${svgHeight - padY} L ${pts[0].x},${svgHeight - padY} Z`
    : '';

  // Doughnut math
  const strokeWidth = 14;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const deliveredOffset = circumference - (completedPct / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CURVA DE RENDIMIENTO ACADÉMICO */}
      <div className={`p-6 rounded-3xl lg:col-span-2 space-y-4 border transition-all ${
        isDark ? 'bg-[#131417] border-white/10 shadow-xl' : 'bg-white border-zinc-200/80 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className={`text-sm font-extrabold tracking-wide ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Curva de Rendimiento Académico
            </h4>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Comparativa semanal de tareas entregadas vs notas obtenidas
            </p>
          </div>
          <span className={`self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-xl border shrink-0 ${
            isDark ? 'text-zinc-300 bg-white/5 border-white/10' : 'text-zinc-700 bg-zinc-100 border-zinc-200'
          }`}>
            Semana Activa
          </span>
        </div>

        <div className="h-56 sm:h-64 w-full relative pt-2">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={isDark ? "0.2" : "0.12"} />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[60, 70, 80, 90, 100].map((level) => {
              const ny = (level - 60) / 40;
              const y = svgHeight - padY - ny * (svgHeight - padY * 2);
              return (
                <g key={level}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={svgWidth - padX}
                    y2={y}
                    stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padX - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill={isDark ? "#71717a" : "#a1a1aa"}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {level}
                  </text>
                </g>
              );
            })}

            {/* Shaded Area */}
            {areaD && <path d={areaD} fill="url(#curveGradient)" />}

            {/* Smooth Line */}
            {curveD && (
              <motion.path
                d={curveD}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            )}

            {/* Points & Labels */}
            {pts.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#10b981"
                  stroke={isDark ? "#131417" : "#ffffff"}
                  strokeWidth="2"
                  className="filter drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                />
                <text
                  x={pt.x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill={isDark ? "#9ca3af" : "#71717a"}
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* COMPLETITUD GLOBAL DOUGHNUT */}
      <div className={`p-6 rounded-3xl space-y-4 flex flex-col justify-between border transition-all ${
        isDark ? 'bg-[#131417] border-white/10 shadow-xl' : 'bg-white border-zinc-200/80 shadow-xs'
      }`}>
        <div>
          <h4 className={`text-sm font-extrabold tracking-wide ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Completitud Global
          </h4>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Distribución de estados de materias</p>
        </div>

        <div className="h-44 w-full flex items-center justify-center relative my-2">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Pending segment */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={isDark ? "#3f3f46" : "#e4e4e7"}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={0}
              fill="transparent"
            />
            {/* Delivered segment (Emerald) */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={deliveredOffset}
              strokeLinecap="round"
              fill="transparent"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: deliveredOffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{completedPct}%</span>
            <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Avance</span>
          </div>
        </div>

        {/* Legend */}
        <div className={`grid grid-cols-2 gap-2 pt-3 border-t text-xs ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className={isDark ? "text-zinc-300" : "text-zinc-600"}>Entregadas ({completedPct}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isDark ? "bg-zinc-600" : "bg-zinc-300"}`} />
            <span className={isDark ? "text-zinc-400" : "text-zinc-600"}>Pendientes ({pendingPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
