import React from 'react';
import { Shift, Employee, ObservationType } from '../../types';

// Reusing icon styles from CalendarView for consistency
const observationIconDetails: Record<ObservationType, { icon: string; color: string; }> = {
    [ObservationType.OVERTIME]: { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-yellow-400' },
    [ObservationType.CONSECUTIVE_DAYS]: { icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-orange-400' },
    [ObservationType.MISSING_HOURS]: { icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-red-400' },
    [ObservationType.REST_VIOLATION]: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-purple-400' },
};

const ShiftTooltip: React.FC<{ shift: Shift; employee: Employee; }> = ({ shift, employee }) => {
    return (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 p-3 text-slate-200 text-sm transition-all duration-200 origin-bottom opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
            <div className="flex items-center gap-3 mb-2">
                <img src={employee.avatarUrl} alt={employee.name} className="h-10 w-10 rounded-full flex-shrink-0" />
                <div>
                    <p className="font-bold text-base text-white truncate">{employee.name}</p>
                    <p className="text-xs text-slate-400 truncate">{employee.position}</p>
                </div>
            </div>
            
            <div className="border-t border-white/10 my-2" />
            
            {shift.notes && (
                <div className="mb-2">
                    <p className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-1">Notas</p>
                    <p className="text-xs text-slate-400">{shift.notes}</p>
                </div>
            )}

            {shift.observations.length > 0 && (
                <div>
                    <p className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-1">Observaciones</p>
                    <ul className="space-y-1 text-xs text-slate-400">
                        {shift.observations.map(obs => {
                            const details = observationIconDetails[obs.type];
                            return (
                                <li key={obs.id} className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 mt-0.5 ${details.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={details.icon} />
                                    </svg>
                                    <span>{obs.description}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}

            {!shift.notes && shift.observations.length === 0 && (
                <p className="text-xs text-slate-500 italic">Sin notas ni observaciones.</p>
            )}
        </div>
    );
};

export default ShiftTooltip;
