import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Award,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  User,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
} from 'lucide-react';
import { SubjectItem } from '../types';
import {
  SubjectGradeData,
  GRADES_STORAGE_KEY,
  DEFAULT_UEES_GRADES,
  calculateUeesGrade,
  findGradeDataForSubject,
  getSavedGradesData,
} from '../utils/gradeCalculation';

interface GradeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectItem[];
  isDark?: boolean;
  initialSubjectId?: string;
}

export const GradeCalculatorModal: React.FC<GradeCalculatorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  isDark = true,
  initialSubjectId,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'simulator'>('cards');
  const [selectedSubjId, setSelectedSubjId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ''
  );
  const [passingGrade, setPassingGrade] = useState<number>(6.0); // Nota mínima oficial en El Salvador / UEES

  const [gradesData, setGradesData] = useState<Record<string, SubjectGradeData>>(() => {
    return getSavedGradesData();
  });

  // Sincronizar subject id inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (initialSubjectId) {
        setSelectedSubjId(initialSubjectId);
        setActiveTab('simulator');
      } else if (subjects.length > 0 && !selectedSubjId) {
        setSelectedSubjId(subjects[0].id);
      }
      setGradesData(getSavedGradesData());
    }
  }, [isOpen, initialSubjectId, subjects]);

  // Listener para sincronización con la nube o entre pestañas
  useEffect(() => {
    const handleSync = () => {
      setGradesData(getSavedGradesData());
    };
    window.addEventListener('academic_data_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('academic_data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Persistir cambios y notificar a la app
  const persistGradesData = (newData: Record<string, SubjectGradeData>) => {
    setGradesData(newData);
    try {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(newData));
      window.dispatchEvent(new Event('academic_data_synced'));
    } catch {}
  };

  const currentSubjectObj =
    subjects.find((s) => s.id === selectedSubjId) ||
    subjects[0] || { id: 'default', name: 'Materia' };

  const currentGrade = findGradeDataForSubject(
    selectedSubjId,
    currentSubjectObj.name,
    gradesData
  );

  const updateCurrentGrade = (field: keyof SubjectGradeData, value: any) => {
    const key = selectedSubjId || currentSubjectObj.name;
    const updatedSubjGrade = {
      ...currentGrade,
      [field]: value,
    };

    const nextData = {
      ...gradesData,
      [key]: updatedSubjGrade,
      // Si la clave es el id, también guardar por nombre para redundancia
      [currentSubjectObj.name]: updatedSubjGrade,
    };
    persistGradesData(nextData);
  };

  // Restaurar notas oficiales de las capturas de la UEES
  const handleRestoreOfficialGrades = () => {
    const merged = { ...gradesData, ...DEFAULT_UEES_GRADES };
    // Asignar también a los IDs de subjects del dashboard
    subjects.forEach((subj) => {
      for (const [name, def] of Object.entries(DEFAULT_UEES_GRADES)) {
        if (subj.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(subj.name.toLowerCase())) {
          merged[subj.id] = { ...def };
          merged[subj.name] = { ...def };
        }
      }
    });
    persistGradesData(merged);
  };

  if (!isOpen) return null;

  const currentCalc = calculateUeesGrade(currentGrade, passingGrade);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#0a0d17] border-white/10 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-950/40 via-transparent to-pink-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider font-mono text-white">
                  Sistema de Notas UEES
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  R1: 30% | R2: 30% | R3: 40%
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Cálculo oficial de promedios ponderados y seguimiento por registro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreOfficialGrades}
              title="Cargar notas exactas de mis fotos UEES"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cargar Notas de Fotos</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white bg-white/5' : 'text-stone-400 hover:text-stone-900 bg-stone-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs Selector */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-white/5 flex items-center justify-between gap-2 shrink-0 bg-[#060812]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 font-mono ${
                activeTab === 'cards'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-stone-400 hover:text-stone-200 bg-white/5 hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Portal UEES ({subjects.length} materias)</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 font-mono ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-stone-400 hover:text-stone-200 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulador y Ajustes</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400 font-mono hidden md:inline">Nota Mínima Aprobatoria:</span>
            <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              {passingGrade.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: PORTAL UEES CARDS (Igual a las fotos) */}
          {activeTab === 'cards' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
                    Consulta de Notas Oficiales • Ciclo Académico
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Fórmula oficial UEES: <code className="text-pink-300 font-mono">Promedio = (R1 × 0.30) + (R2 × 0.30) + (R3 × 0.40)</code>
                  </p>
                </div>
                <button
                  onClick={handleRestoreOfficialGrades}
                  className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restaurar de Fotos</span>
                </button>
              </div>

              {/* Grid of Subject Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {subjects.map((subj, idx) => {
                  const sGrade = findGradeDataForSubject(subj.id, subj.name, gradesData);
                  const sCalc = calculateUeesGrade(sGrade, passingGrade);

                  // Decoración temática de imagen por materia estilo portal UEES
                  const isTech =
                    subj.name.toLowerCase().includes('base') ||
                    subj.name.toLowerCase().includes('datos') ||
                    subj.name.toLowerCase().includes('programac');
                  const isMath =
                    subj.name.toLowerCase().includes('matem') ||
                    subj.name.toLowerCase().includes('físic') ||
                    subj.name.toLowerCase().includes('fisic');

                  const bannerGradient = isTech
                    ? 'from-blue-600 via-indigo-700 to-purple-800'
                    : isMath
                    ? 'from-amber-600 via-orange-700 to-red-800'
                    : 'from-emerald-600 via-teal-700 to-cyan-800';

                  return (
                    <div
                      key={subj.id}
                      className="rounded-2xl border border-white/10 bg-[#060812] overflow-hidden flex flex-col justify-between shadow-lg hover:border-purple-500/40 transition-all group"
                    >
                      {/* Top Header Card con Banner estilo UEES */}
                      <div>
                        <div
                          className={`h-24 w-full bg-gradient-to-r ${bannerGradient} relative p-3 flex flex-col justify-between overflow-hidden`}
                        >
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                          <div className="flex items-center justify-between relative z-10">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider bg-black/40 backdrop-blur-md text-white border border-white/20">
                              Materia {idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase ${
                                sCalc.isPassed
                                  ? 'bg-emerald-500/90 text-white shadow-xs'
                                  : sCalc.passedAlready
                                  ? 'bg-emerald-500/90 text-white'
                                  : 'bg-black/60 text-stone-200 border border-white/20'
                              }`}
                            >
                              {sCalc.isPassed ? 'Aprobada ✓' : `Prom. ${sCalc.ueesAverageFormatted}`}
                            </span>
                          </div>

                          <div className="relative z-10">
                            <h4 className="font-black text-sm text-white uppercase tracking-wide drop-shadow-md line-clamp-2 leading-tight">
                              {subj.name}
                            </h4>
                          </div>
                        </div>

                        {/* Tabla de Registros estilo WSCLASS UEES */}
                        <div className="p-4 space-y-2 text-xs font-mono">
                          <div className="flex items-center justify-between py-1 border-b border-white/5">
                            <span className="text-stone-400">Registro 1 (30%):</span>
                            <span className="font-bold text-white text-sm">
                              {sGrade.p1 !== '' ? parseFloat(sGrade.p1).toFixed(2) : '-'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-white/5">
                            <span className="text-stone-400">Registro 2 (30%):</span>
                            <span className="font-bold text-white text-sm">
                              {sGrade.p2 !== '' ? parseFloat(sGrade.p2).toFixed(2) : '-'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-white/5">
                            <span className="text-stone-400">Registro 3 (40%):</span>
                            <span className="font-bold text-white text-sm">
                              {sGrade.p3 !== '' ? parseFloat(sGrade.p3).toFixed(2) : '-'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-white/5">
                            <span className="text-stone-400">Reposición:</span>
                            <span className="font-bold text-purple-300 text-sm">
                              {sGrade.repo && sGrade.repo !== '' ? parseFloat(sGrade.repo).toFixed(2) : '-'}
                            </span>
                          </div>

                          {/* Promedio Oficial Destacado */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="font-black text-xs uppercase tracking-wider text-pink-300">
                              Promedio UEES:
                            </span>
                            <span className="font-mono font-black text-xl text-emerald-400">
                              {sCalc.ueesAverageFormatted}
                            </span>
                          </div>

                          {/* Puntos y Requerimiento de Registro 3 */}
                          <div className="pt-2 text-[10px] text-stone-400 space-y-1">
                            <div className="flex justify-between">
                              <span>Puntos acumulados:</span>
                              <span className="text-stone-200 font-bold">{sCalc.accumulatedFormatted} / 10.0</span>
                            </div>

                            {sCalc.neededInR3 && (
                              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-200">
                                🎯 Necesitas en R3 (40%):{' '}
                                <strong className="text-pink-300 font-extrabold">{sCalc.neededInR3}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Docente Card Footer & Acción de Editar */}
                      <div>
                        <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-700/80 to-indigo-700/80 flex items-center justify-between text-white">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase tracking-wider block text-blue-200 font-mono">
                                Docente:
                              </span>
                              <span className="text-[11px] font-bold truncate block text-yellow-300">
                                {sGrade.teacher || 'Catedrático UEES'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSubjId(subj.id);
                              setActiveTab('simulator');
                            }}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-white/15 hover:bg-white/25 border border-white/20 transition-all cursor-pointer whitespace-nowrap ml-2"
                          >
                            Modificar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SIMULADOR Y AJUSTES */}
          {activeTab === 'simulator' && (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Selector de Materias (Pills) */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 font-mono">
                  SELECCIONA LA MATERIA A SIMULAR:
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {subjects.map((subj) => (
                    <button
                      key={subj.id}
                      onClick={() => setSelectedSubjId(subj.id)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-mono ${
                        selectedSubjId === subj.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md font-extrabold'
                          : isDark
                          ? 'bg-[#05070e] border border-white/10 text-stone-300 hover:border-purple-500/40'
                          : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {subj.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Materia Activa Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-pink-900/30 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 font-bold block">
                    Editando Calificaciones de:
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase font-mono">
                    {currentSubjectObj.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-400 font-mono block">Promedio Oficial:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {currentCalc.ueesAverageFormatted}
                  </span>
                </div>
              </div>

              {/* Inputs para Registros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Registro 1 */}
                <div
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isDark ? 'bg-[#05070e] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wide font-mono text-purple-300">
                      Registro 1
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      30%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentGrade.p1}
                    onChange={(e) => updateCurrentGrade('p1', e.target.value)}
                    placeholder="0.00"
                    className={`w-full text-center font-extrabold text-lg rounded-xl py-2 border outline-none font-mono ${
                      isDark
                        ? 'bg-[#0a0d17] border-white/10 text-white focus:border-purple-400'
                        : 'bg-white border-stone-300 text-stone-900 focus:border-purple-500'
                    }`}
                  />
                  <span className="text-[10px] text-stone-500 block text-center mt-1">Primer cómputo</span>
                </div>

                {/* Registro 2 */}
                <div
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isDark ? 'bg-[#05070e] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wide font-mono text-purple-300">
                      Registro 2
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      30%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentGrade.p2}
                    onChange={(e) => updateCurrentGrade('p2', e.target.value)}
                    placeholder="0.00"
                    className={`w-full text-center font-extrabold text-lg rounded-xl py-2 border outline-none font-mono ${
                      isDark
                        ? 'bg-[#0a0d17] border-white/10 text-white focus:border-purple-400'
                        : 'bg-white border-stone-300 text-stone-900 focus:border-purple-500'
                    }`}
                  />
                  <span className="text-[10px] text-stone-500 block text-center mt-1">Segundo cómputo</span>
                </div>

                {/* Registro 3 */}
                <div
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isDark ? 'bg-[#05070e] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wide font-mono text-purple-300">
                      Registro 3
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                      40%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentGrade.p3}
                    onChange={(e) => updateCurrentGrade('p3', e.target.value)}
                    placeholder="0.00"
                    className={`w-full text-center font-extrabold text-lg rounded-xl py-2 border outline-none font-mono ${
                      isDark
                        ? 'bg-[#0a0d17] border-white/10 text-white focus:border-purple-400'
                        : 'bg-white border-stone-300 text-stone-900 focus:border-purple-500'
                    }`}
                  />
                  <span className="text-[10px] text-stone-500 block text-center mt-1">Evaluación final</span>
                </div>
              </div>

              {/* Reposición y Catedrático */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Reposición */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#05070e] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wide font-mono text-yellow-400">
                      Reposición (Extraordinario)
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">Opcional</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentGrade.repo || ''}
                    onChange={(e) => updateCurrentGrade('repo', e.target.value)}
                    placeholder="Dejar vacío si no aplica"
                    className={`w-full text-left font-mono font-bold text-sm rounded-xl px-3 py-2 border outline-none ${
                      isDark
                        ? 'bg-[#0a0d17] border-white/10 text-yellow-300 focus:border-yellow-400'
                        : 'bg-white border-stone-300 text-stone-900 focus:border-yellow-500'
                    }`}
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Sustituye automáticamente la nota más baja si ayuda a subir el promedio final.
                  </p>
                </div>

                {/* Docente */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#05070e] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wide font-mono text-blue-300">
                      Catedrático / Docente
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentGrade.teacher || ''}
                    onChange={(e) => updateCurrentGrade('teacher', e.target.value)}
                    placeholder="Nombre del catedrático"
                    className={`w-full text-left font-mono font-bold text-sm rounded-xl px-3 py-2 border outline-none ${
                      isDark
                        ? 'bg-[#0a0d17] border-white/10 text-blue-200 focus:border-blue-400'
                        : 'bg-white border-stone-300 text-stone-900 focus:border-blue-500'
                    }`}
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Aparece reflejado en la tarjeta al estilo del portal de autogestión.
                  </p>
                </div>
              </div>

              {/* Indicador de reposición si aplica */}
              {currentCalc.replacedRegistro && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    La Reposición de <strong>{currentCalc.repo?.toFixed(2)}</strong> sustituyó automáticamente la nota del{' '}
                    <strong>Registro {currentCalc.replacedRegistro}</strong> con mayor ponderación.
                  </span>
                </div>
              )}

              {/* Tarjeta de Resumen Detallado y Proyección */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border font-mono ${
                  isDark ? 'bg-[#05070e] border-white/10' : 'bg-stone-100/80 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-stone-400 uppercase">
                    Promedio Oficial Portal UEES (1 decimal):
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {currentCalc.ueesAverageFormatted}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-stone-400 block text-[10px] uppercase">Puntaje Acumulado Exacto:</span>
                    <span className="text-sm font-black text-purple-300">
                      {currentCalc.accumulatedFormatted} / 10.0
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-stone-400 block text-[10px] uppercase">Promedio de lo Evaluado:</span>
                    <span className="text-sm font-black text-cyan-300">
                      {currentCalc.relativeAverage} / 10.0
                    </span>
                  </div>
                </div>

                {/* Meta para pasar con 6.0 */}
                {currentCalc.neededInR3 && (
                  <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200">
                    <div className="font-bold flex items-center justify-between">
                      <span>🎯 Meta para aprobar con {passingGrade.toFixed(1)}:</span>
                      <span className="text-sm font-black px-2 py-0.5 rounded bg-pink-500/25 text-pink-300 border border-pink-500/40">
                        {currentCalc.neededInR3} en R3 (40%)
                      </span>
                    </div>
                  </div>
                )}

                {/* Estado final si ya tiene notas */}
                {currentCalc.isPassed && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>¡Felicidades! Esta materia ya cuenta con puntaje de aprobación (≥ {passingGrade.toFixed(1)}). 🎉</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#060812]">
          <div className="text-[11px] text-stone-400 font-mono">
            Las calificaciones se sincronizan automáticamente con tu copia local y la nube.
          </div>
          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-purple-500/20 font-mono"
          >
            Cerrar y Aplicar ✓
          </button>
        </div>
      </div>
    </div>
  );
};
