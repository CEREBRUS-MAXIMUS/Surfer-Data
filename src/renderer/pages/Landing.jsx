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
    <div className="flex-grow flex overflow-hidden bg-background">
      <div className="w-full h-screen flex flex-col items-center justify-center relative">
        <h1 className="text-6xl font-bold z-10" >
          Surfer
        </h1>
        <button
          onClick={() => handleNavigation('/home')}
          className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default Landing;
