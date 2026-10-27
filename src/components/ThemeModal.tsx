import React from 'react';
import {
  X,
  Palette,
  Check,
  Moon,
  Sun,
  Laptop,
  Sparkles,
  Smartphone,
  Eye,
} from 'lucide-react';

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  tag: string;
  bgDark: string;
  cardDark: string;
  bgLight: string;
  cardLight: string;
  accent: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'aesthetic',
    name: 'Aesthetic Pastel',
    description: 'Lila suave, crema pastel y lavanda relajante estilo Notion / Pinterest',
    tag: 'Aesthetic ✨',
    bgDark: '#131022',
    cardDark: '#201b35',
    bgLight: '#faf7fd',
    cardLight: '#ffffff',
    accent: '#c084fc',
  },
  {
    id: 'titanium',
    name: 'Elegante Titanio',
    description: 'Minimalismo Linear & Vercel con alto contraste blanco y grafito',
    tag: 'Elegante ⚡',
    bgDark: '#09090b',
    cardDark: '#131417',
    bgLight: '#f4f4f2',
    cardLight: '#ffffff',
    accent: '#ffffff',
  },
  {
    id: 'oled',
    name: 'OLED Pure Black',
    description: 'Negro absoluto #000000 para ahorro extremo de batería en pantallas AMOLED',
    tag: 'Batería Ultra',
    bgDark: '#000000',
    cardDark: '#070709',
    bgLight: '#f8f8f8',
    cardLight: '#ffffff',
    accent: '#ffffff',
  },
  {
    id: 'emerald',
    name: 'Esmeralda Académico',
    description: 'Obsidiana profunda con acentos esmeralda institucionales UEES',
    tag: 'UEES Pro',
    bgDark: '#030c08',
    cardDark: '#071a13',
    bgLight: '#f0fdf4',
    cardLight: '#ffffff',
    accent: '#10b981',
  },
  {
    id: 'sepia',
    name: 'Café & Lectura',
    description: 'Tonos marfil cálidos y café espresso para descansar la vista',
    tag: 'Lectura 📖',
    bgDark: '#1a1614',
    cardDark: '#231e1a',
    bgLight: '#f5efe6',
    cardLight: '#ffffff',
    accent: '#d97706',
  },
];

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  themeMode: 'system' | 'dark' | 'light';
  onSelectThemeMode: (mode: 'system' | 'dark' | 'light') => void;
  activePalette: string;
  onSelectPalette: (paletteId: string) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  themeMode,
  onSelectThemeMode,
  activePalette,
  onSelectPalette,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] transition-colors ${
          isDark
            ? 'bg-[#131417] border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-white/10 bg-[#18191e]' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-white !text-black text-black border-white' : 'bg-black !text-white text-white border-black'
            }`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider font-mono ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                Temas & Apariencia
              </h3>
              <p className={`text-[10px] font-mono ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Personaliza los colores del dashboard y APK
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Selector de Modo (Sistema / Oscuro / Claro) */}
          <div className="space-y-2">
            <label className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Modo de Visualización
            </label>

            <div className={`p-1 rounded-2xl border grid grid-cols-3 gap-1 ${
              isDark ? 'bg-black/30 border-white/10' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <button
                onClick={() => onSelectThemeMode('system')}
                className={`py-2 px-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? isDark
                      ? 'bg-white !text-black text-black shadow-sm'
                      : 'bg-black !text-white text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>

              <button
                onClick={() => onSelectThemeMode('dark')}
                className={`py-2 px-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? isDark
                      ? 'bg-white !text-black text-black shadow-sm'
                      : 'bg-black !text-white text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Oscuro</span>
              </button>

              <button
                onClick={() => onSelectThemeMode('light')}
                className={`py-2 px-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? isDark
                      ? 'bg-white !text-black text-black shadow-sm'
                      : 'bg-black !text-white text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Claro</span>
              </button>
            </div>
          </div>

          {/* Paletas de Color Disponibles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Paleta de Color
              </label>
              <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {THEME_PALETTES.length} estilos
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {THEME_PALETTES.map((pal) => {
                const isSelected = activePalette === pal.id;

                return (
                  <button
                    key={pal.id}
                    onClick={() => onSelectPalette(pal.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? isDark
                          ? 'bg-white/10 border-white/30 shadow-md ring-1 ring-white/20'
                          : 'bg-zinc-100 border-zinc-900/30 shadow-md ring-1 ring-black/10'
                        : isDark
                        ? 'bg-black/20 hover:bg-white/5 border-white/10'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mini preview de color */}
                      <div
                        className="w-10 h-10 rounded-xl border border-white/15 flex flex-col overflow-hidden shrink-0 shadow-xs"
                        style={{ backgroundColor: isDark ? pal.bgDark : pal.bgLight }}
                      >
                        <div
                          className="h-1/2 w-full border-b border-white/10"
                          style={{ backgroundColor: isDark ? pal.cardDark : pal.cardLight }}
                        />
                        <div
                          className="h-1/2 w-full flex items-center justify-center"
                          style={{ backgroundColor: isDark ? pal.bgDark : pal.bgLight }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: pal.accent }}
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {pal.name}
                          </h4>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                            isSelected
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isDark
                              ? 'bg-white/5 text-zinc-400 border-white/10'
                              : 'bg-zinc-200 text-zinc-600 border-zinc-300'
                          }`}>
                            {pal.tag}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {pal.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-white !text-black text-black border-white'
                            : 'bg-black !text-white text-white border-black'
                          : isDark
                          ? 'border-white/20 bg-transparent text-transparent'
                          : 'border-zinc-300 bg-transparent text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'border-white/10 bg-[#131417]' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
            <Smartphone className="w-3 h-3" />
            <span>Sincronizado con Android 13</span>
          </div>

          <button
            onClick={onClose}
            className={`py-2 px-5 rounded-xl font-bold font-mono text-xs cursor-pointer border transition-all ${
              isDark
                ? 'bg-white !text-black text-black border-white hover:bg-zinc-200'
                : 'bg-black !text-white text-white border-black hover:bg-zinc-800'
            }`}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
