import React, { useState, useMemo } from 'react';
import { SystemData, UserProfile, Unit, MODALITY_OPTIONS } from '../../types';
import Button from '../ui/Button';
import SettingsCard from '../ui/SettingsCard';
import ToggleSwitch from '../ui/ToggleSwitch';
import { useMockData } from '../../hooks/useMockData';
import DepartmentModal from '../DepartmentModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import UploadIcon from '../icons/UploadIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';

interface SettingsPageProps {
  data: SystemData;
  actions: ReturnType<typeof useMockData>['actions'];
  userProfile: UserProfile;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ data, actions }) => {
    const [isDeptModalOpen, setDeptModalOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

    const handleAddDept = () => {
        setEditingUnit(null);
        setDeptModalOpen(true);
    };

    const handleEditDept = (unit: Unit) => {
        setEditingUnit(unit);
        setDeptModalOpen(true);
    };

    const handleDeleteDept = (unitId: string) => {
        setDeletingUnitId(unitId);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if(deletingUnitId) actions.deleteUnit(deletingUnitId);
        setConfirmOpen(false);
    }
    
    // FIX: Made the function async and added await to correctly handle the promise-based update/add actions, resolving the type error.
    const handleSaveUnit = async (unitData: Omit<Unit, 'id' | 'createdAt'> & { id?: string }) => {
        if(unitData.id){
             const originalUnit = data.units.find(u => u.id === unitData.id);
             const payload: Unit = { ...originalUnit!, ...unitData };
             await actions.updateUnit(payload);
        } else {
            await actions.addUnit(unitData);
        }
    }

    const managerSuggestions = useMemo(() => {
        const employeeNames = data.employees.map(e => e.name);
        const managerNames = data.units.map(u => u.manager);
        return [...new Set([...employeeNames, ...managerNames])].sort();
    }, [data.employees, data.units]);

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-100">Configuración del Sistema</h1>
                <p className="text-slate-400">Gestionar parámetros globales, departamentos y reglas de negocio.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => alert("Valores por defecto restaurados.")}>Restaurar Valores</Button>
                <Button onClick={() => alert("Configuración guardada.")}>Guardar Configuración</Button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
                 <SettingsCard title="Configuración General" description="Parámetros globales del sistema de turnos.">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-slate-300">Horas semanales (min-max)</label>
                            <div className="flex gap-2 w-1/2">
                                <input type="number" defaultValue="40" className="w-full bg-white/10 border border-white/20 rounded-lg py-1 px-2 text-slate-100" />
                                <input type="number" defaultValue="44" className="w-full bg-white/10 border border-white/20 rounded-lg py-1 px-2 text-slate-100" />
                            </div>
                        </div>
                         <div className="flex justify-between items-center">
                            <label className="text-slate-300">Formato de hora</label>
                            <select className="w-1/2 bg-white/10 border border-white/20 rounded-lg py-1 px-2 text-slate-100">
                                <option>24 Horas</option>
                                <option>AM/PM</option>
                            </select>
                        </div>
                    </div>
                </SettingsCard>
                
                 <SettingsCard title="Gestión de Departamentos" description="Añadir, editar o desactivar departamentos.">
                     <div className="overflow-x-auto -mx-5 -mb-5">
                         <table className="w-full text-left text-sm">
                            <thead className="bg-white/5">
                                <tr className="text-xs text-slate-400">
                                    <th className="p-3">Departamento</th>
                                    <th className="p-3">Jefe</th>
                                    <th className="p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.units.map(unit => (
                                    <tr key={unit.id} className="border-b border-white/5">
                                        <td className="p-3 font-medium">{unit.name}</td>
                                        <td className="p-3 text-slate-300">{unit.manager}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button variant="secondary" onClick={() => handleEditDept(unit)} className="p-1 h-7 w-7 text-xs"><PencilIcon className="w-4 h-4"/></Button>
                                                <Button variant="danger" onClick={() => handleDeleteDept(unit.id)} className="p-1 h-7 w-7 text-xs"><TrashIcon className="w-4 h-4"/></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                     </div>
                     <Button onClick={handleAddDept} className="mt-4 w-full">Añadir Nuevo Departamento</Button>
                </SettingsCard>

                <SettingsCard title="Gestión de Funcionarios (Bulk)" description="Importar o modificar funcionarios en masa.">
                     <Button variant="secondary" className="w-full">
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Importar desde CSV / Excel
                     </Button>
                </SettingsCard>
                
                 <SettingsCard title="Opciones Avanzadas" description="Configuraciones de sistema de bajo nivel.">
                    <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <label className="text-slate-300">Zona Horaria</label>
                            <select className="w-1/2 bg-white/10 border border-white/20 rounded-lg py-1 px-2 text-slate-100">
                                <option>America/Santiago (CLT)</option>
                            </select>
                        </div>
                        <Button variant="secondary" className="w-full">Gestionar Feriados</Button>
                    </div>
                </SettingsCard>

            </div>
            <div className="space-y-8">
                <SettingsCard title="Reglas de Permisos y Accesos" description="Controlar qué pueden hacer los distintos roles.">
                    <div className="space-y-4">
                        <ToggleSwitch label="Funcionarios pueden editar sus propios turnos" />
                        <ToggleSwitch label="Supervisores pueden editar turnos de su equipo" defaultChecked={true} />
                        <ToggleSwitch label="Permitir solicitudes de intercambio de turnos" defaultChecked={true} />
                        <ToggleSwitch label="Requerir aprobación de admin para intercambios" defaultChecked={true} />
                    </div>
                </SettingsCard>

                <SettingsCard title="Configuración Módulo 24/7" description="Reglas específicas para el personal con jornada 24/7.">
                     <div className="space-y-4">
                        <ToggleSwitch label="Funcionarios pueden proponer su planificación 24/7" />
                        <div className="flex justify-between items-center">
                            <label className="text-slate-300">Máximo de noches consecutivas</label>
                            <input type="number" defaultValue="3" className="w-1/4 bg-white/10 border border-white/20 rounded-lg py-1 px-2 text-slate-100" />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-slate-300">Horas de descanso requeridas</label>
                            <input type="number" defaultValue="11" className="w-1/4 bg-white/10 border border-white/20 rounded-lg py-1 px-2 text-slate-100" />
                        </div>
                        <ToggleSwitch label="Activar alertas automáticas de sobrecarga" defaultChecked={true} />
                    </div>
                </SettingsCard>

                <SettingsCard title="Modalidades y Tipos de Turno" description="Definir las reglas para cada tipo de jornada laboral.">
                    <div className="space-y-2">
                        {MODALITY_OPTIONS.map(m => (
                            <div key={m} className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                                <span className="font-semibold text-slate-200">{m}</span>
                                <Button variant="secondary" className="text-xs py-1 px-2">Configurar</Button>
                            </div>
                        ))}
                    </div>
                </SettingsCard>
            </div>
        </div>

        <DepartmentModal 
            isOpen={isDeptModalOpen} 
            onClose={() => setDeptModalOpen(false)} 
            onSave={handleSaveUnit} 
            unit={editingUnit} 
            managerSuggestions={managerSuggestions} 
        />
        <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Eliminar Departamento" message="¿Estás seguro? Esta acción no se puede deshacer y solo es posible si no hay funcionarios asignados." />
    </div>
  );
};

export default SettingsPage;