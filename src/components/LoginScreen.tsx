import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, User, Lock, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const u = username.trim().toLowerCase();
      const p = password.trim();

      // Compatibilidad con credenciales: admin/uees y clave 'oo' / '00' (regla del sistema)
      const isUserValid = u === 'admin' || u === 'uees';
      const isPassValid = p === 'oo' || p === '00' || p === 'OO';

      if (isUserValid && isPassValid) {
        const resolvedName = username.trim() || 'Admin';
        localStorage.setItem('uees_academic_auth_v1', 'authenticated');
        localStorage.setItem('uees_logged_user', resolvedName);
        onLoginSuccess(resolvedName);
      } else {
        setIsLoading(false);
        setErrorMessage('Usuario o contraseña incorrectos. (Usa: admin / oo)');
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b0f19] flex items-center justify-center p-4 overflow-y-auto min-h-screen select-none">
      {/* Luces difuminadas prismáticas de fondo (Cyber-Cosmic UEES) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Tarjeta de Vidrio Esmerilado (Glass Card) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md p-7 sm:p-8 rounded-3xl space-y-6 border border-white/10 shadow-2xl relative z-10 my-auto text-white"
        style={{
          background: 'linear-gradient(145deg, rgba(19, 27, 46, 0.90) 0%, rgba(11, 15, 25, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Cabecera con Icono de Graduación Gradiente */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">
            UEES
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Inicia sesión con tus credenciales de administrador
          </p>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Campo Usuario */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-gray-300">Usuario</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                <User className="w-4 h-4 text-pink-400" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-10 pr-4 py-3 bg-black/45 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-gray-300">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                <Lock className="w-4 h-4 text-cyan-400" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                required
                className="w-full pl-10 pr-10 py-3 bg-black/45 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-xs text-pink-400 font-semibold text-center bg-pink-500/10 border border-pink-500/25 py-2 px-3 rounded-xl"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de Ingreso Tri-Gradiente */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-600 hover:via-purple-700 hover:to-cyan-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Pie de credenciales por defecto */}
        <div className="text-center pt-3 border-t border-white/10 space-y-1">
          <p className="text-[11px] text-gray-400 font-mono">
            Credenciales por defecto: Usuario <span className="text-pink-400 font-bold">admin</span> / Clave <span className="text-cyan-400 font-bold">oo</span>
          </p>
          <p className="text-[10px] text-gray-500">
            Compatible también con clave <span className="text-purple-400 font-semibold">00</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
