
import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { SystemData, UserProfile, Employee, MODALITY_OPTIONS, Unit, UserRole } from '../../types';
import ModalityPill from '../ui/ModalityPill';
import StatusBadge from '../ui/StatusBadge';
import SortIcon from '../icons/SortIcon';
import SortAscIcon from '../icons/SortAscIcon';
import SortDescIcon from '../icons/SortDescIcon';
import UserPlusIcon from '../ui/icons/UserPlusIcon';
import EmployeeModal from '../EmployeeModal';
import AltaFuncionarioModal from '../AltaFuncionarioModal'; // Importamos el nuevo modal
import { useMockData } from '../../hooks/useMockData';
import ConfirmationModal from '../ui/ConfirmationModal';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import Pagination from '../ui/Pagination';
import { ShieldCheck } from 'lucide-react';

interface EmployeesPageProps {
  data: SystemData;
  actions: ReturnType<typeof useMockData>['actions'];
  userProfile: UserProfile;
}

const EmployeesPage: React.FC<EmployeesPageProps> = ({ data, actions, userProfile }) => {
    type SortableKeys = 'name' | 'department' | 'modality' | 'status';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAltaModalOpen, setIsAltaModalOpen] = useState(false); // Estado para el nuevo modal
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [modalityFilter, setModalityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const visibleUnits = useMemo(() => {
        if (userProfile.role === UserRole.SUPER_ADMIN) return data.units;
        return data.units.filter(u => userProfile.assignedDepartments.includes(u.id));
    }, [data.units, userProfile]);

    const visibleEmployees = useMemo(() => {
        if (userProfile.role === UserRole.SUPER_ADMIN) return data.employees;
        return data.employees.filter(e => userProfile.assignedDepartments.includes(e.unitId));
    }, [data.employees, userProfile]);

    const handleAddClick = () => {
        setEditingEmployee(null);
        setIsModalOpen(true);
    };

    // Nuevo handler para Alta de Sistema
    const handleAltaClick = () => {
        setIsAltaModalOpen(true);
    };

    const handleEditClick = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (employeeId: string) => {
        setDeletingEmployeeId(employeeId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if(deletingEmployeeId){
            actions.deleteEmployee(deletingEmployeeId);
        }
        setIsConfirmOpen(false);
        setDeletingEmployeeId(null);
    };
    
    const clearFilters = () => {
        setSearchQuery('');
        setDepartmentFilter('');
        setModalityFilter('');
        setStatusFilter('');
        setCurrentPage(1);
    }
    
    const filteredEmployees = useMemo(() => {
        return visibleEmployees
            .filter(e => searchQuery ? (e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.rut.includes(searchQuery)) : true)
            .filter(e => departmentFilter ? e.unitId === departmentFilter : true)
            .filter(e => modalityFilter ? e.modality === modalityFilter : true)
            .filter(e => statusFilter ? e.status === statusFilter : true);

    }, [visibleEmployees, searchQuery, departmentFilter, modalityFilter, statusFilter]);

    const sortedEmployees = useMemo(() => {
        let sortableItems = [...filteredEmployees];
        sortableItems.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (sortConfig.key === 'department') {
                aValue = data.units.find(u => u.id === a.unitId)?.name || '';
                bValue = data.units.find(u => u.id === b.unitId)?.name || '';
            } else {
                aValue = a[sortConfig.key];
                bValue = b[sortConfig.key];
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredEmployees, data.units, sortConfig]);
    
    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedEmployees.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedEmployees, currentPage, itemsPerPage]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) return <SortIcon className="w-4 h-4 inline-block ml-1 text-slate-500 group-hover:text-slate-200 transition-colors" />;
        if (sortConfig.direction === 'asc') return <SortAscIcon className="w-4 h-4 inline-block ml-1 text-brand" />;
        return <SortDescIcon className="w-4 h-4 inline-block ml-1 text-brand" />;
    };

    const SortableHeader: React.FC<{ sortKey: SortableKeys; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th className="p-4">
            <button onClick={() => requestSort(sortKey)} className="flex items-center group font-semibold text-slate-300 hover:text-white transition-colors" aria-label={`Sort by ${children}`}>
                {children}{getSortIcon(sortKey)}
            </button>
        </th>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-100">Gestión de Funcionarios</h1>
            <p className="text-slate-400">Buscar, filtrar y gestionar al personal del sistema.</p>
        </div>
        <div className="flex gap-3">
            {/* Botón Alta Sistema */}
            <Button variant="secondary" onClick={handleAltaClick} className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30 hover:text-white">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Alta Sistema (Login)
            </Button>
            {/* Botón Simple */}
            <Button onClick={handleAddClick}>
                <UserPlusIcon className="w-5 h-5 mr-2"/>
                Ficha Simple
            </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-4">
            <input type="text" placeholder="Buscar por RUT o Nombre..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 px-4 text-slate-100 focus:ring-brand focus:border-brand placeholder:text-slate-400" />
            <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand">
                <option value="">Todos los Departamentos</option>
                {visibleUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={modalityFilter} onChange={e => setModalityFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand"><option value="">Todas las Modalidades</option>{MODALITY_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}</select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand"><option value="">Cualquier Estado</option><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select>
            <Button variant="secondary" onClick={clearFilters}>Limpiar Filtros</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs">
                <SortableHeader sortKey="name">Nombre</SortableHeader>
                <th className="p-4 font-semibold text-slate-300">RUT</th>
                <SortableHeader sortKey="department">Departamento</SortableHeader>
                <SortableHeader sortKey="modality">Modalidad</SortableHeader>
                <SortableHeader sortKey="status">Estado</SortableHeader>
                <th className="p-4 font-semibold text-slate-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map(employee => {
                const department = data.units.find(u => u.id === employee.unitId)?.name;
                return (
                  <tr key={employee.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-3">
                        <img src={employee.avatarUrl} alt={employee.name} className="h-10 w-10 rounded-full" />
                        <div>
                          <p className="font-semibold text-slate-100">{employee.name}</p>
                          <p className="text-xs text-slate-400">{employee.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono">{employee.rut}</td>
                    <td className="p-4 text-slate-300">{department}</td>
                    <td className="p-4"><ModalityPill modality={employee.modality} /></td>
                    <td className="p-4"><StatusBadge status={employee.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handleEditClick(employee)} className="px-2 py-1 text-xs"><PencilIcon className="w-4 h-4" /></Button>
                        <Button variant="danger" onClick={() => handleDeleteClick(employee.id)} className="px-2 py-1 text-xs"><TrashIcon className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
           {paginatedEmployees.length === 0 && <p className="text-center p-8 text-slate-400">No se encontraron funcionarios con los filtros aplicados.</p>}
        </div>
        {filteredEmployees.length > itemsPerPage && (
            <Pagination
                currentPage={currentPage}
                totalItems={filteredEmployees.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        )}
      </Card>
      
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={actions.saveEmployee}
        employee={editingEmployee}
        units={visibleUnits}
      />

      {/* Modal de Alta con Auth */}
      <AltaFuncionarioModal
        isOpen={isAltaModalOpen}
        onClose={() => setIsAltaModalOpen(false)}
        onRegister={actions.registerOfficial}
        units={visibleUnits}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Funcionario"
        message="¿Estás seguro de que deseas eliminar este funcionario? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default EmployeesPage;
