
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Unit, Employee, MODALITY_OPTIONS } from '../types';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Unit, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  unit: Unit | null;
  managerSuggestions?: string[];
  isSaving?: boolean;
  saveError?: string | null;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  unit, 
  managerSuggestions = [],
  isSaving,
  saveError
}) => {
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [sigla, setSigla] = useState('');
  const [defaultModality, setDefaultModality] = useState<Employee['modality']>('5x2');
  const [status, setStatus] = useState<Unit['status']>('Activo');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && unit) {
      setName(unit.name);
      setManager(unit.manager);
      setSigla(unit.sigla || '');
      setDefaultModality(unit.defaultModality || '5x2');
      setStatus(unit.status || 'Activo');
    } else {
      // Reset for "Create" mode
      setName('');
      setManager('');
      setSigla('');
      setDefaultModality('5x2');
      setStatus('Activo');
    }
    setErrors({});
  }, [isOpen, unit]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "El nombre del departamento es obligatorio.";
    if (!manager.trim()) newErrors.manager = "Debe asignar un jefe o supervisor.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;
    
    // Al guardar, pasamos el objeto compatible con la interfaz Unit del frontend.
    // El hook useMockData se encargará de transformar esto a las columnas DB:
    // nombre, sigla, jefe_supervisor, modalidad, estado
    await onSave({
      id: unit?.id,
      name: name.trim(),
      manager: manager.trim(),
      sigla: sigla.trim().toUpperCase(),
      defaultModality,
      status,
    });
  };

  const title = unit ? "Editar Departamento" : "Añadir Nuevo Departamento";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSaving}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dept-name" className="block text-sm font-medium text-slate-300">Nombre del Departamento <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  id="dept-name" 
                  value={name} 
                  onChange={e => {
                    setName(e.target.value);
                    if (errors.name) setErrors({...errors, name: ''});
                  }} 
                  className={`mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/20 focus:border-primary focus:ring-primary'} text-slate-100`} 
                  placeholder="Ej: Dirección de Tránsito"
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
               <div>
                <label htmlFor="dept-sigla" className="block text-sm font-medium text-slate-300">Sigla (Acrónimo)</label>
                <input type="text" id="dept-sigla" value={sigla} onChange={e => setSigla(e.target.value.toUpperCase())} className="mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100" placeholder="Ej: TRANSITO"/>
              </div>
          </div>
          <div>
            <label htmlFor="dept-manager" className="block text-sm font-medium text-slate-300">Jefe / Supervisor <span className="text-red-400">*</span></label>
             <input 
                type="text" 
                id="dept-manager" 
                value={manager} 
                onChange={e => {
                  setManager(e.target.value);
                  if (errors.manager) setErrors({...errors, manager: ''});
                }} 
                className={`mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border ${errors.manager ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/20 focus:border-primary focus:ring-primary'} text-slate-100`}
                list="manager-suggestions"
                placeholder="Nombre del responsable"
              />
              <datalist id="manager-suggestions">
                {managerSuggestions.map(name => <option key={name} value={name} />)}
              </datalist>
            {errors.manager && <p className="text-xs text-red-400 mt-1">{errors.manager}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="dept-modality" className="block text-sm font-medium text-slate-300">Modalidad Principal</label>
                  <select id="dept-modality" value={defaultModality} onChange={e => setDefaultModality(e.target.value as Employee['modality'])} className="mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-xl bg-white/5 border-white/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-slate-100">
                      {MODALITY_OPTIONS.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
                  </select>
              </div>
               <div>
                  <label htmlFor="dept-status" className="block text-sm font-medium text-slate-300">Estado</label>
                  <select id="dept-status" value={status} onChange={e => setStatus(e.target.value as Unit['status'])} className="mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-xl bg-white/5 border-white/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-slate-100">
                      <option value="Activo" className="bg-slate-800">Activo</option>
                      <option value="Inactivo" className="bg-slate-800">Inactivo</option>
                      {/* Eliminado no se muestra al crear, solo se gestiona via botón eliminar */}
                      {unit && <option value="Eliminado" disabled className="bg-slate-800">Eliminado</option>}
                  </select>
              </div>
          </div>
        </fieldset>

        {saveError && (
          <div className="p-3 my-2 text-sm text-red-300 bg-red-500/20 rounded-lg border border-red-500/30" role="alert">
              <span className="font-bold">Error al guardar:</span> {saveError}
          </div>
        )}

        <div className="flex justify-end pt-4 space-x-2 border-t border-white/10 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" isLoading={isSaving} disabled={isSaving}>Guardar Cambios</Button>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentModal;
