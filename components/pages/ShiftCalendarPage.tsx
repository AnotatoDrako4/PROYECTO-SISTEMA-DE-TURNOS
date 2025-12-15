
import React, { useMemo, useState, Fragment, useCallback, useEffect } from 'react';
import { type SystemData, type Shift, type Observation, ShiftType, ObservationType, Employee, ShiftSwapStatus, UserProfile, UserRole } from '../../types';
import Card from '../ui/Card';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import ShiftContextMenu from '../ui/ShiftContextMenu';
import Filters from '../Filters';
import AIAssistant from '../AIAssistant';
import ShiftModal from '../ShiftModal';
import SwapRequestModal from '../SwapRequestModal';
import SwapManagementPanel from '../SwapManagementPanel';
import ShiftTooltip from '../ui/ShiftTooltip';
import EmployeeModal from '../EmployeeModal';
import ModalityPill from '../ui/ModalityPill';
import { useMockData } from '../../hooks/useMockData';
import CalendarView from '../CalendarView';

interface ShiftCalendarPageProps {
  data: SystemData;
  actions: ReturnType<typeof useMockData>['actions'];
  userProfile: UserProfile;
}

const ShiftCalendarPage: React.FC<ShiftCalendarPageProps> = ({ data, actions, userProfile }) => {
    
    // 1. Filtrado de Seguridad para Unidades
    const visibleUnits = useMemo(() => {
        if (userProfile.role === UserRole.SUPER_ADMIN) return data.units;
        return data.units.filter(u => userProfile.assignedDepartments.includes(u.id));
    }, [data.units, userProfile]);

    // Estado inicial: Seleccionar la primera unidad visible si existe
    const [selectedUnit, setSelectedUnit] = useState<string>('');

    useEffect(() => {
        // Si no hay unidad seleccionada o la seleccionada ya no es visible, seleccionar la primera disponible
        if ((!selectedUnit || !visibleUnits.find(u => u.id === selectedUnit)) && visibleUnits.length > 0) {
            setSelectedUnit(visibleUnits[0].id);
        }
    }, [visibleUnits, selectedUnit]);

    const [isAIAssistantOpen, setAIAssistantOpen] = useState(false);
    
    const [shiftTypeFilter, setShiftTypeFilter] = useState<ShiftType | ''>('');
    const [modalityFilter, setModalityFilter] = useState<Employee['modality'] | ''>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
        const today = new Date('2025-11-01T00:00:00'); // Fixed to November 2025 as requested
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start, end };
    });

    const [shiftModalData, setShiftModalData] = useState<Shift | {employeeId: string, date: string} | null>(null);
    const [isSwapRequestModalOpen, setSwapRequestModalOpen] = useState(false);
    const [selectedShiftForSwap, setSelectedShiftForSwap] = useState<Shift | null>(null);
    const [isSwapPanelOpen, setSwapPanelOpen] = useState(false);
    const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const currentUnit = data.units.find(u => u.id === selectedUnit);

    const handleAddShiftClick = (employeeId: string, date: string) => {
        setShiftModalData({ employeeId, date });
    };
    
    const handleModifyShift = (shift: Shift) => {
        setShiftModalData(shift);
    };
    
    const handleRequestSwap = (shift: Shift) => {
        setSelectedShiftForSwap(shift);
        setSwapRequestModalOpen(true);
    };

    const handleSaveShift = (savedData: Partial<Shift> & { employeeId: string; date: string }) => {
        actions.saveShift(savedData);
        setShiftModalData(null);
    };

    const handleCreateSwapRequest = (targetEmployeeId: string, targetShiftId: string) => {
        if (!selectedShiftForSwap) return;
        actions.createSwapRequest(targetEmployeeId, targetShiftId, selectedShiftForSwap);
        alert('Solicitud de intercambio enviada.');
        setSwapRequestModalOpen(false);
    };

    const handleManageEmployeesClick = () => {
        setEditingEmployee(null);
        setEmployeeModalOpen(true);
    }
    
    return (
        <div className="space-y-6">
             <Filters
                units={visibleUnits} // Pasar solo unidades permitidas
                selectedUnit={selectedUnit}
                onUnitChange={setSelectedUnit}
                dateRange={dateRange}
                onDateChange={setDateRange}
                shiftTypeFilter={shiftTypeFilter}
                onShiftTypeChange={setShiftTypeFilter}
                modalityFilter={modalityFilter}
                onModalityChange={setModalityFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAIAssistClick={() => setAIAssistantOpen(true)}
                onAddEmployeeClick={handleManageEmployeesClick}
                onManageSwapsClick={() => setSwapPanelOpen(true)}
                pendingSwapsCount={data.shiftSwapRequests.filter(r => r.status === ShiftSwapStatus.PENDING).length}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${selectedUnit}-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <CalendarView 
                        allData={data} 
                        unitId={selectedUnit}
                        dateRange={dateRange}
                        shiftTypeFilter={shiftTypeFilter}
                        modalityFilter={modalityFilter}
                        searchQuery={searchQuery}
                        onAddShift={handleAddShiftClick}
                        onModifyShift={handleModifyShift}
                        onRequestSwap={handleRequestSwap}
                        onDeleteShift={actions.deleteShift}
                        onBatchSaveShifts={actions.saveBatchShifts}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Modals */}
            <AIAssistant
                isOpen={isAIAssistantOpen}
                onClose={() => setAIAssistantOpen(false)}
                data={data}
                unitName={currentUnit?.name || 'Unknown Unit'}
                modalityFilter={modalityFilter}
            />
            <ShiftModal
                isOpen={!!shiftModalData}
                onClose={() => setShiftModalData(null)}
                onSave={handleSaveShift}
                shiftData={shiftModalData}
                employees={data.employees}
                shifts={data.shifts}
            />
            <SwapRequestModal
                isOpen={isSwapRequestModalOpen}
                onClose={() => setSwapRequestModalOpen(false)}
                shift={selectedShiftForSwap}
                employees={data.employees}
                shifts={data.shifts}
                unitId={selectedUnit}
                onCreateSwapRequest={handleCreateSwapRequest}
            />
            <SwapManagementPanel
                isOpen={isSwapPanelOpen}
                onClose={() => setSwapPanelOpen(false)}
                requests={data.shiftSwapRequests}
                employees={data.employees}
                shifts={data.shifts}
                onApprove={actions.approveSwapRequest}
                onReject={actions.rejectSwapRequest}
            />
            <EmployeeModal
                isOpen={isEmployeeModalOpen}
                onClose={() => setEmployeeModalOpen(false)}
                onSave={actions.saveEmployee}
                employee={editingEmployee}
                units={visibleUnits} // Pasar solo unidades permitidas
            />
        </div>
    )
}


export default ShiftCalendarPage;
