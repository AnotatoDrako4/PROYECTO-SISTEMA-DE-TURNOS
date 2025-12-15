import React from 'react';
// FIX: Import Variants type to correctly type framer-motion variants object.
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const modalBackdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

// FIX: Explicitly type the variants object with Variants to prevent TypeScript
// from inferring 'spring' as a generic string, which causes a type error.
// Also, removed 'duration' from the spring transition as it's not idiomatic.
const modalContentVariants: Variants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: {
        scale: 0.95,
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
        {isOpen && (
             <motion.div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" 
                onClick={onClose}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={modalBackdropVariants}
             >
                <motion.div 
                    className="relative rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-2xl w-full max-w-2xl transform" 
                    onClick={e => e.stopPropagation()}
                    variants={modalContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <div className="flex items-start justify-between p-5">
                        <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            className="text-slate-400 bg-transparent hover:bg-white/20 hover:text-white rounded-full text-sm p-1.5 ml-auto inline-flex items-center"
                            onClick={onClose}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </motion.button>
                    </div>
                    <div className="px-5 pb-6 space-y-6">
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default Modal;