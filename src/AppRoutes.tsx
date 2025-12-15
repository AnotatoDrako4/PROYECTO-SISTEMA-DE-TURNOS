
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginFuncionario } from './pages/auth/LoginFuncionario';
import { LoginAdmin } from './pages/auth/LoginAdmin';
import { AdminLayout } from './layouts/AdminLayout';
import { PortalLayout } from './layouts/PortalLayout';
import { AuthGuard } from './components/AuthGuard';
import { RouterDinamicoModalidad } from './components/RouterDinamicoModalidad';
import Dashboard from './components/Dashboard';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ----------------------------------------------------------------------
          RUTAS PÚBLICAS (LOGIN)
      ----------------------------------------------------------------------- */}
      {/* Login para Funcionarios (RUT) */}
      <Route path="/" element={<LoginFuncionario />} />

      {/* Login para Super Admin (Email) */}
      <Route path="/sys-admin" element={<LoginAdmin />} />


      {/* ----------------------------------------------------------------------
          RUTAS PRIVADAS: ADMINISTRADOR (Super Admin)
      ----------------------------------------------------------------------- */}
      <Route path="/admin" element={
        <AuthGuard allowedRoles={['Super Admin']}>
          <AdminLayout />
        </AuthGuard>
      }>
        {/* Redirección por defecto */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        {/* Módulos del Admin */}
        <Route path="dashboard/*" element={<Dashboard userEmail="admin@system" onLogout={()=>{}} />} />
        <Route path="usuarios" element={<div className="p-8 text-slate-400 text-center border-2 border-dashed border-slate-800 rounded-xl">Gestión de Usuarios (En construcción)</div>} />
        <Route path="config" element={<div className="p-8 text-slate-400 text-center border-2 border-dashed border-slate-800 rounded-xl">Configuración Global (En construcción)</div>} />
      </Route>


      {/* ----------------------------------------------------------------------
          RUTAS PRIVADAS: PORTAL FUNCIONARIO
      ----------------------------------------------------------------------- */}
      <Route path="/portal" element={
        <AuthGuard allowedRoles={['Funcionario', 'Admin Depto']}>
          <PortalLayout />
        </AuthGuard>
      }>
        {/* El index usa el Router Dinámico para decidir qué mostrar (24/7, 5x2, etc) */}
        <Route index element={<RouterDinamicoModalidad />} />
        
        <Route path="mi-perfil" element={<div className="p-4 text-slate-500">Mi Perfil (Próximamente)</div>} />
        <Route path="historial" element={<div className="p-4 text-slate-500">Historial (Próximamente)</div>} />
      </Route>


      {/* ----------------------------------------------------------------------
          FALLBACK
      ----------------------------------------------------------------------- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
