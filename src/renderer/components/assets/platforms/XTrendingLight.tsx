import React from 'react';

const TrendingIconLight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M31 8L18 21L13 16L5 24"
        stroke="#1DA1F2"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 8H31V14"
        stroke="#1DA1F2"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default TrendingIconLight;
