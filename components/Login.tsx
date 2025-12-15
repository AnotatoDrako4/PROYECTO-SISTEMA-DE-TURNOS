
import React, { useState } from 'react';
import Button from './ui/Button';
import Logo from './ui/Logo';
import { auth } from '../lib/auth';
import { motion } from 'framer-motion';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

function sanitizeInput(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFKC")
    .replace(/[\u200B-\u200F\uFEFF\u00A0]/g, "") // invisible chars
    .trim();
}

function normalizeUserInput(value: string): string {
    const v = value.trim();
    if (v.includes("@")) return v.toLowerCase(); // es un email real

    // Es un RUT → limpiarlo
    const rutLimpio = v.replace(/\./g, "").replace(/-/g, "").toLowerCase();

    // Convertir a email interno del sistema
    return `${rutLimpio}@grde.cl`;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawInput = sanitizeInput(email);
    const cleanPass = sanitizeInput(password);

    if (!rawInput || !cleanPass) {
      setError("Por favor complete todos los campos.");
      return;
    }

    setIsLoading(true);

    try {
      // Normalizar: Si es RUT convierte a email ficticio, si es email lo deja igual
      const finalEmail = normalizeUserInput(rawInput);

      const result = await auth.login(finalEmail, cleanPass);

      if (result.success) {
        onLoginSuccess(finalEmail);
      } else {
        setError(result.error || 'Credenciales inválidas.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Error de conexión. Intente nuevamente.');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md relative"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl" />

        <div className="relative z-10 p-8 space-y-8">
          
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                <Logo className="w-16 h-16" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Acceso Municipal
            </h2>
            <p className="text-sm text-slate-300">Gestión de Turnos y RRHH</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase ml-1">
                RUT o Correo Electrónico
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">👤</span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-3 rounded-xl bg-black/20 border border-white/10 text-slate-100 focus:ring-2 focus:ring-brand outline-none"
                  placeholder="Ingrese su RUT o correo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔒</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-3 py-3 rounded-xl bg-black/20 border border-white/10 text-slate-100 focus:ring-2 focus:ring-brand outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm text-center font-medium"
              >
                ⚠️ {error}
              </motion.div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full py-3.5" isLoading={isLoading}>
              Ingresar
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              ¿Problemas de acceso? Contacte al Depto. de Informática.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
