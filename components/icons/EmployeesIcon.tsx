import React from 'react';

const EmployeesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.308M15 19.128v-3.86a2.25 2.25 0 0 1 2.25-2.25h.563a2.25 2.25 0 0 1 2.25 2.25v3.86M15 19.128a9.37 9.37 0 0 0-2.625.372 9.337 9.337 0 0 0-4.121-2.308m-2.25-4.5a2.25 2.25 0 0 0-2.25-2.25H6.375a2.25 2.25 0 0 0-2.25 2.25v3.86m0-3.86a9.37 9.37 0 0 1 2.625.372 9.337 9.337 0 0 1 4.121 2.308M6.375 9.75a2.25 2.25 0 0 1 2.25-2.25h.563a2.25 2.25 0 0 1 2.25 2.25s0 0 0 0v.625a2.25 2.25 0 0 0-2.25 2.25H8.625a2.25 2.25 0 0 0-2.25-2.25v-.625s0 0 0 0ZM12 15.375a3.375 3.375 0 1 1 0-6.75 3.375 3.375 0 0 1 0 6.75Z" />
    </svg>
);

export default EmployeesIcon;