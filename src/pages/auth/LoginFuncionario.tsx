
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatRut, validateRut } from '../../utils/rutUtils';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';

export const LoginFuncionario: React.FC = () => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginFuncionario } = useAuth();
  const navigate = useNavigate();

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Formato automático (12.345.678-9) al escribir
    setRut(formatRut(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rut || !password) {
        setError('Por favor complete todos los campos');
        return;
    }

    // Validación visual inmediata del RUT (Módulo 11)
    if (!validateRut(rut)) {
      setError('El RUT ingresado no es válido. Verifique el dígito verificador.');
      return;
    }

    setIsLoading(true);

    // La función loginFuncionario del contexto se encarga internamente de:
    // 1. Limpiar el RUT (12.345.678-9 -> 123456789)
    // 2. Generar el email interno (@grde.cl)
    // 3. Autenticar con Supabase
    const { error: loginError } = await loginFuncionario(rut, password);
    
    setIsLoading(false);

    if (loginError) {
      if (loginError.includes('Invalid login credentials')) {
          setError('RUT o contraseña incorrectos.');
      } else if (loginError.includes('not registered')) {
          setError('Este RUT no está registrado como funcionario activo.');
      } else {
          setError(loginError);
      }
    } else {
      navigate('/portal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-brand/10 p-4 rounded-2xl mb-4">
             <Logo className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Portal de Acceso GRDE</h1>
          <p className="text-slate-500 mt-2 text-sm">Acceso para Funcionarios y Administradores</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm shadow-sm">
            <p className="font-bold">Error de acceso</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ingrese su RUT</label>
            <input
              type="text" 
              value={rut}
              onChange={handleRutChange}
              placeholder="Ej: 12.345.678-9"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-brand/20 focus:border-brand outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-400"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-brand/20 focus:border-brand outline-none transition-all text-lg text-slate-800 placeholder:text-slate-400"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        
        <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
                ¿Olvidó su contraseña? Contacte a la Dirección de RRHH.
            </p>
        </div>
      </div>
    </div>
  );
};
