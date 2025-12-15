import React from 'react';

const DepartmentsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21v-6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21.75 15v6m-18 0h18M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5M5.25 6.75V3.75a2.25 2.25 0 0 1 2.25-2.25h8.25a2.25 2.25 0 0 1 2.25 2.25v3M9 12.75h6" />
    </svg>
);

export default DepartmentsIcon;