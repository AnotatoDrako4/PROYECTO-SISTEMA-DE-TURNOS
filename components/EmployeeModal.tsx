
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { MODALITY_OPTIONS, type Employee, type Unit } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave returns Promise<void> per hooks definition
  onSave: (data: any) => Promise<void>;
  employee: Employee | null;
  units: Unit[];
}

function clean(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return String(value);
  return value.normalize("NFKC").trim();
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, employee, units }) => {
  const [rut, setRut] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [unitId, setUnitId] = useState("");
  const [modality, setModality] = useState<string>("5x2");
  const [status, setStatus] = useState<string>("Activo");
  const [weeklyTargetHours, setWeeklyTargetHours] = useState<string>("44");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeUnits = useMemo(() => units.filter(u => u.status !== 'Eliminado'), [units]);

  useEffect(() => {
    if (isOpen && employee) {
      setRut(employee.rut || "");
      // Use computed name if available, otherwise join nombre+apellido
      setName(employee.name || `${employee.nombre} ${employee.apellido}`.trim());
      setPosition(employee.cargo || ""); // Map from cargo
      setUnitId(employee.unitId || "");
      setModality(employee.modalidad_turno || "5x2"); // Map from modalidad_turno
      setStatus(employee.status || "Activo");
      setWeeklyTargetHours(String(employee.weekly_target_hours || 44)); // Map from weekly_target_hours
    } else {
      setRut("");
      setName("");
      setPosition("");
      setUnitId(activeUnits[0]?.id || "");
      setModality("5x2");
      setStatus("Activo");
      setWeeklyTargetHours("44");
    }
    setErrors({});
    setSaveError(null);
  }, [isOpen, employee, activeUnits]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const safeRut = clean(rut);
    const safeName = clean(name);
    const safePosition = clean(position);
    const safeUnitId = clean(unitId);

    if (!safeRut) newErrors.rut = "El RUT es obligatorio.";
    if (!safeName) newErrors.name = "El nombre es obligatorio.";
    if (!safePosition) newErrors.position = "El cargo es obligatorio.";
    if (!safeUnitId) newErrors.unitId = "El departamento es obligatorio.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;
    
    setIsSaving(true);
    setSaveError(null);

    // Prepare Payload compliant with useMockData saveEmployee
    const employeePayload = {
      id: employee?.id, 
      rut: clean(rut),
      name: clean(name), 
      position: clean(position),
      unitId: clean(unitId) || null,
      modality: clean(modality),
      status: clean(status),
      weeklyTargetHours: Number(weeklyTargetHours) || 0,
      
      // Explicit DB mapping fields if needed (useMockData handles these too)
      cargo: clean(position),
      modalidad_turno: clean(modality),
      weekly_target_hours: Number(weeklyTargetHours) || 0
    };
    
    try {
      await onSave(employeePayload);
      onClose(); 
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const title = employee ? "Editar Funcionario" : "Agregar Nuevo Funcionario";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-slate-300">RUT <span className="text-red-400">*</span></label>
            <input 
                type="text" 
                id="rut" 
                value={rut} 
                onChange={e => setRut(e.target.value)} 
                className="mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100" 
            />
            {errors.rut && <p className="text-xs text-red-400 mt-1">{errors.rut}</p>}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300">Nombre Completo <span className="text-red-400">*</span></label>
            <input 
                type="text" 
                id="name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100" 
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-slate-300">Cargo <span className="text-red-400">*</span></label>
          <input 
            type="text" 
            id="position" 
            value={position} 
            onChange={e => setPosition(e.target.value)} 
            className="mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100" 
            placeholder="Ej: Guardia de Seguridad" 
          />
          {errors.position && <p className="text-xs text-red-400 mt-1">{errors.position}</p>}
        </div>
        <div>
          <label htmlFor="unitId" className="block text-sm font-medium text-slate-300">Departamento <span className="text-red-400">*</span></label>
          <select 
            id="unitId" 
            value={unitId} 
            onChange={e => setUnitId(e.target.value || "")} 
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-xl bg-white/5 border-white/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-slate-100"
          >
            {activeUnits.map(u => <option key={u.id} value={u.id} className="bg-slate-800">{u.name}</option>)}
          </select>
          {errors.unitId && <p className="text-xs text-red-400 mt-1">{errors.unitId}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="modality" className="block text-sm font-medium text-slate-300">Modalidad de Turno</label>
            <select 
                id="modality" 
                value={modality} 
                onChange={e => setModality(e.target.value)} 
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-xl bg-white/5 border-white/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-slate-100"
            >
              {MODALITY_OPTIONS.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-300">Estado</label>
            <select 
                id="status" 
                value={status} 
                onChange={e => setStatus(e.target.value)} 
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-xl bg-white/5 border-white/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-slate-100"
            >
              <option value="Activo" className="bg-slate-800">Activo</option>
              <option value="Inactivo" className="bg-slate-800">Inactivo</option>
              <option value="Licencia" className="bg-slate-800">Licencia</option>
            </select>
          </div>
          <div>
            <label htmlFor="weeklyTargetHours" className="block text-sm font-medium text-slate-300">Horas Semanales</label>
            <input 
                type="number" 
                id="weeklyTargetHours" 
                value={weeklyTargetHours} 
                onChange={e => setWeeklyTargetHours(e.target.value)} 
                className="mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100" 
            />
          </div>
        </div>
        
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

export default EmployeeModal;
