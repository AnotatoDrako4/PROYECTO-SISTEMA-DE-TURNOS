import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/40 p-5 ${className}`}>
      {children}
    </div>
  );
};

export default Card;