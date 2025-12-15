
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Planning247Page from './pages/Planning247Page';
import ShiftCalendarPage from './pages/ShiftCalendarPage';
import GeneralDashboardPage from './pages/GeneralDashboardPage';
import { useMockData } from '../hooks/useMockData';

// Componentes Placeholder para modos aún no implementados totalmente
const PanelTurnosRotativos = () => (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Panel de Turnos Rotativos</h2>
        <p className="text-slate-500">Su modalidad (4x4 / 7x7) está activa. Este módulo está en construcción.</p>
    </div>
);

const DashboardDepto = () => (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Gestión de Departamento</h2>
        <p className="text-slate-500">Bienvenido, Administrador de Unidad. Aquí verá a su personal.</p>
    </div>
);

const ErrorModalidad = () => (
    <div className="p-8 bg-red-50 rounded-xl border border-red-100 text-center">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error de Configuración</h2>
        <p className="text-red-600">Su usuario no tiene una modalidad de turno asignada correctamente. Por favor contacte a Recursos Humanos.</p>
    </div>
);

export const RouterDinamicoModalidad: React.FC = () => {
  const { modalidad, role, user } = useAuth();
  const { data, actions } = useMockData(); // Reutilizamos el hook de datos existente

  // Loading state si los datos no han llegado
  if (!data || !user) return <div className="p-8 text-center text-slate-500">Cargando datos del funcionario...</div>;

  // Construir perfil básico para compatibilidad con componentes existentes
  const userProfile = {
      id: user.id,
      email: user.email || '',
      name: user.email?.split('@')[0] || 'Usuario',
      role: role as any,
      assignedDepartments: [],
      permissions: []
  };

  // 1. Prioridad: Si es Jefe de Departamento
  if (role === 'Admin Depto') return <DashboardDepto />;

  // 2. Lógica para Funcionarios según modalidad
  // Normalizamos la modalidad para evitar errores de mayúsculas/espacios
  const normalizedModality = modalidad?.toLowerCase().trim();

  if (normalizedModality === '24/7' || normalizedModality === '24x7') {
      return <Planning247Page data={data} actions={actions} userProfile={userProfile} />;
  }
  
  if (normalizedModality === '4x4' || normalizedModality === '7x7') {
      return <PanelTurnosRotativos />;
  }

  if (normalizedModality === '5x2') {
      return <ShiftCalendarPage data={data} actions={actions} userProfile={userProfile} />;
  }

  if (normalizedModality === 'administrativo') {
      return <GeneralDashboardPage data={data} actions={actions} userProfile={userProfile} />;
  }

  // Si no coincide con nada conocido
  return <ErrorModalidad />;
};
