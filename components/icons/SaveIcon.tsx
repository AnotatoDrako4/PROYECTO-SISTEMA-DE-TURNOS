import React from 'react';

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5m-13.5 0h13.5" />
        <path d="M12 3v13.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.5 16.5H7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.5 21H4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.5 3H4.5a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3z" strokeWidth="0" fill="currentColor" fillOpacity="0.1" />
        <path d="M9 8.25h6" stroke="currentColor" strokeLinecap="round" />
        <path d="M9 12h6" stroke="currentColor" strokeLinecap="round" />
        <path d="M9 15.75h3" stroke="currentColor" strokeLinecap="round" />
    </svg>
);

export default SaveIcon;
