
import React, { useMemo } from 'react';
import Card from './Card';
import { Employee, Shift } from '../../types';
import { calculateShiftDuration } from '../../lib/scheduleUtils';

interface WeeklyValidationPanelProps {
  employee: Employee | undefined;
  allShifts: Shift[];
  year: number;
  month: number;
}

const statusStyles = {
    OK: { badge: 'bg-green-500/20 text-green-300', border: 'border-green-500/30' },
    Excedido: { badge: 'bg-red-500/20 text-red-300', border: 'border-red-500/30' },
    'Bajo rango': { badge: 'bg-yellow-500/20 text-yellow-300', border: 'border-yellow-500/30' },
};

const WeeklyValidationPanel: React.FC<WeeklyValidationPanelProps> = ({ employee, allShifts, year, month }) => {

    const weeklySummary = useMemo(() => {
        if (!employee) return [];

        const employeeShifts = allShifts.filter(s => s.employeeId === employee.id);
        const weeks: { label: string; totalHours: number; status: 'OK' | 'Excedido' | 'Bajo rango' }[] = [];
        
        let currentDay = new Date(year, month, 1);
        
        while (currentDay.getMonth() === month) {
            const dayOfWeek = currentDay.getDay();
            const diff = currentDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const weekStart = new Date(year, month, diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const weekKey = weekStart.toISOString().split('T')[0];
            if (!weeks.some(w => w.label.startsWith(weekKey))) {
                const shiftsInWeek = employeeShifts.filter(shift => {
                    const shiftDate = new Date(shift.date + 'T00:00:00');
                    return shiftDate >= weekStart && shiftDate <= weekEnd;
                });
                
                const totalHours = shiftsInWeek.reduce((acc, shift) => acc + calculateShiftDuration(shift.startTime, shift.endTime), 0);
                
                // Updated: use strict type field
                const targetHours = employee.weekly_target_hours || 44;
                
                let status: 'OK' | 'Excedido' | 'Bajo rango' = 'OK';
                
                if (totalHours > targetHours) status = "Excedido";
                else if (totalHours > 0 && totalHours < targetHours * 0.9) status = "Bajo rango";
                
                weeks.push({
                    label: `${weekKey} (Semana del ${weekStart.getDate()} al ${weekEnd.getDate()})`,
                    totalHours,
                    status,
                });
            }
            
            // Move to the start of the next week
            const nextWeekStart = new Date(weekStart);
            nextWeekStart.setDate(weekStart.getDate() + 7);
            currentDay = nextWeekStart;
        }
        return weeks;
    }, [employee, allShifts, year, month]);

    if (!employee) {
        return (
            <Card>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Resumen Semanal</h3>
                <p className="text-sm text-slate-400">Seleccione un funcionario para ver la validación de sus horas semanales.</p>
            </Card>
        );
    }

    return (
        <Card>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Resumen Semanal de {employee.name.split(' ')[0]}</h3>
            <div className="space-y-3">
                {weeklySummary.map(week => {
                    const style = statusStyles[week.status];
                    return (
                        <div key={week.label} className={`p-3 rounded-lg border ${style.badge} ${style.border}`}>
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">
                                    {`Semana del ${new Date(week.label.split(' ')[0] + 'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short' })}`}
                                </p>
                                <div className="text-right">
                                    <p className="font-bold">{week.totalHours.toFixed(1)}h</p>
                                    <p className="text-xs">{week.status}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
};

export default WeeklyValidationPanel;
