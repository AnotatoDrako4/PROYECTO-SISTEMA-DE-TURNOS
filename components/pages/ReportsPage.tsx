import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { SystemData, UserProfile, Unit, Employee, MODALITY_OPTIONS, ShiftType } from '../../types';
import FileDownloadIcon from '../icons/FileDownloadIcon';
import SaveIcon from '../icons/SaveIcon';
import ReportCard from '../reports/ReportCard';
import BarChart from '../ui/charts/BarChart';
import DoughnutChart from '../ui/charts/DoughnutChart';

interface ReportsPageProps {
  data: SystemData;
  userProfile: UserProfile;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ data }) => {
  const [filters, setFilters] = useState({
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    department: '',
    modality: '',
  });
  const [activeTab, setActiveTab] = useState('asistencia');
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleGenerateReport = () => {
    setReportGenerated(true);
  };

  const filteredData = useMemo(() => {
    if (!reportGenerated) return null;
    
    const start = new Date(filters.startDate + 'T00:00:00');
    const end = new Date(filters.endDate + 'T23:59:59');

    let employees = data.employees;
    if(filters.department){
        employees = employees.filter(e => e.unitId === filters.department);
    }
    if(filters.modality){
        employees = employees.filter(e => e.modality === filters.modality);
    }
    const employeeIds = new Set(employees.map(e => e.id));
    const shifts = data.shifts.filter(s => {
        const shiftDate = new Date(s.date + 'T00:00:00');
        return employeeIds.has(s.employeeId) && shiftDate >= start && shiftDate <= end;
    });

    return { employees, shifts };
  }, [data, filters, reportGenerated]);

  // Mock data for reports that require info not in the base model
  const mockAttendanceData = useMemo(() => {
     if(!filteredData) return { absences: [], lateness: [] };
     const lateness = filteredData.employees.slice(0, 5).map((emp, i) => ({
         employeeName: emp.name,
         date: `2024-11-1${i+2}`,
         expected: '08:30',
         actual: `08:${35 + i*2}`,
         minutes: 5 + i * 2,
     }));
     const absences = filteredData.employees.slice(3, 8).map((emp, i) => ({
         employeeName: emp.name,
         type: i % 2 === 0 ? 'Licencia Médica' : 'Permiso Administrativo',
         date: `2024-11-1${i+4}`,
     }));
     return { lateness, absences };
  }, [filteredData]);

  const tabs = [
      { id: 'asistencia', label: 'Asistencia y Atrasos' },
      { id: 'turnos', label: 'Turnos y Modalidades' },
      { id: '247', label: 'Especiales 24/7' },
      { id: 'funcionarios', label: 'Funcionarios' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Reportes y Analítica</h1>
        <p className="text-slate-400">Genere, visualice y exporte informes detallados del sistema.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4 border-b border-white/10">
          {/* Filters */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Rango de Fechas</label>
            <div className="flex items-center gap-2">
              <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="bg-white/10 border border-white/20 rounded-full py-2 px-4 text-slate-100 focus:ring-brand focus:border-brand" />
              <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} className="bg-white/10 border border-white/20 rounded-full py-2 px-4 text-slate-100 focus:ring-brand focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Departamento</label>
            <select value={filters.department} onChange={e => setFilters(f => ({...f, department: e.target.value}))} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand">
              <option value="">Todos</option>
              {data.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Modalidad</label>
            <select value={filters.modality} onChange={e => setFilters(f => ({...f, modality: e.target.value}))} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand">
              <option value="">Todas</option>
              {MODALITY_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-grow"></div>
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => alert('Guardado!')}><SaveIcon className="w-4 h-4 mr-2" /> Guardar</Button>
            <Button variant="secondary" onClick={() => alert('Exportando...')}><FileDownloadIcon className="w-4 h-4 mr-2" /> PDF/Excel</Button>
            <Button variant="primary" onClick={handleGenerateReport}>Generar Reporte</Button>
          </div>
        </div>
        
        {!reportGenerated ? (
             <div className="p-8 text-center text-slate-400">
                <p>Configure los filtros y haga clic en "Generar Reporte" para ver los datos.</p>
            </div>
        ) : !filteredData ? (
             <div className="p-8 text-center text-slate-400">
                <p>Cargando datos del reporte...</p>
            </div>
        ) : (
            <div className="p-4">
                 <div className="border-b border-white/10 mb-4">
                    <nav className="-mb-px flex space-x-6">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Report Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'asistencia' && (
                        <>
                            <ReportCard title="Resumen de Asistencia" description="Total de días, ausencias y horas en el período.">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between"><span>Días Trabajados:</span><strong className="text-white">{filteredData.shifts.filter(s => s.type !== ShiftType.LIBRE).length}</strong></li>
                                    <li className="flex justify-between"><span>Total Ausencias:</span><strong className="text-white">{mockAttendanceData.absences.length}</strong></li>
                                    <li className="flex justify-between"><span>Total Atrasos:</span><strong className="text-white">{mockAttendanceData.lateness.length}</strong></li>
                                </ul>
                            </ReportCard>
                            <ReportCard title="Comparativa Mensual" description="Gráfico de asistencia en el rango de fechas.">
                                <BarChart data={{ labels: ['Nov', 'Dic', 'Ene'], series: [[250, 260, 245]] }} />
                            </ReportCard>
                        </>
                    )}
                    {activeTab === 'turnos' && (
                       <>
                            <ReportCard title="Distribución de Turnos" description="Cantidad de turnos por tipo en el período.">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between"><span>Diurnos:</span><strong className="text-white">{filteredData.shifts.filter(s => s.type === ShiftType.DIURNO).length}</strong></li>
                                    <li className="flex justify-between"><span>Nocturnos:</span><strong className="text-white">{filteredData.shifts.filter(s => s.type === ShiftType.NOCHE).length}</strong></li>
                                    <li className="flex justify-between"><span>Libres:</span><strong className="text-white">{filteredData.shifts.filter(s => s.type === ShiftType.LIBRE).length}</strong></li>
                                </ul>
                            </ReportCard>
                            <ReportCard title="Distribución de Modalidades" description="% de funcionarios por modalidad.">
                               <DoughnutChart data={{
                                   labels: data.employees.reduce((acc, e) => acc.includes(e.modality) ? acc : [...acc, e.modality], [] as string[]),
                                   series: data.employees.reduce((acc, e) => {
                                        const index = acc.labels.indexOf(e.modality);
                                        if(index > -1) acc.series[index]++;
                                        else { acc.labels.push(e.modality); acc.series.push(1); }
                                        return acc;
                                   }, {labels: [], series: []} as {labels: string[], series: number[]})
                               }} />
                            </ReportCard>
                       </>
                    )}
                     {activeTab === '247' && (
                       <>
                            <ReportCard title="Resumen Mensual 24/7" description="Horas, turnos y extras para el personal 24/7.">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between"><span>Horas Totales:</span><strong className="text-white">{filteredData.shifts.filter(s=>s.employeeId === 'e4').reduce((a, s) => a + 12, 0)}</strong></li>
                                    <li className="flex justify-between"><span>Turnos Diurnos:</span><strong className="text-white">{filteredData.shifts.filter(s=>s.employeeId === 'e4' && s.type === ShiftType.DIURNO).length}</strong></li>
                                    <li className="flex justify-between"><span>Turnos Nocturnos:</span><strong className="text-white">{filteredData.shifts.filter(s=>s.employeeId === 'e4' && s.type === ShiftType.NOCHE).length}</strong></li>
                                </ul>
                            </ReportCard>
                       </>
                    )}
                     {activeTab === 'funcionarios' && (
                       <>
                            <ReportCard title="Ficha de Funcionario" description="Resumen individual listo para exportar.">
                               <div className="text-center p-4">
                                   <p className="text-slate-400 text-sm">Seleccione un funcionario para ver su ficha detallada.</p>
                               </div>
                            </ReportCard>
                             <ReportCard title="Ranking de Funcionarios" description="Top funcionarios por horas trabajadas.">
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    {filteredData.employees.slice(0,3).map(e => <li key={e.id}>{e.name}</li>)}
                                </ol>
                            </ReportCard>
                       </>
                    )}
                </div>
            </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;