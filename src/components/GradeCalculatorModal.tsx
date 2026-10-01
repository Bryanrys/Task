import React, { useState, useEffect } from 'react';
import { X, Calculator, Award, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { SubjectItem } from '../types';

interface SubjectGradeData {
  p1: string; // Parcial 1 (e.g. 8.0)
  p2: string; // Parcial 2
  p3: string; // Parcial 3
  w1: number; // Weight 1 (default 30%)
  w2: number; // Weight 2 (default 30%)
  w3: number; // Weight 3 (default 40%)
}

interface GradeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectItem[];
  isDark?: boolean;
}

const GRADES_STORAGE_KEY = 'academic_grades_tracker_v1';

export const GradeCalculatorModal: React.FC<GradeCalculatorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  isDark = true,
}) => {
  const [selectedSubjId, setSelectedSubjId] = useState<string>(subjects[0]?.id || '');
  const [passingGrade, setPassingGrade] = useState<number>(6.0); // Nota mínima para pasar

  const [gradesData, setGradesData] = useState<Record<string, SubjectGradeData>>(() => {
    try {
      const saved = localStorage.getItem(GRADES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Reload when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(GRADES_STORAGE_KEY);
        if (saved) setGradesData(JSON.parse(saved));
      } catch {}
    }
  }, [isOpen]);

  // Live sync with cloud downloads
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(GRADES_STORAGE_KEY);
        if (saved) setGradesData(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('academic_data_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('academic_data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjId) {
      setSelectedSubjId(subjects[0].id);
    }
  }, [subjects, selectedSubjId]);

  useEffect(() => {
    localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(gradesData));
  }, [gradesData]);

  if (!isOpen) return null;

  const currentGrade = gradesData[selectedSubjId] || {
    p1: '',
    p2: '',
    p3: '',
    w1: 30,
    w2: 30,
    w3: 40,
  };

  const updateCurrentGrade = (field: keyof SubjectGradeData, value: any) => {
    setGradesData((prev) => ({
      ...prev,
      [selectedSubjId]: {
        ...(prev[selectedSubjId] || {
          p1: '',
          p2: '',
          p3: '',
          w1: 30,
          w2: 30,
          w3: 40,
        }),
        [field]: value,
      },
    }));
  };

  const n1 = parseFloat(currentGrade.p1);
  const n2 = parseFloat(currentGrade.p2);
  const n3 = parseFloat(currentGrade.p3);

  const hasN1 = !isNaN(n1);
  const hasN2 = !isNaN(n2);
  const hasN3 = !isNaN(n3);

  const w1 = currentGrade.w1 || 30;
  const w2 = currentGrade.w2 || 30;
  const w3 = currentGrade.w3 || 40;

  // Accumulated current score
  let accumulated = 0;
  let evaluatedWeight = 0;
  if (hasN1) {
    accumulated += n1 * (w1 / 100);
    evaluatedWeight += w1;
  }
  if (hasN2) {
    accumulated += n2 * (w2 / 100);
    evaluatedWeight += w2;
  }
  if (hasN3) {
    accumulated += n3 * (w3 / 100);
    evaluatedWeight += w3;
  }

  const finalAvg = evaluatedWeight > 0 ? (accumulated / (evaluatedWeight / 100)).toFixed(2) : '0.00';
  const totalAccumulatedScore = accumulated.toFixed(2);

  // How much needed in Parcial 3 to reach passingGrade?
  let neededInP3: string | null = null;
  if (hasN1 && hasN2 && !hasN3) {
    const currentPoints = n1 * (w1 / 100) + n2 * (w2 / 100);
    const missingPoints = passingGrade - currentPoints;
    const requiredGrade = missingPoints / (w3 / 100);
    if (requiredGrade <= 0) {
      neededInP3 = '¡Ya pasaste la materia!';
    } else if (requiredGrade > 10) {
      neededInP3 = `Imposible llegar a ${passingGrade} (requieres ${requiredGrade.toFixed(1)})`;
    } else {
      neededInP3 = `${requiredGrade.toFixed(2)}`;
    }
  }

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjId) || subjects[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#141210] border-[#292524] text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-500">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider font-mono">
                CALCULADORA DE PROMEDIOS
              </h3>
              <p className="text-[11px] text-stone-400">Control de notas por cómputo / parcial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject Pills / Selector */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 font-mono">
            SELECCIONA LA MATERIA:
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {subjects.map((subj) => (
              <button
                key={subj.id}
                onClick={() => setSelectedSubjId(subj.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-mono ${
                  selectedSubjId === subj.id
                    ? 'bg-yellow-400 text-black shadow-xs font-extrabold'
                    : isDark
                    ? 'bg-[#1c1917] border border-[#2b2724] text-stone-300 hover:border-stone-500'
                    : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {subj.name}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs for P1, P2, P3 */}
        <div className="space-y-3 mb-4">
          {/* Parcial 1 */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
              isDark ? 'bg-[#1a1715] border-[#292524]' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wide block font-mono">
                Cómputo / Parcial 1 ({w1}%)
              </span>
              <span className="text-[10px] text-stone-400">Primer tercio del ciclo</span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={currentGrade.p1}
              onChange={(e) => updateCurrentGrade('p1', e.target.value)}
              placeholder="0.0"
              className={`w-20 text-center font-extrabold text-sm rounded-xl py-1.5 border outline-none font-mono ${
                isDark
                  ? 'bg-[#12100e] border-[#38332e] text-yellow-400 focus:border-yellow-400'
                  : 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Parcial 2 */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
              isDark ? 'bg-[#1a1715] border-[#292524]' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wide block font-mono">
                Cómputo / Parcial 2 ({w2}%)
              </span>
              <span className="text-[10px] text-stone-400">Segundo tercio del ciclo</span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={currentGrade.p2}
              onChange={(e) => updateCurrentGrade('p2', e.target.value)}
              placeholder="0.0"
              className={`w-20 text-center font-extrabold text-sm rounded-xl py-1.5 border outline-none font-mono ${
                isDark
                  ? 'bg-[#12100e] border-[#38332e] text-yellow-400 focus:border-yellow-400'
                  : 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Parcial 3 */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
              isDark ? 'bg-[#1a1715] border-[#292524]' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wide block font-mono">
                Cómputo / Parcial 3 ({w3}%)
              </span>
              <span className="text-[10px] text-stone-400">Evaluación final</span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={currentGrade.p3}
              onChange={(e) => updateCurrentGrade('p3', e.target.value)}
              placeholder="0.0"
              className={`w-20 text-center font-extrabold text-sm rounded-xl py-1.5 border outline-none font-mono ${
                isDark
                  ? 'bg-[#12100e] border-[#38332e] text-yellow-400 focus:border-yellow-400'
                  : 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'
              }`}
            />
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div
          className={`p-4 rounded-2xl border mb-4 font-mono ${
            isDark ? 'bg-[#0f0e0d] border-[#22201d]' : 'bg-stone-100/80 border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Puntaje Acumulado:</span>
            <span className="text-base font-black text-yellow-500">{totalAccumulatedScore} / 10.0</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase">Promedio Actual:</span>
            <span className="text-base font-black text-emerald-500">{finalAvg}</span>
          </div>

          {/* What do you need in P3? */}
          {neededInP3 && (
            <div className="mt-2 pt-2 border-t border-stone-700/40 text-[11px]">
              <span className="text-stone-400 font-bold block mb-0.5">
                🎯 Para pasar con {passingGrade.toFixed(1)} necesitas en Parcial 3:
              </span>
              <span className="text-xs font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-md inline-block">
                {neededInP3}
              </span>
            </div>
          )}

          {hasN1 && hasN2 && hasN3 && (
            <div className="mt-2 pt-2 border-t border-stone-700/40 flex items-center gap-1.5 text-xs font-bold">
              {parseFloat(totalAccumulatedScore) >= passingGrade ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  ¡Materia Aprobada con éxito! 🎉
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Materia en riesgo / No aprobada
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Close */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-yellow-500/10"
        >
          Guardar y Listo ✓
        </button>
      </div>
    </div>
  );
};
