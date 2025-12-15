import React, { useState, useMemo } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { type Shift, type Employee, type ShiftSwapRequest, ShiftSwapStatus } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

interface SwapManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ShiftSwapRequest[];
  employees: Employee[];
  shifts: Shift[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, notes: string) => void;
}

const RequestCard: React.FC<{
    request: ShiftSwapRequest;
    requester: Employee;
    requesterShift: Shift;
    target: Employee;
    targetShift: Shift;
    onApprove: (requestId: string) => void;
    onReject: (requestId: string, notes: string) => void;
}> = ({ request, requester, requesterShift, target, targetShift, onApprove, onReject }) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState('');

    const handleConfirmReject = () => {
        if (!rejectionNotes) {
            alert("Por favor, ingrese un motivo para el rechazo.");
            return;
        }
        onReject(request.id, rejectionNotes);
    };

    return (
        <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Requester Info */}
                <div className="flex items-center gap-3 text-center md:text-left">
                    <img src={requester.avatarUrl} alt={requester.name} className="h-10 w-10 rounded-full" />
                    <div>
                        <p className="font-semibold">{requester.name}</p>
                        <p className="text-xs text-slate-300">
                            {new Date(requesterShift.date + 'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short'})}, {requesterShift.type}
                        </p>
                    </div>
                </div>

                <div className="font-bold text-slate-400 text-xl">↔</div>
                
                {/* Target Info */}
                <div className="flex items-center gap-3 text-center md:text-left">
                    <img src={target.avatarUrl} alt={target.name} className="h-10 w-10 rounded-full" />
                    <div>
                        <p className="font-semibold">{target.name}</p>
                        <p className="text-xs text-slate-300">
                            {new Date(targetShift.date + 'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'short'})}, {targetShift.type}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => onApprove(request.id)} className="px-3 py-1 text-sm">Aprobar</Button>
                    <Button variant="danger" onClick={() => setIsRejecting(true)} className="px-3 py-1 text-sm">Rechazar</Button>
                </div>
            </div>

            <AnimatePresence>
                {isRejecting && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
                    >
                        <label htmlFor={`rejection-notes-${request.id}`} className="block text-sm font-medium text-slate-300 mb-2">Motivo del rechazo</label>
                        <textarea
                            id={`rejection-notes-${request.id}`}
                            rows={2}
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            className="block w-full sm:text-sm rounded-xl bg-white/5 border-white/20 focus:ring-primary focus:border-primary text-slate-100 placeholder:text-slate-400"
                            placeholder="Ej: Falta de personal calificado en el turno..."
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <Button variant="secondary" onClick={() => setIsRejecting(false)} className="px-3 py-1 text-sm">Cancelar</Button>
                            <Button variant="danger" onClick={handleConfirmReject} className="px-3 py-1 text-sm">Confirmar Rechazo</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const SwapManagementPanel: React.FC<SwapManagementPanelProps> = ({ isOpen, onClose, requests, employees, shifts, onApprove, onReject }) => {
    const pendingRequests = useMemo(() =>
        requests.filter(r => r.status === ShiftSwapStatus.PENDING),
        [requests]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Intercambios de Turno">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {pendingRequests.length > 0 ? (
                    pendingRequests.map(req => {
                        const requester = employees.find(e => e.id === req.requesterId);
                        const requesterShift = shifts.find(s => s.id === req.requesterShiftId);
                        const target = employees.find(e => e.id === req.targetEmployeeId);
                        const targetShift = shifts.find(s => s.id === req.targetShiftId);

                        if (!requester || !requesterShift || !target || !targetShift) {
                            return <div key={req.id} className="text-red-400">Datos de solicitud inválidos para ID: {req.id}</div>;
                        }

                        return (
                            <RequestCard
                                key={req.id}
                                request={req}
                                requester={requester}
                                requesterShift={requesterShift}
                                target={target}
                                targetShift={targetShift}
                                onApprove={onApprove}
                                onReject={onReject}
                            />
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <p className="text-slate-300">No hay solicitudes de intercambio pendientes.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SwapManagementPanel;
