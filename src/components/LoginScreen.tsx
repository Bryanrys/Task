import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, User, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

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
        setErrorMessage('Usuario o contraseña incorrectos.');
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#09090b] flex items-center justify-center p-4 overflow-y-auto min-h-screen select-none">
      {/* Tarjeta de Vidrio Minimalista Negro y Blanco */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md p-8 rounded-3xl space-y-6 border border-white/10 shadow-2xl relative z-10 my-auto text-white bg-[#111215]"
      >
        {/* Cabecera con Icono Monocromático */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-zinc-950 flex items-center justify-center shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">
            UEES
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Inicia sesión con tus credenciales de administrador
          </p>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Campo Usuario */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-300">Usuario</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                <User className="w-4 h-4 text-zinc-400" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-300">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                <Lock className="w-4 h-4 text-zinc-400" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                required
                className="w-full pl-10 pr-10 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                className="text-xs text-rose-400 font-semibold text-center bg-rose-500/10 border border-rose-500/25 py-2 px-3 rounded-xl"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de Ingreso Monocromático */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Pie de seguridad */}
        <div className="text-center pt-3 border-t border-white/10 space-y-1">
          <p className="text-[11px] text-zinc-500 font-mono">
            Acceso seguro y privado • Sistema Académico UEES
          </p>
        </div>
      </motion.div>
    </div>
  );
};