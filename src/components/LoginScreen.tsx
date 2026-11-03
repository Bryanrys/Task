import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Fingerprint,
  UserPlus,
  LogIn,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Compass,
  ArrowRight,
} from 'lucide-react';
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
  isBiometricUnlockEnabled,
  saveBiometricCredentials,
} from '../services/biometricService';
import { triggerHaptic } from '../services/hapticsService';
import {
  authenticateUser,
  registerNewUser,
  USER_ROLE_KEY,
  LOGGED_USER_KEY,
} from '../services/userService';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: 'admin' | 'user', isNewUser?: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Selector de perfil principal: Estudiante o Administrador
  const [profileType, setProfileType] = useState<'student' | 'admin'>('student');

  // Sub-pestaña para estudiante: Iniciar sesión o Registrarse
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login states
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Admin access state
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);

  // Register states
  const [regDisplayName, setRegDisplayName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);
  const [enableBiometricsCheckbox, setEnableBiometricsCheckbox] = useState<boolean>(() => isBiometricUnlockEnabled());

  useEffect(() => {
    checkBiometricAvailability().then((status) => {
      setIsBiometricAvailable(status.isAvailable);
    });
  }, []);

  const handleBiometricLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    await triggerHaptic('light');

    const result = await authenticateWithBiometrics(
      'Escanea tu huella dactilar para ingresar al Dashboard UEES'
    );

    setIsLoading(false);

    if (result.success) {
      const resolvedName = result.username || localStorage.getItem(LOGGED_USER_KEY) || 'Estudiante';
      const storedRole =
        (localStorage.getItem(USER_ROLE_KEY) as 'admin' | 'user') ||
        (resolvedName.toLowerCase() === 'admin' || resolvedName.toLowerCase() === 'uees' ? 'admin' : 'user');

      localStorage.setItem('uees_academic_auth_v1', 'authenticated');
      localStorage.setItem(LOGGED_USER_KEY, resolvedName);
      localStorage.setItem(USER_ROLE_KEY, storedRole);

      await triggerHaptic('success');
      onLoginSuccess(resolvedName, storedRole, false);
    } else if (result.error && !result.error.includes('cancel')) {
      setErrorMessage(result.error);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(async () => {
      try {
        const res = await authenticateUser(username, password);

        if (res.success && res.user) {
          if (enableBiometricsCheckbox && isBiometricAvailable) {
            try {
              await saveBiometricCredentials(res.user.displayName, password.trim());
            } catch (bioErr) {
              console.warn('No se pudo guardar credencial biométrica:', bioErr);
            }
          }

          await triggerHaptic('success').catch(() => {});
          onLoginSuccess(res.user.displayName, res.user.role, res.user.isNew || false);
        } else {
          setIsLoading(false);
          await triggerHaptic('warning').catch(() => {});
          setErrorMessage(res.error || 'Usuario o contraseña incorrectos.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || 'Error al iniciar sesión.');
      }
    }, 200);
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(async () => {
      try {
        const res = await authenticateUser('admin', adminPassword);

        if (res.success && res.user) {
          await triggerHaptic('success').catch(() => {});
          onLoginSuccess(res.user.displayName, 'admin', false);
        } else {
          setIsLoading(false);
          await triggerHaptic('warning').catch(() => {});
          setErrorMessage(res.error || 'Clave de administrador incorrecta.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || 'Error al ingresar como administrador.');
      }
    }, 200);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      triggerHaptic('warning').catch(() => {});
      return;
    }

    setIsLoading(true);

    setTimeout(async () => {
      try {
        const res = await registerNewUser(regUsername, regDisplayName, regPassword);

        if (res.success && res.user) {
          await triggerHaptic('success').catch(() => {});
          setSuccessMessage('¡Cuenta creada con éxito! Entrando a tu espacio...');

          setTimeout(() => {
            onLoginSuccess(res.user!.displayName, 'user', true);
          }, 250);
        } else {
          setIsLoading(false);
          await triggerHaptic('warning').catch(() => {});
          setErrorMessage(res.error || 'No se pudo crear la cuenta.');
        }
      } catch (err: any) {
        setIsLoading(false);
        await triggerHaptic('warning').catch(() => {});
        setErrorMessage(err?.message || 'Ocurrió un error al registrar la cuenta.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#07080a] flex items-center justify-center p-3 sm:p-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)] overflow-y-auto min-h-screen select-none">
      {/* Fondo estético sutil con luz ambiental */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Tarjeta de Vidrio de Alta Fidelidad Neo-Fintech */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[440px] p-5 sm:p-7 rounded-3xl space-y-4 border border-white/10 shadow-2xl relative z-10 my-auto text-white bg-[#0e1015]/95 backdrop-blur-xl"
      >
        {/* Cabecera Institucional Oficial UEES */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
              Universidad Evangélica de El Salvador
            </span>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white !text-black text-black flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-white tracking-wider font-mono">
                UEES DASHBOARD
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium">
                Ciclo II • 2026 • Sistema Académico
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Perfil Profesional: Estudiante vs Administrador */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setProfileType('student');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              profileType === 'student'
                ? 'bg-white !text-black text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Estudiante</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setProfileType('admin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              profileType === 'admin'
                ? 'bg-white !text-black text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Administrador</span>
          </button>
        </div>

        {/* Vista para Perfil Estudiante */}
        {profileType === 'student' ? (
          <>
            {/* Pestañas de Alternancia: Iniciar Sesión / Registrarse */}
            <div className="flex rounded-xl bg-white/[0.03] border border-white/10 p-0.5 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setActiveTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white/10 text-white font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setActiveTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white/10 text-white font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrarse</span>
              </button>
            </div>

            {activeTab === 'login' ? (
              <>
                {/* Acceso Rápido con Huella Dactilar (Biometría) */}
                {isBiometricAvailable && (
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-center">
                    <button
                      type="button"
                      onClick={handleBiometricLogin}
                      disabled={isLoading}
                      className="w-full py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 shadow-sm group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white !text-black text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Fingerprint className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <div className="text-left font-mono">
                        <span className="block font-black text-xs">Ingresar con Huella Dactilar</span>
                        <span className="block text-[10px] text-zinc-400">Ingreso biométrico seguro</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Formulario de Login para Estudiante */}
                <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
                  {/* Campo Usuario */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold font-mono text-zinc-300 uppercase tracking-wider">
                      Usuario de Estudiante
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none font-mono text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="tu_usuario"
                        required
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full pl-8 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold font-mono text-zinc-300 uppercase tracking-wider">
                      Contraseña
                    </label>
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
                        className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
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

                  {/* Checkbox Biometría */}
                  {isBiometricAvailable && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none pt-0.5">
                      <input
                        type="checkbox"
                        checked={enableBiometricsCheckbox}
                        onChange={(e) => setEnableBiometricsCheckbox(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                      />
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                        Recordar acceso con huella dactilar
                      </span>
                    </label>
                  )}

                  {/* Mensajes de Error */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-rose-400 font-semibold text-center bg-rose-500/10 border border-rose-500/25 py-2 px-3 rounded-xl font-mono"
                      >
                        {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Botón de Ingreso */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 !text-black text-black text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Ingresar a mi Dashboard</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Formulario de Registro para Nuevo Estudiante */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-zinc-400 space-y-1">
                  <p className="font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Espacio Estudiantil Personal
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Al registrarte obtendrás tus 20 semanas organizadas, cálculo de promedios UEES y respaldo en la nube.
                  </p>
                </div>

                {/* Nombre Completo / Apodo */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold font-mono text-zinc-300 uppercase tracking-wider">
                    Nombre Completo o Apodo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                      <User className="w-4 h-4 text-zinc-400" />
                    </span>
                    <input
                      type="text"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      placeholder="Ej. Carlos Gómez"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Nombre de Usuario */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold font-mono text-zinc-300 uppercase tracking-wider">
                    Usuario (para iniciar sesión)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none font-mono text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="ej. carlos2026"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full pl-8 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold font-mono text-zinc-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                      <Lock className="w-4 h-4 text-zinc-400" />
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crea tu clave segura"
                      required
                      className="w-full pl-10 pr-10 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold font-mono text-zinc-300 uppercase tracking-wider">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                      <Lock className="w-4 h-4 text-zinc-400" />
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repite tu clave"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Mensajes de Error y Éxito */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-rose-400 font-semibold text-center bg-rose-500/10 border border-rose-500/25 py-2 px-3 rounded-xl font-mono"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-emerald-400 font-semibold text-center bg-emerald-500/10 border border-emerald-500/25 py-2 px-3 rounded-xl font-mono"
                    >
                      {successMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón de Registro */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 !text-black text-black text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Crear mi Cuenta de Estudiante</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        ) : (
          /* Formulario Exclusivo para Administrador UEES */
          <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5 pt-1">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/15 text-xs text-zinc-300 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-white/10 text-white">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="font-bold text-white font-mono text-xs">Consola de Administración Central</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                Acceso reservado para gestión de colecciones globales, respaldo central de Supabase y configuración institucional.
              </p>
            </div>

            {/* Campo Clave Maestra de Administrador */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold font-mono text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Clave Maestra de Administrador</span>
                <span className="text-[10px] text-emerald-400 font-normal">Acceso Seguro</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                  <KeyRound className="w-4 h-4 text-zinc-400" />
                </span>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Ingresa la clave maestra (oo / 00)"
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={showAdminPassword ? 'Ocultar clave' : 'Ver clave'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-rose-400 font-semibold text-center bg-rose-500/10 border border-rose-500/25 py-2 px-3 rounded-xl font-mono"
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón de Ingreso Admin */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 !text-black text-black text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar a Consola de Administración</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Pie de seguridad */}
        <div className="text-center pt-2 border-t border-white/10 space-y-1">
          <p className="text-[10px] text-zinc-500 font-mono">
            Plataforma Académica Oficial UEES • Cifrado de Sesión
          </p>
        </div>
      </motion.div>
    </div>
  );
};
