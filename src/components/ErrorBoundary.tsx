import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó una excepción:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem('uees_academic_auth_v1');
      localStorage.removeItem('uees_active_username');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] bg-[#09090b] text-white flex items-center justify-center p-5 select-none font-sans">
          <div className="max-w-md w-full bg-[#111215] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white !text-black text-black flex items-center justify-center shadow-md">
              <AlertTriangle className="w-8 h-8 text-black stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase tracking-wider text-white">
                Dashboard Académico UEES
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ocurrió un contratiempo visual temporal al renderizar la vista. Tus materias y notas están a salvo.
              </p>
            </div>

            <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-[11px] text-zinc-400 font-mono text-left max-h-24 overflow-y-auto">
              <span>{this.state.error?.message || 'Error de renderizado en React'}</span>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 !text-black text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar / Recargar Dashboard</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10 active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Volver a Iniciar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
