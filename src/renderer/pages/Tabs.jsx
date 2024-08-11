import { useSelector, useDispatch } from 'react-redux';
import { SurferHeader } from '../components/header/SurferHeader';
import { createNewWorkspace } from '../state/actions';
import { useState, useEffect, useRef } from 'react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import Home from './Home';
import { setContentScale } from '../state/actions';
import DataSources from '../components/profile/DataSources';
import WebviewManager from '../components/profile/WebviewManager';
import { platforms } from '../config/platforms';

const Tabs = () => {
  const dispatch = useDispatch();
  const contentScale = useSelector((state) => state.preferences.contentScale);
  const webviewRef = useRef(null);
  const [showNotConnectedAlert, setShowNotConnectedAlert] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event) => {
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

    const handleConnect = async (company) => {
      console.log('CALLING HANDLE CONNECT!!');
      setIsConnected(false);
      setShowNotConnectedAlert(true);
      setTimeout(() => setShowNotConnectedAlert(false), 3000);
      console.log('need to connect for: ', company);
    };

    window.electron.ipcRenderer.on('connect-website', handleConnect);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.electron.ipcRenderer.removeAllListeners(
        'connect-website',
        handleConnect,
      );
    };
  }, [dispatch, contentScale]);

  const safeContentScale = isNaN(contentScale) ? 1 : contentScale;

  return (
    <div className=" h-screen flex flex-col w-full">
      <SurferHeader className="flex-shrink-0 h-[55px] w-full" />
      <main className="flex-grow overflow-hidden relative w-full max-w-full min-w-full bg-background">
        <div
          className="absolute top-0 left-0 w-full h-full overflow-auto"
          style={{
            transform: `scale(${safeContentScale})`,
            transformOrigin: 'top left',
            width: `${100 / safeContentScale}%`,
            height: `${100 / safeContentScale}%`,
          }}
        >
          <div className="absolute inset-0 w-full h-full">
            <DataSources webviewRef={webviewRef} />
            <WebviewManager
              webviewRef={webviewRef}
              isConnected={isConnected}
              setIsConnected={setIsConnected}
            />
          </div>
        </div>
      </main>
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
  );
};

export default Tabs;
