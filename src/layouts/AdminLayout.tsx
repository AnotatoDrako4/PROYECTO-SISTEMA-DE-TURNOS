
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { LayoutDashboard, Users, Settings, LogOut, UserShield } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.includes(path) 
    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200";

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Sidebar Fijo */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col fixed h-full z-40">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
             <Logo className="w-6 h-6" />
          </div>
          <div>
             <span className="block text-lg font-bold text-white tracking-tight">GRDE</span>
             <span className="block text-[10px] text-indigo-400 font-bold tracking-widest uppercase">System Admin</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-2">Gestión Principal</div>
          
          <Link to="/admin/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('dashboard')}`}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          
          <Link to="/admin/usuarios" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('usuarios')}`}>
            <Users className="w-5 h-5" />
            Usuarios y Roles
          </Link>

          <div className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-6">Sistema</div>

          <Link to="/admin/config" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('config')}`}>
            <Settings className="w-5 h-5" />
            Configuración
          </Link>
        </nav>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                <UserShield className="w-4 h-4" />
             </div>
             <div className="overflow-hidden">
                 <p className="text-xs font-medium text-white truncate">Super Admin</p>
                 <p className="text-[10px] text-slate-500 truncate font-mono">{user?.email}</p>
             </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center justify-center gap-2 text-red-400 hover:text-white hover:bg-red-600 w-full px-4 py-2 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-red-500"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto bg-slate-950">
        <div className="max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
};
