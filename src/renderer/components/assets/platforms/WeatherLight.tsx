import React from 'react';

const WeatherIconLight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Sun */}
      <circle cx="18" cy="13" r="5" fill="#FFD700" />
      <path
        d="M18 5V7M18 19V21M26 13H24M12 13H10M24.5 6.5L23 8M13 8L11.5 6.5M24.5 19.5L23 18M13 18L11.5 19.5"
        stroke="#FFD700"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Cloud */}
      <path
        d="M10 26C7.23858 26 5 23.7614 5 21C5 18.2386 7.23858 16 10 16C10.7286 16 11.4117 16.1444 12.0276 16.4067C12.9944 13.8441 15.3269 12 18 12C21.3137 12 24 14.6863 24 18C24 18.3407 23.9716 18.6748 23.9171 19M25 21C27.7614 21 30 23.2386 30 26C30 28.7614 27.7614 31 25 31H11C8.23858 31 6 28.7614 6 26C6 23.2386 8.23858 21 11 21C11.5634 21 12.1034 21.0961 12.6056 21.2742C13.5022 19.3931 15.5881 18 18 18C21.3137 18 24 20.6863 24 24C24 24.3407 23.9716 24.6748 23.9171 25"
        stroke="#2C3E50"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default WeatherIconLight;
