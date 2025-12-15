import React from 'react';
import { Employee } from '../../types';

const ModalityPill: React.FC<{ modality: Employee['modality'] }> = ({ modality }) => {
  const modalityStyles: Record<Employee['modality'], string> = {
    '24/7': 'bg-red-500/20 text-red-300',
    '4x4': 'bg-purple-500/20 text-purple-300',
    '7x7': 'bg-orange-500/20 text-orange-300',
    'Administrativo': 'bg-green-500/20 text-green-300',
    '5x2': 'bg-sky-500/20 text-sky-300',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block ${modalityStyles[modality]}`}>
      {modality}
    </span>
  );
};

export default ModalityPill;
