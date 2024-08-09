import React, { useState, useEffect, useRef } from 'react';

const Home = () => {


  return (
    <div className="flex-grow flex overflow-hidden bg-background text-white">
      <div className="w-full h-screen flex flex-col items-center justify-center relative">
        <h1 className="text-6xl font-bold z-10 text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
          Surfer
        </h1>
        <p className="text-xl z-10 text-white">
          Command+T for a new workspace
        </p>
      </div>
    </div>
  );
};

export default Home;
