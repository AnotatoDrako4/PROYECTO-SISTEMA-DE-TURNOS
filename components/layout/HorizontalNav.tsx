
import React from 'react';
import { motion } from 'framer-motion';
import Logo from '../ui/Logo';
import { UserProfile, UserRole } from '../../types';
import DashboardIcon from '../icons/DashboardIcon';
import CalendarIcon from '../icons/CalendarIcon';
import PlanningIcon from '../icons/PlanningIcon';
import FolderIcon from '../icons/FolderIcon';
import EmployeesIcon from '../icons/EmployeesIcon';
import PermissionsIcon from '../icons/PermissionsIcon';
import ReportsIcon from '../icons/ReportsIcon';
import SettingsIcon from '../icons/SettingsIcon';
import NotificationIcon from '../icons/NotificationIcon';

interface HorizontalNavProps {
    activePage: string;
    setActivePage: (page: string) => void;
    userProfile: UserProfile;
    onLogout: () => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard General', icon: DashboardIcon },
    { id: 'calendar', label: 'Calendario de Turnos', icon: CalendarIcon },
    { id: 'planning', label: 'Planificación 24/7', icon: PlanningIcon },
    { id: 'departments', label: 'Departamentos', icon: FolderIcon },
    { id: 'employees', label: 'Funcionarios', icon: EmployeesIcon },
    { id: 'permissions', label: 'Perfiles y Permisos', icon: PermissionsIcon, adminOnly: true },
    { id: 'reports', label: 'Reportes', icon: ReportsIcon, adminOnly: true },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon, adminOnly: true },
];

const NavItem: React.FC<{
    id: string;
    label: string;
    icon: React.FC<any>;
    isActive: boolean;
    onClick: () => void;
}> = ({ id, label, icon: Icon, isActive, onClick }) => (
    <li className="relative">
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
        {isActive && (
            <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand"
                layoutId="underline"
            />
        )}
    </li>
);

const HorizontalNav: React.FC<HorizontalNavProps> = ({ activePage, setActivePage, userProfile, onLogout }) => {
    
    const roleColors: Record<UserRole, string> = {
        [UserRole.SUPER_ADMIN]: 'bg-purple-500/50 text-purple-200 border-purple-400/50',
        [UserRole.DEPARTMENT_ADMIN]: 'bg-sky-500/50 text-sky-200 border-sky-400/50',
        [UserRole.STAFF_USER]: 'bg-green-500/50 text-green-200 border-green-400/50',
    };

    const isMasterAdmin = userProfile.email === 'juancarbajal453@gmail.com';
    
    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900/50 border-b border-white/10 backdrop-blur-xl z-30 flex items-center justify-between px-6 shadow-lg shadow-black/20">
            {/* Left side: Logo and Navigation */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <Logo className="w-8 h-8" />
                    <span className="font-bold text-lg hidden lg:block">Gestión de Turnos</span>
                </div>
                <ul className="flex items-center gap-2">
                    {navItems.map(item =>
                        (!item.adminOnly || userProfile.role === UserRole.SUPER_ADMIN) && (
                            <NavItem
                                key={item.id}
                                {...item}
                                isActive={activePage === item.id}
                                onClick={() => setActivePage(item.id)}
                            />
                        )
                    )}
                </ul>
            </div>

            {/* Right side: User info and actions */}
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <NotificationIcon className="w-6 h-6 text-slate-300"/>
                </button>
                <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${isMasterAdmin ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300' : 'bg-brand-dark border-transparent'}`}>
                        {userProfile.name.charAt(0)}
                    </div>
                    <div className="text-sm hidden md:block">
                        <p className="font-semibold text-slate-100 flex items-center gap-1">
                            {userProfile.name}
                            {isMasterAdmin && <span title="Acceso Maestro">👑</span>}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${roleColors[userProfile.role]}`}>
                            {userProfile.role}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Cerrar sesión"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-300">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                   </svg>
                </button>
            </div>
        </nav>
    );
};

export default HorizontalNav;
