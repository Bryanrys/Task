import React from 'react';
import { motion } from 'motion/react';
import { WeekItem } from '../types';

interface PerformanceChartProps {
  weeks: WeekItem[];
  activeWeekNumber: number;
  isDark?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  weeks,
  activeWeekNumber,
  isDark = true,
}) => {
  if (weeks.length === 0) return null;

  // Calculate completion percentage for each week
  const dataPoints = weeks.map((w) => {
    let total = 0;
    let completed = 0;
    Object.values(w.subjectTasks).forEach((tasks) => {
      tasks.forEach((t) => {
        total++;
        if (t.completed) completed++;
      });
    });
    const pct = total > 0 ? (completed / total) * 100 : 0;
    return {
      week: w.weekNumber,
      pct,
    };
  });

  const width = 360;
  const height = 48;
  const paddingX = 14;
  const paddingY = 10;

  // Build SVG path
  const points = dataPoints.map((d, index) => {
    const x = paddingX + (index / (weeks.length - 1 || 1)) * (width - paddingX * 2);
    const y = height - paddingY - (d.pct / 100) * (height - paddingY * 2);
    return { x, y, week: d.week, pct: d.pct };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[i - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX},${prev.y} ${midX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider mb-2 font-mono">
        <span className={isDark ? 'text-stone-400 uppercase' : 'text-stone-600 uppercase'}>
          CURVA DE RENDIMIENTO
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full animate-ping ${
              isDark ? 'bg-zinc-200' : 'bg-zinc-800'
            }`}
          />
          <span
            className={`text-[10px] font-semibold ${
              isDark ? 'text-zinc-200' : 'text-zinc-800'
            }`}
          >
            Semana Activa
          </span>
        </div>
      </div>

      <div
        className={`relative w-full h-12 rounded-xl border p-1 overflow-hidden flex items-center justify-center transition-colors ${
          isDark ? 'bg-[#12100e] border-[#292524]' : 'bg-stone-50 border-stone-200'
        }`}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle baseline */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke={isDark ? '#292524' : '#e7e5e4'}
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Glowing animated path */}
          <motion.path
            d={pathD}
            fill="none"
            stroke={isDark ? '#e4e4e7' : '#27272a'}
            strokeWidth="2.5"
            strokeLinecap="round"
            className={
              isDark
                ? 'filter drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]'
                : 'filter drop-shadow-[0_0_4px_rgba(0,0,0,0.1)]'
            }
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Dots on points */}
          {points.map((p) => (
            <circle
              key={p.week}
              cx={p.x}
              cy={p.y}
              r={p.week === activeWeekNumber ? 4.5 : 2}
              fill={
                p.week === activeWeekNumber
                  ? isDark
                    ? '#ffffff'
                    : '#18181b'
                  : isDark
                  ? '#71717a'
                  : '#a1a1aa'
              }
              stroke={
                p.week === activeWeekNumber
                  ? isDark
                    ? '#000000'
                    : '#ffffff'
                  : 'none'
              }
              strokeWidth={p.week === activeWeekNumber ? 1.5 : 0}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
