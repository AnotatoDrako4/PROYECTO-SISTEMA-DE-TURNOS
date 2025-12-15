import React from 'react';
import Card from './Card';

interface SettingsCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, children }) => {
  return (
    <Card>
      <div className="border-b border-white/10 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="text-sm">{children}</div>
    </Card>
  );
};

export default SettingsCard;
