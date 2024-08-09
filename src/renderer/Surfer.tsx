import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Tabs from './pages/Tabs';
import Settings from './components/profile/Settings';

import { Toaster } from './components/ui/toaster';
import { IAppState } from './types/interfaces';

function Surfer() {
  const currentPage = useSelector((state: IAppState) => state.currentPage);
  const { applicationFont } = useSelector((state: IAppState) => state.preferences);

  console.log('currentPage', currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'tabs':
        return <Tabs />;
      case 'settings':
        return <Settings />;
    }
  };

  const getFontClass = () => {
    switch (applicationFont) {
      case 'niramit':
        return 'font-niramit';
      case 'bricolage':
        return 'font-bricolage';
      case 'gurajada':
        return 'font-gurajada';
      case 'averia':
        return 'font-averia';
      default:
        return 'font-sans';
    }
  };

  return (
    <div className={`flex h-screen ${getFontClass()}`}>
      <div className="flex-1 transition-all duration-300">
        <div className="w-full h-full">
          {renderPage()}
          <Toaster />
        </div>
      </div>
    </div>
  );
}

export default Surfer;
