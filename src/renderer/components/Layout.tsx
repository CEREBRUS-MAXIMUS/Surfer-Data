import React from 'react';
import { Outlet } from 'react-router-dom';
import { SurferHeader } from './header/SurferHeader';
import WebviewManager from './profile/WebviewManager';

interface LayoutProps {
  webviewRefs: { [key: string]: React.RefObject<HTMLWebViewElement> };
  getWebviewRef: (runId: string) => React.RefObject<HTMLWebViewElement>;
  contentScale: number; 
  onHomeClick: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  webviewRefs,
  getWebviewRef,
  contentScale,
  onHomeClick,
  children
}) => {
  return (
    <div className="h-screen flex flex-col w-full">
      <SurferHeader className="flex-shrink-0 h-[55px] w-full" onHomeClick={onHomeClick} />
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
              webviewRefs={webviewRefs}
              getWebviewRef={getWebviewRef}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
