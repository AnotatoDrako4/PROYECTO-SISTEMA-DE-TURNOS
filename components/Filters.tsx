

import React from 'react';
import { ShiftType, Unit, Employee, MODALITY_OPTIONS, ShiftSwapRequest } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import UserPlusIcon from './ui/icons/UserPlusIcon';
import ClipboardDocumentCheckIcon from './icons/ClipboardDocumentCheckIcon';

interface FiltersProps {
    units: Unit[];
    selectedUnit: string;
    onUnitChange: (unitId: string) => void;
    dateRange: { start: Date, end: Date };
    onDateChange: (newRange: { start: Date, end: Date }) => void;
    shiftTypeFilter: ShiftType | '';
    onShiftTypeChange: (type: ShiftType | '') => void;
    modalityFilter: Employee['modality'] | '';
    onModalityChange: (modality: Employee['modality'] | '') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAIAssistClick: () => void;
    onAddEmployeeClick: () => void;
    onManageSwapsClick: () => void;
    pendingSwapsCount: number;
}

const Filters: React.FC<FiltersProps> = ({
    units, selectedUnit, onUnitChange,
    dateRange, onDateChange,
    shiftTypeFilter, onShiftTypeChange,
    modalityFilter, onModalityChange,
    searchQuery, onSearchChange,
    onAIAssistClick,
    onAddEmployeeClick,
    onManageSwapsClick,
    pendingSwapsCount
}) => {
    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const handleDateInputChange = (part: 'start' | 'end', value: string) => {
        const [year, month, day] = value.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);
        if (isNaN(newDate.getTime())) return;

        onDateChange({ ...dateRange, [part]: newDate });
    };

    return (
        <Card className="mb-6">
            <div className="flex flex-wrap justify-center items-center gap-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center justify-center gap-4 flex-grow">
                    <div>
                        <label htmlFor="unit-select" className="block text-sm font-medium text-slate-300 mb-1">Unidad</label>
                        <select id="unit-select" value={selectedUnit} onChange={(e) => onUnitChange(e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand">
                            {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-slate-300 mb-1">Fecha Inicio</label>
                        <input type="date" id="start-date" value={formatDateForInput(dateRange.start)} onChange={e => handleDateInputChange('start', e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 px-4 text-slate-100 focus:ring-brand focus:border-brand" />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-slate-300 mb-1">Fecha Fin</label>
                        <input type="date" id="end-date" value={formatDateForInput(dateRange.end)} onChange={e => handleDateInputChange('end', e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 px-4 text-slate-100 focus:ring-brand focus:border-brand" />
                    </div>
                    <div>
                        <label htmlFor="filter-modality-type" className="block text-sm font-medium text-slate-300 mb-1">Modalidad</label>
                        <select id="filter-modality-type" value={modalityFilter} onChange={(e) => onModalityChange(e.target.value as Employee['modality'] | '')} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand">
                            <option value="">Todas</option>
                            {MODALITY_OPTIONS.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="filter-shift-type" className="block text-sm font-medium text-slate-300 mb-1">Tipo de Turno</label>
                        <select id="filter-shift-type" value={shiftTypeFilter} onChange={(e) => onShiftTypeChange(e.target.value as ShiftType | '')} className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-8 text-slate-100 focus:ring-brand focus:border-brand">
                            <option value="">Todos</option>
                            {Object.values(ShiftType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="search-employee" className="block text-sm font-medium text-slate-300 mb-1">Buscar</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                            <input type="text" id="search-employee" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 text-slate-100 focus:ring-brand focus:border-brand placeholder:text-slate-400" placeholder="Nombre..." />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                    <Button variant="secondary" onClick={onAIAssistClick}>Asistente IA</Button>
                    <Button variant="secondary" onClick={onManageSwapsClick} className="relative">
                        <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                        Gestionar Intercambios
                        {pendingSwapsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                {pendingSwapsCount}
                            </span>
                        )}
                    </Button>
                    <Button variant="primary" onClick={onAddEmployeeClick}>
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Agregar / Modificar Funcionario
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default Filters;