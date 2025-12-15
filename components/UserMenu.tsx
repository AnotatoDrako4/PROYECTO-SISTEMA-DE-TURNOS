import React, { useState } from 'react';
// FIX: Import Variants type to correctly type framer-motion variants object.
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface UserMenuProps {
  userEmail: string;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ userEmail, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };
  
  // FIX: Explicitly type the variants object with Variants to prevent TypeScript
  // from inferring 'spring' as a generic string, which causes a type error.
  const menuVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } },
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full bg-brand-dark/50 flex items-center justify-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {getInitials(userEmail)}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/15 bg-slate-800/80 backdrop-blur-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1" role="none">
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-100 truncate" role="none">
                  {userEmail}
                </p>
                <p className="text-xs text-slate-400" role="none">
                  Administrador
                </p>
              </div>
              <div className="border-t border-white/10" />
              <button
                onClick={onLogout}
                className="w-full text-left block px-4 py-2 text-sm text-slate-200 hover:bg-brand/20 hover:text-white transition-colors"
                role="menuitem"
              >
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;