import React from 'react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-t border-white/10">
      <span className="text-sm text-slate-400">
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button onClick={handlePrev} disabled={currentPage === 1} variant="secondary" className="text-xs py-1 px-3">
          Anterior
        </Button>
        <Button onClick={handleNext} disabled={currentPage === totalPages} variant="secondary" className="text-xs py-1 px-3">
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
