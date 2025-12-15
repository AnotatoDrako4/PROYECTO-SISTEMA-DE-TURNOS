import React from 'react';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="24" height="24" rx="6" fill="url(#paint0_linear_1_2)" />
            {/* Clock ticks */}
            <rect x="11" y="4" width="2" height="4" rx="1" fill="white" fillOpacity="0.7" />
            <rect x="18" y="11" width="4" height="2" rx="1" fill="white" fillOpacity="0.7" />
            <rect x="11" y="16" width="2" height="4" rx="1" fill="white" fillOpacity="0.7" />
            <rect x="2" y="11" width="4" height="2" rx="1" fill="white" fillOpacity="0.7" />
            
            {/* Checkmark */}
            <path
              d="M9 12.5L11.5 15L16 10"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            <defs>
                <linearGradient
                    id="paint0_linear_1_2"
                    x1="0"
                    y1="0"
                    x2="24"
                    y2="24"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default Logo;