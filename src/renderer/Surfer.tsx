import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IAppState } from './types/interfaces';
import Layout from './components/Layout';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Platform from './pages/Platform'; 
import SubRun from './pages/SubRun';
import Settings from './pages/Settings';
import RunDetailsPage from './components/profile/RunDetailsPage';
import { setContentScale, setCurrentRoute, updateBreadcrumb, stopAllJobs, updateRunConnected } from './state/actions';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { Toaster } from './components/ui/toaster';
import { Progress } from './components/ui/progress';

function Surfer() {
  const dispatch = useDispatch();
  const contentScale = useSelector((state: IAppState) => state.preferences.contentScale);
  const route = useSelector((state: IAppState) => state.app.route);
  const runs = useSelector((state: IAppState) => state.app.runs);
    const activeRuns = runs.filter(
      (run) => run.status === 'pending' || run.status === 'running',
    );
  const webviewRefs = useRef<{ [key: string]: React.RefObject<HTMLWebViewElement> }>({});

  const [showNotConnectedAlert, setShowNotConnectedAlert] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [content, setContent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    const handleUpdateDownloadProgress = (progress: number) => {
      console.log('Update download progress:', progress);
      setUpdateProgress(progress);
    };

    window.electron.ipcRenderer.on('update-download-progress', handleUpdateDownloadProgress);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-download-progress');
    };
  }, []);

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



    // Listen for route changes from the main process
    window.electron.ipcRenderer.on('route-change', (route: string) => {
      console.log('Route change received:', route);
      dispatch(setCurrentRoute(route));
    });

    const handleStopAllJobs = async () => {
      console.log('Stopping all jobs...');
      await dispatch(stopAllJobs());
      window.electron.ipcRenderer.send('jobs-stopped');
    };

    window.electron.ipcRenderer.on('stop-all-jobs', handleStopAllJobs);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.electron.ipcRenderer.removeAllListeners('route-change');
      window.electron.ipcRenderer.removeListener('stop-all-jobs', handleStopAllJobs);
    };
  }, [dispatch, contentScale]);

  useEffect(() => {
    const handleConnect = async (runID: string) => {
      console.log('CALLING HANDLE CONNECT!!');
      const runToConnect = activeRuns.find(run => run.id === runID);
      if (runToConnect) {
        dispatch(updateRunConnected(runID, false));
        setShowNotConnectedAlert(true);
        setTimeout(() => setShowNotConnectedAlert(false), 3000);
        console.log('need to connect for: ', runToConnect.company);
      }

      else {
        console.log('no run to connect!')
      }
    };

    window.electron.ipcRenderer.on('connect-website', handleConnect);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('connect-website', handleConnect)
    }
  }, [activeRuns.length])

  useEffect(() => {
    console.log('Current route:', route);
  }, [route]);

  const safeContentScale = isNaN(contentScale) ? 1 : contentScale;

  const renderContent = useCallback(async () => {
    const currentRoute = route || '/home';
    const routeParts = currentRoute.split('/').filter(Boolean);

    let newContent: React.ReactNode;

    switch (routeParts[0]) {
      case 'home':
        newContent = <Home />;
        break;
      case 'settings':
        newContent = <Settings />;
        break;
      case 'platform':
        if (routeParts.length > 1) {
          const platformId = routeParts[1];
          const scrapers = await window.electron.ipcRenderer.invoke('get-scrapers');
          const platform = scrapers.find((p: any) => p.id === platformId);
          if (platform) {
            newContent = <Platform platform={platform} />;
          } else {
            console.warn(`Platform not found for id: ${platformId}`);
            newContent = <Home />;
          }
        } else {
          newContent = <Home />;
        }
        break;
      case 'subrun':
        if (routeParts.length > 2) {
          const platformId = routeParts[1];
          const subRunId = routeParts[2];
          const scrapers = await window.electron.ipcRenderer.invoke('get-scrapers');
          const platform = scrapers.find((p: any) => p.id === platformId);
          if (platform) {
            const subRun = platform.subRuns.find(sr => sr.id === subRunId);
            if (subRun) {
              newContent = <SubRun platform={platform} subRun={subRun} />;
            } else {
              console.warn(`SubRun not found for id: ${subRunId}`);
              newContent = <Platform platform={platform} />;
            }
          } else {
            console.warn(`Platform not found for id: ${platformId}`);
            newContent = <Home />;
          }
        }
        newContent = <Home />;
        break;
      default:
        console.warn('Unknown route:', currentRoute);
        newContent = <Home />;
    }

    setContent(newContent);
  }, [route]);

  useEffect(() => {
    renderContent();
  }, [renderContent]);

  const handleHomeClick = () => {
    console.log('Home clicked');
    dispatch(setCurrentRoute('/home'));
    dispatch(updateBreadcrumb([{ icon: 'Home', text: 'Home', link: '/home' }]));
  };

  const getWebviewRef = (runId: string) => {
    if (!webviewRefs.current[runId]) {
      webviewRefs.current[runId] = React.createRef();
    }
    return webviewRefs.current[runId];
  };

  return (
    <div className={`flex h-screen`}>
      <div className="flex-1 transition-all duration-300">
        <div className="w-full h-full bg-background">
          {(route === '/' || route === undefined) ? (
            <Landing />
          ) : (
            <Layout
              webviewRefs={webviewRefs.current}
              getWebviewRef={getWebviewRef}
              contentScale={safeContentScale}
              onHomeClick={handleHomeClick}
            >
              {content}
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
                Please click the eye in the top right to sign into your account and then hit the "I've signed in" button!
              </AlertDescription>
            </Alert>
          )}
          {updateProgress !== null && (
            <div className="fixed bottom-4 left-4 right-4 bg-background p-4 rounded-lg shadow-lg">
              <h3 className="text-sm font-semibold mb-2">Downloading Update: {updateProgress.toFixed(0)}%</h3>
              <Progress value={updateProgress} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Surfer;