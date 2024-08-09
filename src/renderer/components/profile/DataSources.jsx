import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../ui/button';
import styled from 'styled-components';
import { setUserOS, setDataSourceImportStatus, startRun } from '../../state/actions';
import { Import, Link, Download, RefreshCw, Bug, ChevronRight, X } from 'lucide-react';
import DataExtractionTable from './DataExtractionTable';
import PlatformDashboard from './PlatformDashboard';
import { platforms } from '../../config/platforms';
import { openDB } from 'idb';
import { Dialog, DialogContent } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { useTheme } from '../ui/theme-provider';

const Container = styled.div`
  display: flex;
  width: 100%;
`;

const Sidebar = styled.div`
  width: 400px;
  padding-right: 16px;
`;

const WebviewContainer = styled.div`
  padding: 16px;
  background-color: #f0f0f0;
  border-radius: 0 0 8px 8px;
`;

const FakeBrowser = styled.div`
  background-color: #2c2c2c;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
`;

const BrowserHeader = styled.div`
  background-color: #3c3c3c;
  padding: 8px 16px;
  display: flex;
  align-items: center;
`;

const TrafficLights = styled.div`
  display: flex;
  gap: 8px;
`;

const TrafficLight = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

const IconButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.disabled ? 'transparent' : '#ffffff1a'};
  }
`;

const PlaceholderText = styled.p`
  color: #ffffff60;
  font-size: 18px;
`;

// Add these new styled components
const SpinnerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.5s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const DataSources = (webviewRef) => {
  const dispatch = useDispatch();
  const userOS = useSelector((state) => state.user.os);
  const dataSources = useSelector((state) => state.user.dataSources);
  const webviews = useSelector((state) => state.webviews);

  const [currentView, setCurrentView] = useState('main');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedSubRun, setSelectedSubRun] = useState(null);
  const { theme } = useTheme();
  const LOGO_SIZE = 32;

  const handlePlatformClick = (platform) => {
    setSelectedPlatform(platform);
    setSelectedSubRun(null);
    setCurrentView(platform.id);
  };

  const handleSubRunClick = (subRun) => {
    setSelectedSubRun(subRun);
    setCurrentView(`${selectedPlatform.id}-${subRun.id}`);
  };

  const handleBreadcrumbClick = (level) => {
    if (level === 'main') {
      setCurrentView('main');
      setSelectedPlatform(null);
      setSelectedSubRun(null);
    } else if (level === 'platform') {
      setCurrentView(selectedPlatform.id);
      setSelectedSubRun(null);
    }
  };

  const handleWillNavigate = (event) => {
    const url = event.url;
    const date = Date.now();
    if (url.startsWith('blob:') || url.includes('download')) {
      event.preventDefault();
      console.log('sending handle-download to main process');
      window.electron.ipcRenderer.send('handle-download', {
        url,
        date,
      });
    }
  };

  const handleWillDownload = (event, item) => {
    event.preventDefault();
    const url = item.getURL();
    const date = Date.now();
    console.log('Intercepted download:', url);
    window.electron.ipcRenderer.send('handle-download', {
      url,
      date,
    });
  };

  const checkAuthStatus = async () => {
    const status = await getAuthStatus();
    setAuthStatus(status);
  };

  const handleRequestAccess = async () => {
    const result = await requestAccess();
    setAuthStatus(result);
  };

  const handleImport = async (sourceId) => {
    dispatch(setDataSourceImportStatus(sourceId, 'importing'));
    try {
      if (sourceId === 'apple_contacts') {
        const contacts = await getAllContacts();
        console.log('Imported contacts:', contacts);
        // Here you would typically store these contacts in your app's state or database
      }
      dispatch(setDataSourceImportStatus(sourceId, 'imported'));
    } catch (error) {
      console.error('Import failed:', error);
      dispatch(setDataSourceImportStatus(sourceId, 'not_imported'));
    }
  };

  const handleRefresh = (sourceId) => {
    // dispatch(refreshDataSource(sourceId));
  };




  useEffect(() => {
    const initDB = async () => {
      const db = await openDB('dataExtractionDB', 1, {
        upgrade(db) {
          db.createObjectStore('runs', { keyPath: 'id' });
        },
      });
    };
    initDB();
  }, []);




  const renderDashboard = () => {
    if (selectedPlatform) {
      return <PlatformDashboard
        platform={selectedPlatform}
        onSubRunClick={handleSubRunClick}
        selectedSubRun={selectedSubRun}
      />;
    }
    return null;
  };

  const getPlatformLogo = (platform) => {
    if (!platform || !platform.logo) {
      console.error('Invalid platform object:', platform);
      return null;
    }
    const Logo = theme === 'dark' ? platform.logo.dark : platform.logo.light;
    return Logo ? (
      <div style={{ width: `${LOGO_SIZE}px`, height: `${LOGO_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo style={{ width: '100%', height: '100%' }} />
      </div>
    ) : null;
  };

  return (
    <div className="w-full flex flex-col bg-background pt-6">
      {currentView === 'main' ? (
        <div className="w-10/11 pr-4">
          <DataExtractionTable
            onPlatformClick={handlePlatformClick}
            webviewRef={webviewRef}
          />
        </div>
      ) : (
        renderDashboard()
      )}
    </div>
  );
};

export default DataSources;
