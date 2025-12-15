import React from 'react';
import { Employee } from '../../types';

const StatusBadge: React.FC<{ status: Employee['status'] }> = ({ status }) => {
    const statusStyles: Record<Employee['status'], string> = {
        'Activo': 'bg-green-500/20 text-green-300',
        'Inactivo': 'bg-slate-700/50 text-slate-400',
        'Licencia': 'bg-yellow-500/20 text-yellow-300',
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    )
}

export default StatusBadge;