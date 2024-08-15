import React from 'react';

const NewsIconLight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="4"
        y="8"
        width="28"
        height="20"
        rx="2"
        stroke="#2C3E50"
        strokeWidth="2"
      />
      <path d="M4 12H32" stroke="#2C3E50" strokeWidth="2" />
      <rect x="8" y="16" width="12" height="8" fill="#4A90E2" />
      <line
        x1="22"
        y1="17"
        x2="28"
        y2="17"
        stroke="#2C3E50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="22"
        y1="21"
        x2="28"
        y2="21"
        stroke="#2C3E50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="22"
        y1="25"
        x2="28"
        y2="25"
        stroke="#2C3E50"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default NewsIconLight;
