
import React from 'react';
import Card from '../ui/Card';
import { SystemData, UserProfile } from '../../types';
import { MODALITY_OPTIONS } from '../../types';
import ModalityPill from '../ui/ModalityPill';
import StatusBadge from '../ui/StatusBadge';
// FIX: Add import for useMockData to correctly type the 'actions' prop.
import { useMockData } from '../../hooks/useMockData';

interface GeneralDashboardPageProps {
    data: SystemData;
    userProfile: UserProfile;
    // FIX: Add 'actions' to props to align with Dashboard component's passed props, resolving a type error.
    actions: ReturnType<typeof useMockData>['actions'];
}

interface KpiCardProps {
    title: string;
    value: string | number;
    description: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, description }) => (
    <Card className="p-6">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
    </Card>
);

const GeneralDashboardPage: React.FC<GeneralDashboardPageProps> = ({ data, userProfile }) => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-100">Dashboard General</h1>
                <p className="text-slate-400">Bienvenido, {userProfile.name}. Aquí tienes un resumen del sistema.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Funcionarios" value={data.employees.length} description="Empleados activos en el sistema" />
                <KpiCard title="Total Departamentos" value={data.units.length} description="Unidades y departamentos gestionados" />
                <KpiCard title="Modalidades Activas" value={MODALITY_OPTIONS.length} description="Tipos de jornada configurados" />
                <KpiCard title="Intercambios Pendientes" value={data.shiftSwapRequests.filter(r => r.status === 'Pendiente').length} description="Solicitudes esperando aprobación" />
            </div>

            {/* Department Overview & Real Employee Data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-white mb-4">Funcionarios Cargados desde Google Sheets</h2>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-xs text-slate-400">
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">RUT</th>
                                    <th className="p-3">Departamento</th>
                                    <th className="p-3">Modalidad</th>
                                    <th className="p-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.employees.length > 0 ? data.employees.map(employee => (
                                    <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3 font-medium">
                                            <div className="flex items-center gap-3">
                                                <img src={employee.avatarUrl} alt={employee.name} className="h-8 w-8 rounded-full" />
                                                <div>
                                                    <p className="font-semibold text-slate-100">{employee.name}</p>
                                                    <p className="text-xs text-slate-400">{employee.position}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-slate-300 font-mono">{employee.rut}</td>
                                        <td className="p-3 text-slate-300">{employee.department}</td>
                                        <td className="p-3"><ModalityPill modality={employee.modality} /></td>
                                        <td className="p-3"><StatusBadge status={employee.status} /></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-slate-400">
                                            No se encontraron funcionarios en la hoja de cálculo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card>
                    <h2 className="text-lg font-semibold text-white mb-4">Alertas y Tareas</h2>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
                            <div className="w-5 h-5 flex-shrink-0 mt-1 rounded-full bg-yellow-500/50 flex items-center justify-center text-xs">!</div>
                            <div>
                                <p className="font-semibold text-sm text-yellow-200">Planificación 24/7 Incompleta</p>
                                <p className="text-xs text-yellow-400">Seguridad Ciudadana - Faltan 2 turnos para cerrar el mes.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10">
                             <div className="w-5 h-5 flex-shrink-0 mt-1 rounded-full bg-blue-500/50 flex items-center justify-center text-xs">i</div>
                            <div>
                                <p className="font-semibold text-sm text-blue-200">Cierre de mes</p>
                                <p className="text-xs text-blue-400">Fecha límite para tablas de turnos: 30 de Noviembre.</p>
                            </div>
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default GeneralDashboardPage;
