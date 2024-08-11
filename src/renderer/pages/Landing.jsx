import React from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentRoute } from '../state/actions';

const Landing = () => {
  const dispatch = useDispatch();
  const handleNavigation = (route) => {
    console.log('Navigating to:', route);
    dispatch(setCurrentRoute(route));
  };

  return (
    <div className="flex-grow flex overflow-hidden bg-background text-white">
      <div className="w-full h-screen flex flex-col items-center justify-center relative">
        <h1 className="text-6xl font-bold z-10 text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
          Surfer
        </h1>
        <p className="text-xl z-10 text-white">
          Command+T for a new workspace
        </p>
        <button
          onClick={() => handleNavigation('/home')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default Landing;
