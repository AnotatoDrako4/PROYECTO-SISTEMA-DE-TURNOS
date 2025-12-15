import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  label: string;
  defaultChecked?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, defaultChecked = false }) => {
  const [isOn, setIsOn] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <label className="text-slate-300 cursor-pointer" onClick={() => setIsOn(!isOn)}>
        {label}
      </label>
      <div
        onClick={() => setIsOn(!isOn)}
        className={`flex h-6 w-11 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
          isOn ? 'bg-brand' : 'bg-slate-700'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 700, damping: 30 }}
          className={`h-4 w-4 rounded-full bg-white ${isOn ? 'ml-auto' : ''}`}
        />
      </div>
    </div>
  );
};

export default ToggleSwitch;
