
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, Terminal } from 'lucide-react';

export const LoginAdmin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
        setError("Credenciales requeridas");
        return;
    }

    setIsLoading(true);
    const { error: loginError } = await loginAdmin(email, password);
    setIsLoading(false);
    
    if (loginError) {
      setError('Acceso denegado: Credenciales inválidas o permisos insuficientes.');
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-mono text-slate-200">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-md rounded-none border border-indigo-900/50 p-8 relative shadow-2xl shadow-indigo-900/20">
        {/* Technical Header */}
        <div className="flex items-start justify-between mb-8 border-b border-indigo-900/30 pb-4">
          <div>
            <h2 className="text-lg font-bold text-indigo-400 tracking-widest uppercase flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              PANEL DE ADMINISTRACIÓN DE SISTEMA
            </h2>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-wider">Nivel Root • Acceso Restringido</p>
          </div>
          <ShieldCheck className="w-8 h-8 text-indigo-600 opacity-50" />
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border-l-2 border-red-500 text-red-400 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID de Sistema o Correo</label>
            <div className="relative group">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-700 text-sm"
                autoComplete="username"
                placeholder="admin@grde.cl o ID"
                disabled={isLoading}
                />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clave Maestra</label>
            <div className="relative group">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-700 text-sm"
                autoComplete="current-password"
                placeholder="CLAVE MAESTRA"
                disabled={isLoading}
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 transition duration-200 uppercase tracking-widest text-xs mt-4 flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Verificando Credenciales...' : 'Autenticar Sistema'}
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-indigo-900/30 text-center opacity-60 hover:opacity-100 transition-opacity">
            <p className="text-[9px] text-indigo-300 font-mono">
                SECURE CONNECTION ESTABLISHED :: IP LOGGED
            </p>
        </div>
      </div>
    </div>
  );
};
