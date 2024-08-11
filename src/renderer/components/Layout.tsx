import React from 'react';
import { Outlet } from 'react-router-dom';
import { SurferHeader } from './header/SurferHeader';
import WebviewManager from './profile/WebviewManager';

interface LayoutProps {
  webviewRef: React.RefObject<any>;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  contentScale: number;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ webviewRef, isConnected, setIsConnected, contentScale, children }) => {
  return (
    <div className="h-screen flex flex-col w-full">
      <SurferHeader className="flex-shrink-0 h-[55px] w-full" />
      <main className="flex-grow overflow-hidden relative w-full max-w-full min-w-full bg-background">
        <div
          className="absolute top-0 left-0 w-full h-full overflow-auto"
          style={{
            transform: `scale(${contentScale})`,
            transformOrigin: 'top left',
            width: `${100 / contentScale}%`,
            height: `${100 / contentScale}%`,
          }}
        >
          <div className="absolute inset-0 w-full h-full">
            {children}
            <WebviewManager
              webviewRef={webviewRef}
              isConnected={isConnected}
              setIsConnected={setIsConnected}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
