
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeeklyAnalysis, WeekDetail } from '../../types';

interface DetalleSemanalProps {
  data: WeeklyAnalysis;
  title?: string;
}

const statusStyles = {
    OK: { badge: 'bg-green-500/20 text-green-300', iconColor: 'text-green-400' },
    OVER_LIMIT: { badge: 'bg-red-500/20 text-red-300', iconColor: 'text-red-400' },
    UNDER_TARGET: { badge: 'bg-yellow-500/20 text-yellow-300', iconColor: 'text-yellow-400' },
};

const statusText = {
    OK: 'OK',
    OVER_LIMIT: 'Sobrecarga (>44h)',
    UNDER_TARGET: 'Déficit (<40h)',
}

const WeekCard: React.FC<{ week: WeekDetail }> = ({ week }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const styles = statusStyles[week.status];

    return (
        <div className="bg-black/20 rounded-2xl border border-white/10 overflow-hidden">
            <button 
                className="flex items-center justify-between w-full p-4 text-left transition-colors hover:bg-white/5"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <div className="flex-1">
                    <p className="font-semibold text-slate-100">{week.label}</p>
                    <p className="text-sm text-slate-400">Total: <span className="font-bold text-slate-200">{week.totalHours.toFixed(1)} horas</span></p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles.badge}`}>
                        {statusText[week.status]}
                    </span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </motion.div>
                </div>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 border-t border-white/10">
                            {/* Compact Daily Breakdown */}
                            <div>
                                {week.days.map(day => (
                                    <div key={day.date} className="flex items-center text-xs py-0.5 border-b border-white/5 last:border-b-0 leading-tight">
                                        <div className="flex-1 text-slate-300">
                                            <span className="font-medium capitalize w-8 inline-block">{day.weekday.substring(0, 3)}</span>
                                            <span className="text-slate-400">
                                                {new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex-none w-28 text-center text-slate-400 font-mono">
                                            {day.shiftType === 'Libre' ? '---' : day.timeRange || day.shiftType || '---'}
                                        </div>
                                        <div className={`flex-none w-16 text-right font-mono font-bold ${day.hours > 0 ? 'text-slate-100' : 'text-slate-500'}`}>
                                            {day.hours.toFixed(1)}h
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Notes Section */}
                            {week.notes && (
                                <div className={`p-2 mt-2 text-xs rounded-lg border ${styles.badge} border-opacity-30 flex items-start gap-2`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 mt-0.5 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <div>
                                        <p className="font-semibold">Notas / Recomendaciones:</p>
                                        <p>{week.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DetalleSemanal: React.FC<DetalleSemanalProps> = ({ data, title = "Análisis Semanal Detallado (24/7)" }) => {
  if (!data || !data.weeks || data.weeks.length === 0) {
    return (
        <div className="p-4 text-center bg-black/20 rounded-lg">
            <p className="text-slate-300">No hay información semanal para el período seleccionado.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold text-lg text-slate-100">{title}</h4>
            {data.summary && (
                <div className="text-sm text-slate-400 flex flex-wrap gap-x-4">
                    {data.summary.totalWeeks && <span>Semanas Analizadas: <span className="font-bold text-slate-200">{data.summary.totalWeeks}</span></span>}
                    {data.summary.averageHoursPerWeek && <span>Promedio Horas/Semana: <span className="font-bold text-slate-200">{data.summary.averageHoursPerWeek.toFixed(2)}h</span></span>}
                </div>
            )}
        </div>
        
        <div className="space-y-3">
            {data.weeks.map((week, index) => (
                <WeekCard key={index} week={week} />
            ))}
        </div>
    </div>
  );
};

export default DetalleSemanal;
