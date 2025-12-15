import React, { useState, useMemo, useEffect } from 'react';
import { useMockData } from '../hooks/useMockData';

// Import Layout & Page Components
import HorizontalNav from './layout/HorizontalNav';
import GeneralDashboardPage from './pages/GeneralDashboardPage';
import ShiftCalendarPage from './pages/ShiftCalendarPage';
import Planning247Page from './pages/Planning247Page';
import DepartmentsPage from './pages/DepartmentsPage';
import EmployeesPage from './pages/EmployeesPage';
import PermissionsPage from './pages/PermissionsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

// A simple page router
const pageComponents: { [key: string]: React.FC<any> } = {
  dashboard: GeneralDashboardPage,
  calendar: ShiftCalendarPage,
  planning: Planning247Page,
  departments: DepartmentsPage,
  employees: EmployeesPage,
  permissions: PermissionsPage,
  reports: ReportsPage,
  settings: SettingsPage,
};

const CacheWarningBanner: React.FC<{ error: string; onDismiss: () => void }> = ({ error, onDismiss }) => (
    <div className="relative p-4 mb-6 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 text-yellow-200">
        <button onClick={onDismiss} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20" aria-label="Cerrar advertencia">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h4 className="font-bold">Modo Desconectado</h4>
        <p className="text-sm mt-1">
            No se pudo conectar con el servidor para obtener datos actualizados. Estás viendo una versión guardada.
        </p>
         <p className="text-xs mt-2 text-yellow-400 font-mono bg-black/20 p-2 rounded">
            Detalle del error: {error.split('.')[0]}.
        </p>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ userEmail, onLogout }) => {
    const { data, loading, error, actions } = useMockData();
    const [activePage, setActivePage] = useState('dashboard');
    const [isCacheWarningVisible, setIsCacheWarningVisible] = useState(true);

    // Memoize the current user profile based on email
    const currentUserProfile = useMemo(() => {
        if (!data) return null;
        return data.userProfiles.find(p => p.email.toLowerCase() === userEmail.toLowerCase());
    }, [data, userEmail]);
    
    useEffect(() => {
        if(error) {
            setIsCacheWarningVisible(true);
        }
    }, [error]);

    if (loading && !data) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <svg className="animate-spin mx-auto h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-semibold">Cargando datos del sistema...</p>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex justify-center items-center h-screen p-4">
                <div className="w-full max-w-2xl p-8 space-y-4 rounded-3xl border border-red-500/50 bg-red-500/10 backdrop-blur-2xl text-left">
                    <h2 className="text-2xl font-bold text-red-300">Error Crítico al Cargar Datos</h2>
                    <p className="text-red-200">
                        Ocurrió un problema irrecuperable al intentar obtener los datos desde el servidor y no hay datos locales guardados.
                    </p>
                    <div className="mt-4 p-3 bg-black/30 rounded-lg text-sm text-slate-300 font-mono">
                        {error}
                    </div>
                     <p className="text-xs text-red-300 mt-2">
                        Por favor, intente recargar la página. Si el problema persiste, contacte al administrador del sistema.
                    </p>
                </div>
            </div>
        );
    }

    if (!data || !currentUserProfile) {
        return (
            <div className="flex justify-center items-center h-screen">
                 <div className="text-center">
                    <p className="text-lg font-semibold">No se pudieron cargar los datos o el perfil de usuario no es válido.</p>
                 </div>
            </div>
        );
    }

    const ActivePageComponent = pageComponents[activePage] || GeneralDashboardPage;

    return (
        <div className="flex h-screen">
            <HorizontalNav 
                activePage={activePage} 
                setActivePage={setActivePage}
                userProfile={currentUserProfile}
                onLogout={onLogout}
            />
            <main className="flex-1 overflow-y-auto pt-20 p-6">
                 {error && data && isCacheWarningVisible && (
                    <CacheWarningBanner error={error} onDismiss={() => setIsCacheWarningVisible(false)} />
                 )}
                 <ActivePageComponent 
                    data={data}
                    actions={actions}
                    userProfile={currentUserProfile}
                 />
            </main>
        </div>
    );
};

export default Dashboard;