import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IAppState } from './types/interfaces';
import Layout from './components/Layout';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Platform from './pages/Platform';
import SubRun from './pages/SubRun';
import Settings from './pages/Settings';
import RunDetailsPage from './components/profile/RunDetailsPage';
import { setContentScale, setCurrentRoute, updateBreadcrumb } from './state/actions';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { Toaster } from './components/ui/toaster';
import { platforms } from './config/platforms';

function Surfer() {
  const dispatch = useDispatch();
  const contentScale = useSelector((state: IAppState) => state.preferences.contentScale);
  const route = useSelector((state: IAppState) => state.app.route);
  const webviewRef = useRef(null);
  const [showNotConnectedAlert, setShowNotConnectedAlert] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle content zooming
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === '=' || event.key === '-')
      ) {
        event.preventDefault();
        const scaleDelta = event.key === '=' ? 0.05 : -0.05;
        const currentScale = isNaN(contentScale) ? 1 : contentScale;
        const newScale = Math.max(0.5, Math.min(2, currentScale + scaleDelta));
        if (!isNaN(newScale)) {
          dispatch(setContentScale(Number(newScale.toFixed(2))));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const handleConnect = async (company: string) => {
      console.log('CALLING HANDLE CONNECT!!');
      setIsConnected(false);
      setShowNotConnectedAlert(true);
      setTimeout(() => setShowNotConnectedAlert(false), 3000);
      console.log('need to connect for: ', company);
    };

    window.electron.ipcRenderer.on('connect-website', handleConnect);

    // Listen for route changes from the main process
    window.electron.ipcRenderer.on('route-change', (route: string) => {
      console.log('Route change received:', route);
      dispatch(setCurrentRoute(route));
    });

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.electron.ipcRenderer.removeAllListeners('connect-website');
      window.electron.ipcRenderer.removeAllListeners('route-change');
    };
  }, [dispatch, contentScale]);

  useEffect(() => {
    console.log('Current route:', route);
  }, [route]);

  const safeContentScale = isNaN(contentScale) ? 1 : contentScale;

  const renderContent = () => {
    const currentRoute = route || '/home';
    const routeParts = currentRoute.split('/').filter(Boolean);

    switch (routeParts[0]) {
      case 'home':
        return <Home />;
      case 'settings':
        return <Settings />;
      case 'platform':
        if (routeParts.length > 1) {
          const platformId = routeParts[1];
          const platform = platforms.find(p => p.id === platformId);
          if (platform) {
            return <Platform platform={platform} />;
          } else {
            console.warn(`Platform not found for id: ${platformId}`);
            return <Home />;
          }
        }
        return <Home />;
      case 'subrun':
        if (routeParts.length > 2) {
          const platformId = routeParts[1];
          const subRunId = routeParts[2];
          const platform = platforms.find(p => p.id === platformId);
          if (platform) {
            const subRun = platform.subRuns.find(sr => sr.id === subRunId);
            if (subRun) {
              return <SubRun platform={platform} subRun={subRun} />
            } else {
              console.warn(`SubRun not found for id: ${subRunId}`);
              return <Platform platform={platform} />
            }
          } else {
            console.warn(`Platform not found for id: ${platformId}`);
            return <Home />;
          }
        }
        return <Home />;
      default:
        console.warn('Unknown route:', currentRoute);
        return <Home />;
    }
  };

  const handleHomeClick = () => {
    console.log('Home clicked');
    dispatch(setCurrentRoute('/home'));
    dispatch(updateBreadcrumb([{ icon: 'Home', text: 'Home', link: '/home' }]));
  };

  return (
    <div className={`flex h-screen`}>
      <div className="flex-1 transition-all duration-300">
        <div className="w-full h-full bg-background">
          {(route === '/' || route === undefined) ? (
            <Landing />
          ) : (
            <Layout
              webviewRef={webviewRef}
              isConnected={isConnected}
              setIsConnected={setIsConnected}
              contentScale={safeContentScale}
              onHomeClick={handleHomeClick}
            >
              {renderContent()}
            </Layout>
          )}
          <Toaster />
          {showNotConnectedAlert && (
            <Alert
              className="fixed bottom-4 right-4 w-auto"
              variant="moreDestructive"
            >
              <AlertTitle>Account not connected</AlertTitle>
              <AlertDescription>
                Please sign into your account then hit the "I've signed in" button!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

export default Surfer;
