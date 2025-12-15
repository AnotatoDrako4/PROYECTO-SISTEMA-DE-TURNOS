
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-mono animate-pulse">VERIFICANDO ACCESO...</p>
        </div>
    );
  }

  // 1. Si no hay usuario logueado
  if (!user || !role) {
    // Si intentaba entrar a /admin, lo mandamos al login de admin
    if (location.pathname.startsWith('/admin')) {
        return <Navigate to="/sys-admin" state={{ from: location }} replace />;
    }
    // Para cualquier otra cosa (portal), al login público
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Si el rol no está permitido en esta ruta
  if (!allowedRoles.includes(role)) {
    // Caso: Un Funcionario intenta entrar a /admin -> Expulsar al Portal
    if (role === 'Funcionario' || role === 'Admin Depto') {
        return <Navigate to="/portal" replace />;
    }
    // Caso: Un Super Admin intenta entrar a /portal -> Expulsar al Admin Dashboard
    if (role === 'Super Admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // 3. Todo OK
  return <>{children}</>;
};
