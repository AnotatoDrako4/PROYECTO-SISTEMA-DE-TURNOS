
import React, { useMemo, useState, Fragment, useCallback } from 'react';
import { type SystemData, type Shift, type Observation, ShiftType, ObservationType, Employee, ShiftSwapStatus } from '../types';
import Card from './ui/Card';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import ShiftContextMenu from './ui/ShiftContextMenu';
import ShiftTooltip from './ui/ShiftTooltip';
import { generateAutoShifts, calculateShiftDuration } from '../lib/scheduleUtils';
import Pagination from './ui/Pagination';

interface CalendarViewProps {
  allData: SystemData;
  unitId: string;
  dateRange: { start: Date, end: Date };
  shiftTypeFilter: ShiftType | '';
  modalityFilter: string | ''; 
  searchQuery: string;
  onAddShift: (employeeId: string, date: string) => void;
  onModifyShift: (shift: Shift) => void;
  onRequestSwap: (shift: Shift) => void;
  // Nuevas props para las acciones del menú contextual
  onDeleteShift: (id: string) => Promise<void>;
  onBatchSaveShifts: (shifts: Partial<Shift>[]) => Promise<void>;
}

const ShiftTypePill: React.FC<{ type: ShiftType }> = ({ type }) => {
    const text = type === ShiftType.DIURNO ? 'D' : type === ShiftType.NOCHE ? 'N' : 'L';
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const responsiveClasses = "sm:inline-block hidden";
    const abbreviatedClasses = "sm:hidden inline-block";

    const colorClasses: Record<ShiftType, string> = {
        [ShiftType.DIURNO]: "bg-sky-500/20 text-sky-300",
        [ShiftType.NOCHE]: "bg-indigo-500/20 text-indigo-300",
        [ShiftType.LIBRE]: "bg-slate-700/50 text-slate-400"
    }

    return (
        <>
            <span className={`${baseClasses} ${responsiveClasses} ${colorClasses[type]}`}>{type}</span>
            <span className={`${baseClasses} ${abbreviatedClasses} ${colorClasses[type]}`}>{text}</span>
        </>
    );
}

const ModalityPill: React.FC<{ modality: string }> = ({ modality }) => {
  const modalityStyles: Record<string, string> = {
    '24/7': 'bg-red-500/20 text-red-300',
    '4x4': 'bg-purple-500/20 text-purple-300',
    '7x7': 'bg-orange-500/20 text-orange-300',
    'Administrativo': 'bg-green-500/20 text-green-300',
    '5x2': 'bg-sky-500/20 text-sky-300',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block mt-1 ${modalityStyles[modality] || 'bg-slate-500/20'}`}>
      {modality}
    </span>
  );
};

// COMPONENTE NUEVO: Icono de Alerta consolidado
const ShiftAlertIcon: React.FC<{ observations: Observation[] }> = ({ observations }) => {
    if (!observations || observations.length === 0) return null;

    // Determinar severidad (Rojo si falta horas o descanso, Amarillo para advertencias leves)
    const hasCritical = observations.some(o => 
        o.type === ObservationType.MISSING_HOURS || 
        o.type === ObservationType.REST_VIOLATION
    );
    
    const colorClass = hasCritical ? "text-red-400" : "text-yellow-400";

    return (
        <div className="relative group z-10" onClick={(e) => e.stopPropagation()}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${colorClass}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            
            {/* Tooltip Flotante */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50 hidden group-hover:block pointer-events-none origin-bottom">
                <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${colorClass}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs font-bold text-slate-200">Observaciones</p>
                </div>
                <ul className="space-y-2">
                    {observations.map((obs, idx) => (
                        <li key={idx} className="text-xs text-slate-400 flex flex-col">
                            <span className="font-semibold text-slate-300">{obs.type}</span>
                            <span>{obs.description}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const NoteIcon: React.FC<{ note: string }> = ({ note }) => {
    return (
        <div className="relative group">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className={`
                absolute bottom-full mb-2 w-max max-w-xs bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 
                p-2 text-slate-200 text-xs
                transition-all duration-200 origin-bottom
                opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 
                pointer-events-none group-hover:pointer-events-auto
            `}>
                {note}
            </div>
        </div>
    );
};

const SwapStatusIcon: React.FC<{ status: ShiftSwapStatus }> = ({ status }) => {
    const details = {
      [ShiftSwapStatus.PENDING]: { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-yellow-400', tooltip: 'Intercambio Pendiente' },
      [ShiftSwapStatus.APPROVED]: { icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'text-green-400', tooltip: 'Intercambio Aprobado' },
    };
  
    if (status === ShiftSwapStatus.REJECTED) return null;
  
    const { icon, color, tooltip } = details[status];
  
    return (
      <div className="relative group">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
        <div className={`absolute bottom-full mb-2 w-max max-w-xs bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 p-2 text-slate-200 text-xs transition-all duration-200 origin-bottom opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto`}>
          {tooltip}
        </div>
      </div>
    );
  };


const observationSeverity: Record<ObservationType, { level: number; borderColor: string }> = {
    [ObservationType.MISSING_HOURS]: { level: 3, borderColor: 'border-red-500' },
    [ObservationType.REST_VIOLATION]: { level: 3, borderColor: 'border-purple-500' },
    [ObservationType.CONSECUTIVE_DAYS]: { level: 2, borderColor: 'border-orange-500' },
    [ObservationType.OVERTIME]: { level: 1, borderColor: 'border-yellow-500' },
};

const getMostSevereObservationBorder = (observations: Observation[]): string => {
    if (!observations || observations.length === 0) return '';
    const mostSevere = observations.map(obs => observationSeverity[obs.type]).reduce((max, current) => current.level > max.level ? current : max);
    return `border-t-4 ${mostSevere.borderColor}`;
};

const WeeklyDetailRowContent: React.FC<{ employee: Employee; allShifts: Shift[]; dateRange: { start: Date; end: Date }; }> = ({ employee, allShifts, dateRange }) => {
    const employeeShifts = useMemo(() => allShifts.filter(s => s.employeeId === employee.id), [allShifts, employee.id]);

    const weeksInRange = useMemo(() => {
        const weeks = [];
        let currentDay = new Date(dateRange.start);
        currentDay.setHours(0,0,0,0);

        while (currentDay <= dateRange.end) {
            const dayOfWeek = currentDay.getDay(); // 0=Sun, 1=Mon
            const diff = currentDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const weekStart = new Date(currentDay);
            weekStart.setDate(diff);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const weekKey = weekStart.toISOString().split('T')[0];
            if (!weeks.some(w => w.key === weekKey)) {
                weeks.push({
                    key: weekKey,
                    start: weekStart,
                    end: weekEnd,
                });
            }
            currentDay.setDate(currentDay.getDate() + 7);
        }
        return weeks;
    }, [dateRange]);

    return (
        <div className="p-2 space-y-3">
            {weeksInRange.map(week => {
                const shiftsInWeek = employeeShifts.filter(shift => {
                    const shiftDate = new Date(shift.date + 'T00:00:00');
                    return shiftDate >= week.start && shiftDate <= week.end;
                });
                const totalWeeklyHours = shiftsInWeek.reduce((acc, shift) => acc + calculateShiftDuration(shift.startTime, shift.endTime), 0);
                // Updated: use weekly_target_hours from Strict Types
                const targetHours = employee.weekly_target_hours || 44;
                const ratio = targetHours > 0 ? totalWeeklyHours / targetHours : 0;
                
                const weeklyStatusColor = ratio > 1.05 ? 'text-red-400' : ratio < 0.85 ? 'text-yellow-400' : 'text-green-400';

                return (
                    <div key={week.key} className="bg-slate-800/50 rounded-lg p-2">
                        <div className="flex justify-between items-center mb-1">
                           <h4 className="font-semibold text-slate-200 text-xs">
                            Semana del {week.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al {week.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                           </h4>
                           <p className={`font-bold text-xs ${weeklyStatusColor}`}>
                               Total: {totalWeeklyHours.toFixed(1)}h / {targetHours}h
                           </p>
                        </div>
                        <table className="w-full text-xs text-left">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="p-1 font-medium">Día</th>
                              <th className="p-1 font-medium">Turno</th>
                              <th className="p-1 font-medium">Horario</th>
                              <th className="p-1 font-medium text-right">Horas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({length: 7}).map((_, i) => {
                                const day = new Date(week.start);
                                day.setDate(week.start.getDate() + i);
                                const shift = shiftsInWeek.find(s => s.date === day.toISOString().split('T')[0]);
                                return (
                                    <tr key={day.toISOString()} className="border-t border-white/5">
                                        <td className="p-1 capitalize">{day.toLocaleDateString('es-ES', { weekday: 'short' })} <span className="text-slate-500">{day.getDate()}</span></td>
                                        <td className="p-1">{shift?.type || '---'}</td>
                                        <td className="p-1 font-mono text-xs">{shift && shift.startTime ? `${shift.startTime}-${shift.endTime}` : '---'}</td>
                                        <td className="p-1 text-right font-mono text-xs">{shift ? calculateShiftDuration(shift.startTime, shift.endTime).toFixed(1)+'h' : '0.0h'}</td>
                                    </tr>
                                );
                            })}
                          </tbody>
                        </table>
                    </div>
                )
            })}
        </div>
    );
};

const EmployeeRow: React.FC<{
    employee: Employee;
    days: Date[];
    shifts: Shift[];
    dateRange: { start: Date; end: Date };
    isWeeklyHoursColumnVisible: boolean;
    expandedEmployeeId: string | null;
    setExpandedEmployeeId: React.Dispatch<React.SetStateAction<string | null>>;
    onAddShift: (employeeId: string, date: string) => void;
    shiftTypeFilter: ShiftType | '';
    handleShiftClick: (e: React.MouseEvent, shift: Shift) => void;
    handleShiftContextMenu: (e: React.MouseEvent, shift: Shift) => void;
    getShiftForEmployeeAndDate: (employeeId: string, date: Date) => Shift | undefined;
    getSwapStatusForShift: (shiftId: string) => ShiftSwapStatus | null;
    getSwapStatusStyle: (status: ShiftSwapStatus | null) => string;
}> = ({
    employee,
    days,
    shifts,
    dateRange,
    isWeeklyHoursColumnVisible,
    expandedEmployeeId,
    setExpandedEmployeeId,
    onAddShift,
    shiftTypeFilter,
    handleShiftClick,
    handleShiftContextMenu,
    getShiftForEmployeeAndDate,
    getSwapStatusForShift,
    getSwapStatusStyle,
}) => {
    const totalHoursInRange = useMemo(() => {
        return days.reduce((acc, day) => {
            const shift = getShiftForEmployeeAndDate(employee.id, day);
            return acc + (shift ? calculateShiftDuration(shift.startTime, shift.endTime) : 0);
        }, 0);
    }, [shifts, employee.id, days, getShiftForEmployeeAndDate]);

    const targetHoursInRange = useMemo(() => {
        // Updated: use weekly_target_hours from Strict Types
        if (!employee.weekly_target_hours) return 0;
        const numDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 3600 * 24) + 1;
        return (employee.weekly_target_hours / 7) * numDays;
    }, [employee.weekly_target_hours, dateRange]);

    const hourStatusColor = useMemo(() => {
        if (targetHoursInRange === 0) return 'text-slate-300';
        const ratio = totalHoursInRange / targetHoursInRange;
        if (ratio > 1.05) return 'text-red-400';
        if (ratio < 0.85) return 'text-yellow-400';
        return 'text-green-400';
    }, [totalHoursInRange, targetHoursInRange]);
    
    const isExpanded = expandedEmployeeId === employee.id;
    const rowVariants: Variants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };
    
    return (
        <Fragment>
            <motion.div variants={rowVariants} style={{ display: 'contents' }}>
                <div className="bg-slate-900 border-r border-white/5 shadow-xl z-20 p-2 font-medium sticky left-0 flex items-center">
                    <img src={employee.avatarUrl} alt={employee.name} className="h-10 w-10 rounded-full mr-3 border-2 border-white/20 flex-shrink-0" />
                    <div className="truncate min-w-[150px]">
                        <p className="text-sm font-semibold text-slate-100 truncate">{employee.name}</p>
                        <p className="text-xs text-slate-400 hidden md:block truncate">{employee.position}</p>
                         <ModalityPill modality={employee.modality} />
                    </div>
                </div>
                {days.map(date => {
                    const shift = getShiftForEmployeeAndDate(employee.id, date);
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const isWeekend = [0, 6].includes(date.getDay());
                    const shouldShow = !shiftTypeFilter || (shift && shift.type === shiftTypeFilter);
                    const observationBorderClass = shift?.observations?.length ? getMostSevereObservationBorder(shift.observations) : '';
                    const isEffectivelyEmpty = !shift || shift.type === ShiftType.LIBRE;
                    const swapStatus = shift ? getSwapStatusForShift(shift.id) : null;
                    const swapBorderStyle = getSwapStatusStyle(swapStatus);

                    return (
                        <div 
                            key={`${employee.id}-${date.toISOString()}`} 
                            className={`p-1 min-h-[70px] group relative transition-all duration-200 hover:bg-white/10 hover:ring-1 hover:ring-inset hover:ring-white/20 hover:z-10 ${isWeekend ? 'bg-slate-900/40' : 'bg-slate-900/20'} ${observationBorderClass}`}
                        >
                             {!isEffectivelyEmpty && shouldShow && <ShiftTooltip shift={shift!} employee={employee} />}
                            {isEffectivelyEmpty ? (
                                <motion.button onClick={() => onAddShift(employee.id, dateStr)} className="absolute inset-0 flex items-center justify-center bg-black/10 bg-opacity-0 hover:bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Añadir turno para ${employee.name} el día ${date.getDate()}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                </motion.button>
                            ) : shouldShow && (
                                <div 
                                    className={`flex flex-col justify-between h-full cursor-pointer rounded-md transition-colors hover:bg-white/10 p-1 ${swapBorderStyle}`} 
                                    onClick={(e) => handleShiftClick(e, shift!)}
                                    onContextMenu={(e) => handleShiftContextMenu(e, shift!)}
                                >
                                    <div className="flex justify-between items-start">
                                        <ShiftTypePill type={shift!.type} />
                                        <div className="flex items-center space-x-1.5">
                                            {swapStatus && <SwapStatusIcon status={swapStatus} />}
                                            {shift!.notes && <NoteIcon note={shift!.notes} />}
                                            {/* Nuevo icono de alerta unificado */}
                                            <ShiftAlertIcon observations={shift!.observations} />
                                        </div>
                                    </div>
                                    {(shift!.startTime && shift!.endTime) && (
                                        <div className="mt-auto text-right">
                                            <p className="text-sm font-semibold text-slate-200">{shift!.startTime} - {shift!.endTime}</p>
                                            <p className="font-mono text-xs text-slate-500">({calculateShiftDuration(shift!.startTime, shift!.endTime).toFixed(1)}h)</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {isWeeklyHoursColumnVisible && (
                     <div className="bg-slate-800/50 p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={() => setExpandedEmployeeId(isExpanded ? null : employee.id)}>
                        <p className={`text-xl font-bold font-mono ${hourStatusColor}`}>{totalHoursInRange.toFixed(1)}h</p>
                        <p className="text-xs text-slate-400">de {targetHoursInRange.toFixed(1)}h</p>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </motion.div>
                    </div>
                )}
            </motion.div>
             <AnimatePresence>
                {isExpanded && (
                    <div style={{ gridColumn: '1 / -1' }} className="bg-slate-900/30">
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <WeeklyDetailRowContent employee={employee} allShifts={shifts} dateRange={dateRange} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Fragment>
    );
};


const CalendarView: React.FC<CalendarViewProps> = ({ 
    allData, 
    unitId, 
    dateRange, 
    shiftTypeFilter, 
    modalityFilter, 
    searchQuery, 
    onAddShift, 
    onModifyShift, 
    onRequestSwap,
    onDeleteShift,
    onBatchSaveShifts
}) => {
    const { employees, shifts } = allData;
    const shouldReduceMotion = useReducedMotion();
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, shift: Shift } | null>(null);
    const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Cerrar menú contextual al hacer clic fuera o scroll
    React.useEffect(() => {
        const closeMenu = () => setContextMenu(null);

        // Eliminamos el listener de click global que causaba conflictos con Portals
        // window.addEventListener("click", closeMenu); 
        window.addEventListener("scroll", closeMenu);

        return () => {
            // window.removeEventListener("click", closeMenu);
            window.removeEventListener("scroll", closeMenu);
        };
    }, []);
    
    // Cerrar menú si cambian los filtros
    React.useEffect(() => {
        setContextMenu(null);
        setCurrentPage(1); // Reset pagination when filters change
    }, [unitId, dateRange, shiftTypeFilter, modalityFilter, searchQuery]);

    // Effect: Scroll to top when page changes
    React.useEffect(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);


    const unitEmployees = employees
        .filter(e => e.unitId === unitId)
        .filter(e => modalityFilter ? e.modality === modalityFilter : true)
        .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.rut.includes(searchQuery))
        .filter(e => e.status === 'Activo');

    // Pagination Logic
    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return unitEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [unitEmployees, currentPage, ITEMS_PER_PAGE]);

    const getDaysInRange = (start: Date, end: Date): Date[] => {
        const daysArray = [];
        let currentDate = new Date(start.toISOString().slice(0, 10) + 'T00:00:00');
        let finalDate = new Date(end.toISOString().slice(0, 10) + 'T00:00:00');
        while (currentDate <= finalDate) {
            daysArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return daysArray;
    };

    const days = getDaysInRange(dateRange.start, dateRange.end);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const formatMonthName = (date: Date) => date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const startMonthName = formatMonthName(dateRange.start);
    const endMonthName = formatMonthName(dateRange.end);
    const title = startMonthName === endMonthName ? startMonthName : `${startMonthName} - ${endMonthName}`;

    const getShiftForEmployeeAndDate = useCallback((employeeId: string, date: Date): Shift | undefined => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return shifts.find(s => s.employeeId === employeeId && s.date === dateStr);
    }, [shifts]);

    const getSwapStatusForShift = useMemo(() => (shiftId: string): ShiftSwapStatus | null => {
        const swap = allData.shiftSwapRequests.find(
          req => (req.requesterShiftId === shiftId || req.targetShiftId === shiftId) && req.status !== ShiftSwapStatus.REJECTED
        );
        return swap ? swap.status : null;
    }, [allData.shiftSwapRequests]);

    const getSwapStatusStyle = (status: ShiftSwapStatus | null): string => {
        if (!status) return '';
        switch (status) {
          case ShiftSwapStatus.PENDING: return 'ring-2 ring-yellow-500/50 ring-inset';
          case ShiftSwapStatus.APPROVED: return 'ring-2 ring-green-500/50 ring-inset';
          default: return '';
        }
    };
    
    const handleShiftClick = (e: React.MouseEvent, shift: Shift) => {
        e.preventDefault();
        // Left click also opens modify logic if desired, or just selects. 
        // For consistency, let's keep it simple or map it to context menu logic if preferred.
        // Current behavior: opens ShiftModal via parent prop
        onModifyShift(shift);
    };

    const handleShiftContextMenu = (e: React.MouseEvent, shift: Shift) => {
        e.preventDefault();
        // No stopPropagation here to allow window listener to close previous menus, 
        // but since we are handling opening, we set new state. 
        // Actually, we need stopPropagation to prevent immediate close if we relied on window click
        // but now we handle it carefully.
        setContextMenu({ x: e.clientX, y: e.clientY, shift });
    };

    const handleAutoFill = async (shift: Shift, employee: Employee) => {
        const { autoShifts, message } = generateAutoShifts(shift.date, shift, employee.modality);
        if (autoShifts.length > 0) {
            const confirm = window.confirm(`Se generarán turnos automáticamente:\n\n${message}\n\n¿Desea continuar?`);
            if (confirm) {
                await onBatchSaveShifts(autoShifts);
            }
        } else {
            alert(message);
        }
        setContextMenu(null);
    }

    const handleDelete = async (shiftId: string) => {
        if (window.confirm("¿Está seguro de eliminar este turno?")) {
            await onDeleteShift(shiftId);
        }
        setContextMenu(null);
    }
    
    const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05 } } };
    
    const isWeeklyHoursColumnVisible = ['24/7', '5x2', 'Administrativo'].includes(modalityFilter) || modalityFilter === '';
    const gridColumns = `minmax(280px, 1.2fr) repeat(${days.length}, minmax(90px, 1fr)) ${isWeeklyHoursColumnVisible ? 'minmax(130px, 1fr)' : ''}`;

    return (
        <Card>
            <h2 className="text-2xl font-bold text-slate-100 mb-4 capitalize">{title}</h2>
            {unitEmployees.length > 0 ? (
                <>
                <div className="overflow-x-auto">
                    <motion.div 
                        className="grid gap-px bg-white/10" 
                        style={{ gridTemplateColumns: gridColumns }}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Header "Funcionario" Sticky y con estilo sólido */}
                        <div className="bg-slate-900 border-r border-white/5 shadow-xl z-30 p-2 font-semibold sticky left-0 text-slate-200 flex items-center">
                            Funcionario
                        </div>
                        {days.map(date => {
                            const day = date.getDate();
                            const dayOfWeek = date.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            return (
                                <div key={date.toISOString()} className={`p-2 text-center font-semibold ${isWeekend ? 'bg-slate-900/40' : 'bg-slate-900/20'}`}>
                                    <div className="text-slate-200">{day}</div>
                                    <div className="text-xs text-slate-400">{dayNames[dayOfWeek]}</div>
                                </div>
                            );
                        })}
                        {isWeeklyHoursColumnVisible && <div className="bg-slate-900/60 p-2 font-semibold text-center text-slate-200 flex items-center justify-center">Horas en Rango</div>}


                        {/* Rows (Paginated) */}
                        {paginatedEmployees.map(employee => (
                            <EmployeeRow
                                key={employee.id}
                                employee={employee}
                                days={days}
                                shifts={shifts}
                                dateRange={dateRange}
                                isWeeklyHoursColumnVisible={isWeeklyHoursColumnVisible}
                                expandedEmployeeId={expandedEmployeeId}
                                setExpandedEmployeeId={setExpandedEmployeeId}
                                onAddShift={onAddShift}
                                shiftTypeFilter={shiftTypeFilter}
                                handleShiftClick={handleShiftClick}
                                handleShiftContextMenu={handleShiftContextMenu}
                                getShiftForEmployeeAndDate={getShiftForEmployeeAndDate}
                                getSwapStatusForShift={getSwapStatusForShift}
                                getSwapStatusStyle={getSwapStatusStyle}
                            />
                         ))}
                    </motion.div>
                </div>
                {unitEmployees.length > ITEMS_PER_PAGE && (
                    <Pagination 
                        currentPage={currentPage} 
                        totalItems={unitEmployees.length} 
                        itemsPerPage={ITEMS_PER_PAGE} 
                        onPageChange={setCurrentPage} 
                    />
                )}
                </>
            ) : (
                <div className="text-center py-10">
                     <div className="mx-auto h-12 w-12 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-200">Sin Resultados</h3>
                    <p className="mt-1 text-sm text-slate-400">No se encontraron funcionarios activos con los filtros aplicados.</p>
                </div>
            )}
            <AnimatePresence>
                {contextMenu && (
                    <ShiftContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        shift={contextMenu.shift}
                        employee={unitEmployees.find(e => e.id === contextMenu.shift.employeeId)}
                        onClose={() => setContextMenu(null)}
                        onModify={() => {
                            onModifyShift(contextMenu.shift);
                            setContextMenu(null);
                        }}
                        onSwap={() => {
                            onRequestSwap(contextMenu.shift);
                            setContextMenu(null);
                        }}
                        onDelete={() => handleDelete(contextMenu.shift.id)}
                        onAutoFill={() => {
                             const emp = unitEmployees.find(e => e.id === contextMenu.shift.employeeId);
                             if(emp) handleAutoFill(contextMenu.shift, emp);
                        }}
                    />
                )}
            </AnimatePresence>
        </Card>
    );
};

export default CalendarView;
