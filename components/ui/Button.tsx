import React from 'react';
import { motion } from 'framer-motion';

// FIX: Replaced the problematic HTMLMotionProps with a more robust type definition
// using React.ComponentProps<typeof motion.button>. This correctly inherits all
// standard button attributes (like onClick, disabled, className) and framer-motion props,
// resolving all type errors related to this component.
type ButtonProps = React.ComponentProps<typeof motion.button> & {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
};

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', isLoading = false, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all";
  
  const variantClasses = {
    primary: 'bg-primary/70 text-white hover:bg-primary border-white/30 focus:ring-primary',
    secondary: 'bg-white/10 text-slate-100 hover:bg-white/20 border-white/20 focus:ring-white/50',
    danger: 'bg-danger/70 text-white hover:bg-danger border-white/30 focus:ring-danger',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </motion.button>
  );
};

export default Button;
