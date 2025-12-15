import React from 'react';
import Card from '../ui/Card';
import FileDownloadIcon from '../icons/FileDownloadIcon';

interface ReportCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, children }) => {
  return (
    <Card className="flex flex-col">
      <div className="border-b border-white/10 pb-3 mb-3">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-base font-semibold text-slate-100">{title}</h3>
                <p className="text-xs text-slate-400">{description}</p>
            </div>
            <div className="relative group">
                <button className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 hidden group-hover:block">
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-brand/20 flex items-center gap-2"><FileDownloadIcon className="w-4 h-4" /> Exportar PDF</button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-brand/20 flex items-center gap-2"><FileDownloadIcon className="w-4 h-4" /> Exportar Excel</button>
                </div>
            </div>
        </div>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </Card>
  );
};

export default ReportCard;
