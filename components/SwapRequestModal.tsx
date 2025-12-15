import React, { useState, useEffect, useMemo } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { type Shift, type Employee, ShiftType } from '../types';

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSwapRequest: (targetEmployeeId: string, targetShiftId: string) => void;
  shift: Shift | null;
  employees: Employee[];
  shifts: Shift[];
  unitId: string;
}

const ShiftInfoCard: React.FC<{ title: string; employee?: Employee; shift?: Shift | null; }> = ({ title, employee, shift }) => {
    if (!employee || !shift) return null;
    return (
         <div className="p-4 rounded-xl bg-black/20 flex items-center gap-4">
            <img src={employee.avatarUrl} alt={employee.name} className="h-12 w-12 rounded-full border-2 border-white/20"/>
            <div>
                 <p className="text-xs text-slate-300 font-semibold">{title}</p>
                <p className="text-slate-100 font-bold">{employee.name}</p>
                <p className="text-slate-200 text-sm">
                    {new Date(shift.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-slate-300 text-xs">{shift.type} ({shift.startTime} - {shift.endTime})</p>
            </div>
        </div>
    )
};


const SwapRequestModal: React.FC<SwapRequestModalProps> = ({ isOpen, onClose, onCreateSwapRequest, shift, employees, shifts, unitId }) => {
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [targetShiftId, setTargetShiftId] = useState('');

  const colleagues = useMemo(() => 
    employees.filter(e => e.unitId === unitId && e.id !== shift?.employeeId),
    [employees, unitId, shift]
  );
  
  const targetEmployeeShifts = useMemo(() =>
    shifts.filter(s => s.employeeId === targetEmployeeId && s.type !== ShiftType.LIBRE),
    [shifts, targetEmployeeId]
  );

  useEffect(() => {
    if (!isOpen) {
        setTargetEmployeeId('');
        setTargetShiftId('');
    }
  }, [isOpen]);
  
  useEffect(() => {
    setTargetShiftId('');
  }, [targetEmployeeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployeeId || !targetShiftId) {
        alert("Por favor, seleccione un colega y un turno para intercambiar.");
        return;
    }
    onCreateSwapRequest(targetEmployeeId, targetShiftId);
  };

  const requester = employees.find(e => e.id === shift?.employeeId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Intercambio de Turno">
      {shift && requester ? (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <ShiftInfoCard title="MI TURNO" employee={requester} shift={shift} />
                <div className="text-2xl text-slate-400 font-light mx-2">↔</div>
                <div className="w-full">
                    <p className="text-xs text-slate-300 font-semibold mb-2">INTERCAMBIAR CON</p>
                    <div className="p-4 rounded-xl bg-black/20 space-y-3">
                         <div>
                            <label htmlFor="colleague-select" className="sr-only">Colega</label>
                            <select
                              id="colleague-select"
                              value={targetEmployeeId}
                              onChange={(e) => setTargetEmployeeId(e.target.value)}
                              className="block w-full pl-3 pr-10 py-2 text-base rounded-xl bg-white/5 border-white/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-slate-100"
                            >
                                <option value="">Seleccione un colega...</option>
                                {colleagues.map(e => <option key={e.id} value={e.id} className="bg-slate-800">{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="shift-select" className="sr-only">Turno</label>
                            <select
                              id="shift-select"
                              value={targetShiftId}
                              onChange={(e) => setTargetShiftId(e.target.value)}
                              disabled={!targetEmployeeId || targetEmployeeShifts.length === 0}
                              className="block w-full pl-3 pr-10 py-2 text-base rounded-xl bg-white/5 border-white/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-slate-100 disabled:opacity-50"
                            >
                                <option value="">
                                    {targetEmployeeId ? (targetEmployeeShifts.length > 0 ? 'Seleccione un turno...' : 'Sin turnos disponibles') : 'Seleccione un colega primero'}
                                </option>
                                {targetEmployeeShifts.map(s => <option key={s.id} value={s.id} className="bg-slate-800">
                                    {new Date(s.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {s.type}
                                </option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
          
          <div className="flex justify-end pt-4 space-x-2 border-t border-white/10 mt-6">
             <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
             <Button type="submit" disabled={!targetEmployeeId || !targetShiftId}>Enviar Solicitud</Button>
          </div>
        </form>
      ) : (
        <p>Cargando información...</p>
      )}
    </Modal>
  );
};

export default SwapRequestModal;