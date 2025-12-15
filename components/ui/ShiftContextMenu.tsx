
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shift, Employee } from '../../types';

interface ShiftContextMenuProps {
  x: number;
  y: number;
  shift: Shift;
  employee?: Employee;
  onModify: () => void;
  onSwap: () => void;
  onDelete: () => void;
  onAutoFill: () => void;
  onClose: () => void;
}

const MenuItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void; 
    variant?: 'default' | 'danger' | 'accent';
    disabled?: boolean; 
}> = ({ icon, label, onClick, variant = 'default', disabled = false }) => {
    
    const colors = {
        default: "text-slate-200 hover:bg-white/10 hover:text-white",
        danger: "text-red-400 hover:bg-red-500/20 hover:text-red-200",
        accent: "text-brand-accent hover:bg-brand-accent/20 hover:text-white"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : colors[variant]}`}
        >
            <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
            {label}
        </button>
    );
};

const ShiftContextMenu: React.FC<ShiftContextMenuProps> = ({ x, y, shift, employee, onModify, onSwap, onDelete, onAutoFill, onClose }) => {
  const [adjustedPosition, setAdjustedPosition] = useState({ top: y, left: x });

  // Detectar si la modalidad permite autorrellenado (4x4 o 7x7)
  const canAutoFill = employee && ['4x4', '7x7'].includes(employee.modality);

  useEffect(() => {
    // Lógica para evitar que el menú se salga de la pantalla
    const menuWidth = 240;
    const estimatedHeight = 250; // Altura aproximada del menú
    const padding = 16;
    
    let newLeft = x;
    let newTop = y;

    if (typeof window !== 'undefined') {
        // Ajuste Horizontal (Derecha -> Izquierda)
        if (x + menuWidth > window.innerWidth - padding) {
            newLeft = x - menuWidth;
        }

        // Ajuste Vertical (Abajo -> Arriba)
        // Si el clic es muy abajo, mostramos el menú hacia arriba
        if (y + estimatedHeight > window.innerHeight - padding) {
            newTop = y - estimatedHeight;
        }
    }

    setAdjustedPosition({ left: newLeft, top: newTop });
  }, [x, y]);

  // Usamos Portal para renderizar fuera del contenedor padre que puede tener transformaciones CSS
  // Esto asegura que position: fixed sea relativo a la ventana y no al contenedor.
  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998] bg-transparent" 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} 
      />
      <AnimatePresence>
          <motion.div
            className="fixed z-[9999] w-60 rounded-xl border border-white/15 bg-slate-800/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/50 overflow-hidden flex flex-col p-1.5"
            style={{ 
                top: adjustedPosition.top, 
                left: adjustedPosition.left 
            }}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Header Info */}
            <div className="px-3 py-2 mb-1 border-b border-white/10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones de Turno</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{shift.date} • {shift.type}</p>
            </div>

            <MenuItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                label="Modificar Turno"
                onClick={onModify}
            />
            
            <MenuItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                label="Solicitar Intercambio"
                onClick={onSwap}
            />

            {canAutoFill && (
                 <MenuItem 
                    variant="accent"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
                    label={`Autorrellenar Ciclo ${employee?.modality}`}
                    onClick={onAutoFill}
                />
            )}

            <div className="h-px bg-white/10 my-1 mx-2" />

            <MenuItem 
                variant="danger"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                label="Eliminar Turno"
                onClick={onDelete}
            />

          </motion.div>
      </AnimatePresence>
    </>,
    document.body
  );
};

export default ShiftContextMenu;
