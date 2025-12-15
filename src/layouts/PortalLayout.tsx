
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { LogOut, User, Circle } from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const { logout, user } = useAuth();
  
  // Extraer RUT del email falso para mostrarlo (123456789@grde.cl -> 123456789)
  const rutDisplay = user?.email ? user.email.split('@')[0].toUpperCase() : 'Funcionario';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            {/* Marca */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                 <Logo className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-slate-800 leading-tight">Mi Portal GRDE</h2>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Municipalidad</span>
              </div>
            </div>
            
            {/* Usuario y Acciones */}
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {rutDisplay}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        En Línea
                    </span>
                </div>
                
                <div className="h-8 w-px bg-slate-200 mx-1"></div>

                <button 
                    onClick={logout} 
                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all text-sm font-medium"
                    title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Salir</span>
                </button>
            </div>
        </div>
      </header>
      
      {/* Contenido Principal */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
