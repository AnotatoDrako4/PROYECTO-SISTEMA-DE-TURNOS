
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { ShiftType, type Employee, type Shift } from '../types';
import { calculateShiftDuration } from '../lib/scheduleUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Shift> & { employeeId: string; date: string }) => void;
  shiftData: Shift | { employeeId: string; date: string } | null;
  employees: Employee[];
  shifts: Shift[];
}

// --- HELPER COMPONENTS ---

/**
 * Custom Time Picker Component
 * Provides a dropdown interface for hours and minutes
 */
const TimePicker: React.FC<{
    label: string;
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}> = ({ label, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [hours, minutes] = value ? value.split(':') : ['00', '00'];

    const handleHourClick = (h: string) => {
        onChange(`${h}:${minutes}`);
    };

    const handleMinuteClick = (m: string) => {
        onChange(`${hours}:${m}`);
        setIsOpen(false); // Close after picking minutes usually implies done
    };

    const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutesList = ['00', '15', '30', '45'];

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-left text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
            >
                <span className="font-mono text-lg tracking-wider">{value || '--:--'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full mt-2 left-0 w-full z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl flex overflow-hidden h-64"
                    >
                        {/* Hours Column */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide border-r border-white/10">
                            <div className="p-2 text-xs text-center text-slate-500 font-semibold sticky top-0 bg-slate-800">HORA</div>
                            <div className="p-1 space-y-1">
                                {hoursList.map(h => (
                                    <button
                                        key={h}
                                        type="button"
                                        onClick={() => handleHourClick(h)}
                                        className={`w-full text-center py-1.5 rounded-lg text-sm font-mono transition-colors ${h === hours ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Minutes Column */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                             <div className="p-2 text-xs text-center text-slate-500 font-semibold sticky top-0 bg-slate-800">MIN</div>
                             <div className="p-1 space-y-1">
                                {minutesList.map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleMinuteClick(m)}
                                        className={`w-full text-center py-2 rounded-lg text-sm font-mono transition-colors ${m === minutes ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const QuickPresetChip: React.FC<{ label: string; times: { start: string; end: string }; onClick: (s: string, e: string) => void }> = ({ label, times, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(times.start, times.end)}
        className="px-3 py-1 bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/50 rounded-full text-xs text-slate-300 hover:text-white transition-all"
    >
        {label}
    </button>
);


// --- MAIN COMPONENT ---

/**
 * Calculates the start and end Date objects for a given shift.
 * Handles overnight shifts by advancing the end date.
 */
const getShiftDateRange = (
    date: string, 
    startTime: string | undefined, 
    endTime: string | undefined, 
    type: ShiftType
): [Date, Date] | null => {
    if (!startTime || !endTime) {
        return null;
    }

    const start = new Date(`${date}T${startTime}`);
    let end = new Date(`${date}T${endTime}`);

    // Handle overnight shifts by advancing the end date by one day
    if (type === ShiftType.NOCHE && endTime < startTime) {
        end.setDate(end.getDate() + 1);
    }
    return [start, end];
};

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, onSave, shiftData, employees, shifts }) => {
  const [type, setType] = useState<ShiftType>(ShiftType.DIURNO);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const employee = useMemo(() => 
    employees.find(e => e.id === shiftData?.employeeId), 
  [employees, shiftData]);

  useEffect(() => {
    if (shiftData && employee) {
      const isEditing = 'id' in shiftData;
      
      if (isEditing) {
        setType(shiftData.type);
        setStartTime(shiftData.startTime || '');
        setEndTime(shiftData.endTime || '');
        setNotes(shiftData.notes || '');
      } else {
        // Default new shift logic
        setType(ShiftType.DIURNO);
        // Default based on modality
        if (employee.modality === '5x2' || employee.modality === 'Administrativo') {
             setStartTime('08:30');
             setEndTime('17:30');
        } else if (employee.modality === '7x7') {
             setStartTime('07:00');
             setEndTime('19:00');
        } else {
             setStartTime('08:00');
             setEndTime('20:00');
        }
        setNotes('');
      }
      setValidationError(null);
    }
  }, [shiftData, employee]);

  const handleTypeChange = (newType: ShiftType) => {
    setType(newType);
    if (newType === ShiftType.NOCHE) {
        setStartTime('20:00');
        setEndTime('08:00');
    } else if (newType === ShiftType.DIURNO) {
        setStartTime('08:00');
        setEndTime('20:00');
    }
  };
  
  const calculatedHours = useMemo(() => {
    if (type === ShiftType.LIBRE || !startTime || !endTime) {
      return null;
    }
    const duration = calculateShiftDuration(startTime, endTime);
    return duration > 0 ? duration.toFixed(1) : null;
  }, [startTime, endTime, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftData) return;
    
    const isEditing = 'id' in shiftData;
    const shiftId = isEditing ? shiftData.id : null;
    const date = shiftData.date;
    const employeeId = shiftData.employeeId;

    setValidationError(null);

    if (type === ShiftType.LIBRE) {
        onSave({ id: shiftId || undefined, employeeId, date, type, startTime: undefined, endTime: undefined, notes });
        onClose();
        return;
    }

    if (!startTime || !endTime) {
        setValidationError("Debe especificar una hora de inicio y fin para este tipo de turno.");
        return;
    }
    
    if (type === ShiftType.DIURNO && startTime >= endTime) {
         setValidationError('La hora de fin es anterior a la de inicio. ¿Es un turno NOCHE? Si es así, cambie el tipo.');
         return;
    }

    const newShiftRange = getShiftDateRange(date, startTime, endTime, type);
    if (!newShiftRange) return;
    const [newShiftStart, newShiftEnd] = newShiftRange;

    // Check for overlaps (simplified for speed, can be robustified)
    const employeeShifts = shifts.filter(s => 
        s.employeeId === employeeId && 
        s.type !== ShiftType.LIBRE &&
        s.id !== shiftId
    );

    for (const existingShift of employeeShifts) {
        const existingShiftRange = getShiftDateRange(existingShift.date, existingShift.startTime, existingShift.endTime, existingShift.type);
        if (!existingShiftRange) continue;
        
        const [existingShiftStart, existingShiftEnd] = existingShiftRange;
        
        // Simple overlap check
        if (newShiftStart < existingShiftEnd && newShiftEnd > existingShiftStart) {
            const friendlyDate = new Date(existingShift.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
            setValidationError(`Conflicto de turno: Se superpone con el turno existente del ${friendlyDate} (${existingShift.startTime}-${existingShift.endTime}).`);
            return;
        }
    }
    
    onSave({
      id: shiftId || undefined,
      employeeId,
      date,
      type,
      startTime,
      endTime,
      notes,
    });
    onClose();
  };

  const handleQuickPreset = (start: string, end: string) => {
      setStartTime(start);
      setEndTime(end);
      // Auto-detect type based on times (heuristic)
      if (start >= end) setType(ShiftType.NOCHE);
      else setType(ShiftType.DIURNO);
  }

  const isTimeInputDisabled = type === ShiftType.LIBRE;
  const title = shiftData && 'id' in shiftData ? "Modificar Turno" : "Añadir Turno";
  const date = shiftData?.date;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {shiftData && employee && date ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/50 border border-white/5 flex justify-between items-center">
             <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Funcionario</p>
                <p className="text-slate-100 font-medium">{employee.name}</p>
             </div>
             <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Fecha</p>
                <p className="text-slate-100 font-medium">{new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
             </div>
          </div>
          
          {/* Shift Type Selector */}
          <div>
            <label htmlFor="shift-type" className="block text-sm font-medium text-slate-300 mb-1">Tipo de Turno</label>
            <div className="grid grid-cols-3 gap-2">
                {Object.values(ShiftType).map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                            type === t 
                            ? 'bg-brand text-white shadow-lg ring-1 ring-white/20' 
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>
          </div>

          {/* Time Selection */}
          {!isTimeInputDisabled && (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Horario</label>
                    {/* Quick Presets */}
                    <div className="flex gap-2">
                        <QuickPresetChip label="08-20" times={{start: '08:00', end: '20:00'}} onClick={handleQuickPreset} />
                        <QuickPresetChip label="20-08" times={{start: '20:00', end: '08:00'}} onClick={handleQuickPreset} />
                        <QuickPresetChip label="Admin" times={{start: '08:30', end: '17:30'}} onClick={handleQuickPreset} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <TimePicker 
                        label="Hora Inicio" 
                        value={startTime} 
                        onChange={setStartTime} 
                        disabled={isTimeInputDisabled} 
                    />
                    <TimePicker 
                        label="Hora Fin" 
                        value={endTime} 
                        onChange={setEndTime} 
                        disabled={isTimeInputDisabled} 
                    />
                </div>
            </div>
          )}
          
          {/* Duration Indicator */}
          {calculatedHours !== null && (
             <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-brand/10 border border-brand/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm text-brand-100">Duración: <span className="font-bold">{calculatedHours} horas</span></span>
             </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="shift-notes" className="block text-sm font-medium text-slate-300">Notas Adicionales</label>
            <textarea
              id="shift-notes"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1 block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100 placeholder:text-slate-500"
              placeholder="Opcional: Cobertura, extras..."
            />
          </div>

          {/* Validation Errors */}
          {validationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <p className="text-sm text-red-200">{validationError}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-3 border-t border-white/10">
             <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
             <Button type="submit">Guardar Turno</Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      )}
    </Modal>
  );
};

export default ShiftModal;
