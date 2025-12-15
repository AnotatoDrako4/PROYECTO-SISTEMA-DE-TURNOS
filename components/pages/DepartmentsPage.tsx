
import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { SystemData, UserProfile, Unit, Employee, UserRole } from '../../types';
import { useMockData } from '../../hooks/useMockData';
import DepartmentModal from '../DepartmentModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import DepartmentAIAssistant from '../DepartmentAIAssistant';
import SparklesIcon from '../icons/SparklesIcon';

interface DepartmentsPageProps {
  data: SystemData;
  actions: ReturnType<typeof useMockData>['actions'];
  userProfile: UserProfile;
}

const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ data, actions, userProfile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 1. Lógica de Filtrado de Seguridad
  const visibleUnits = useMemo(() => {
    // Si es Super Admin, ve todo
    if (userProfile.role === UserRole.SUPER_ADMIN) {
        return data.units;
    }
    // Si no, solo ve lo que está en su lista de assignedDepartments
    return data.units.filter(u => userProfile.assignedDepartments.includes(u.id));
  }, [data.units, userProfile]);

  const handleAddClick = () => {
    setEditingUnit(null);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (unit: Unit) => {
    setEditingUnit(unit);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (unit: Unit) => {
    setUnitToDelete(unit);
  };

  const handleConfirmDelete = async () => {
    if (unitToDelete) {
      try {
        await actions.deleteUnit(unitToDelete.id);
      } catch (e) {
        alert(`Error al eliminar: ${(e as Error).message}`);
      }
    }
    setUnitToDelete(null);
  };
  
  const handleSaveUnit = async (unitData: Omit<Unit, 'id' | 'createdAt'> & { id?: string }) => {
    setIsSaving(true);
    setSaveError(null);
    try {
        if(unitData.id){
            // When updating, we need to preserve the original createdAt
            const originalUnit = data.units.find(u => u.id === unitData.id);
            const payload: Unit = {
                ...originalUnit!, // Assume originalUnit is found
                ...unitData
            };
            await actions.updateUnit(payload);
        } else {
            await actions.addUnit(unitData);
        }
        setIsModalOpen(false);
    } catch (e) {
        setSaveError((e as Error).message);
    } finally {
        setIsSaving(false);
    }
  }

  const employeeCountByUnit = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const employee of data.employees) {
      counts[employee.unitId] = (counts[employee.unitId] || 0) + 1;
    }
    return counts;
  }, [data.employees]);
  
  const sortedUnits = useMemo(() => 
      [...visibleUnits].sort((a, b) => a.name.localeCompare(b.name)),
  [visibleUnits]);

  const managerSuggestions = useMemo(() => {
    const employeeNames = data.employees.map(e => e.name);
    const managerNames = data.units.map(u => u.manager);
    // Using a Set to get unique names
    return [...new Set([...employeeNames, ...managerNames])].sort();
  }, [data.employees, data.units]);

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-100">Gestión de Departamentos</h1>
            <p className="text-slate-400">Añadir, editar o eliminar departamentos asignados.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIsAIAssistantOpen(true)}>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Asistente IA
            </Button>
            {/* Solo Super Admin debería poder crear departamentos nuevos desde cero, 
                pero si se permite a Admin Depto, se deja visible. */}
            <Button onClick={handleAddClick}>
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                Añadir Departamento
            </Button>
        </div>
      </div>

      <Card>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                          <th className="p-4">Departamento</th>
                          <th className="p-4">Sigla</th>
                          <th className="p-4">Jefe Asignado</th>
                          <th className="p-4">Nº Funcionarios</th>
                          <th className="p-4">Fecha Creación</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4 text-right">Acciones</th>
                      </tr>
                  </thead>
                  <tbody>
                      {sortedUnits.length > 0 ? sortedUnits.map(unit => {
                        const isEliminado = unit.status === 'Eliminado';
                        return (
                          <tr key={unit.id} className={`border-b border-white/5 text-sm hover:bg-white/5 transition-colors ${isEliminado ? 'opacity-50' : ''}`}>
                              <td className={`p-4 font-medium ${isEliminado ? 'line-through' : ''}`}>{unit.name}</td>
                              <td className="p-4 text-slate-300 font-mono">{unit.sigla}</td>
                              <td className="p-4 text-slate-300">{unit.manager}</td>
                              <td className="p-4 text-slate-300">{employeeCountByUnit[unit.id] || 0}</td>
                              <td className="p-4 text-slate-300">{formatDate(unit.createdAt)}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  unit.status === 'Activo' ? 'bg-green-500/20 text-green-300' : 
                                  isEliminado ? 'bg-red-500/20 text-red-300' : 'bg-slate-700/50 text-slate-400'
                                }`}>
                                  {unit.status || 'Activo'}
                                </span>
                              </td>
                              <td className="p-4">
                                  <div className="flex gap-2 justify-end">
                                      <Button variant="secondary" onClick={() => handleEditClick(unit)} className="px-2 py-1 text-xs" disabled={isEliminado}><PencilIcon className="w-4 h-4"/></Button>
                                      <Button 
                                        variant="danger" 
                                        onClick={() => handleDeleteClick(unit)} 
                                        className="px-2 py-1 text-xs"
                                        disabled={isEliminado}
                                        title={isEliminado ? "Este departamento ya está eliminado" : "Eliminar departamento"}
                                      >
                                        <TrashIcon className="w-4 h-4"/>
                                      </Button>
                                  </div>
                              </td>
                          </tr>
                        )
                      }) : (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                                No tiene departamentos asignados o no se encontraron resultados.
                            </td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </Card>
      
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUnit}
        unit={editingUnit}
        managerSuggestions={managerSuggestions}
        isSaving={isSaving}
        saveError={saveError}
      />

      <ConfirmationModal
        isOpen={!!unitToDelete}
        onClose={() => setUnitToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar Departamento: "${unitToDelete?.name || ''}"`}
        message={`¿Estás seguro de que deseas eliminar el departamento "${unitToDelete?.name || ''}"? Esta acción cambiará su estado a "Eliminado" y no se puede deshacer.`}
      />

      <DepartmentAIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        actions={actions}
        units={visibleUnits} 
      />
    </div>
  );
};

export default DepartmentsPage;
