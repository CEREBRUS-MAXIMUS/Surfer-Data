import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import styled from 'styled-components';
import { setUserOS, setDataSourceImportStatus, startRun, setCurrentRoute, updateBreadcrumb } from '../state/actions';
import { Import, Link, Download, RefreshCw, Bug, ChevronRight, X } from 'lucide-react';
import DataExtractionTable from '../components/profile/DataExtractionTable';
import Platform from './Platform';
import RunDetailsPage from '../components/profile/RunDetailsPage';
import { platforms } from '../config/platforms';
import { openDB } from 'idb';
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useTheme } from '../components/ui/theme-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Progress } from "../components/ui/progress";

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

const Home = () => {
  const dispatch = useDispatch();
  const currentPage = useSelector((state) => state.currentPage);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedSubRun, setSelectedSubRun] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);

  const handlePlatformClick = (platform) => {
    setSelectedPlatform(platform);
    setSelectedSubRun(null);
    dispatch(setCurrentRoute(platform.id));
    dispatch(updateBreadcrumb([
      { icon: 'Home', text: 'Home', link: '/' },
      { icon: platform.logo, text: platform.name, link: platform.id },
    ]));
  };

  const handleSubRunClick = (subRun) => {
    setSelectedSubRun(subRun);
    dispatch(updateBreadcrumb([
      { icon: 'Home', text: 'Home', link: '/' },
      { icon: selectedPlatform.logo, text: selectedPlatform.name, link: selectedPlatform.id },
      { icon: subRun.icon, text: subRun.name, link: `${selectedPlatform.id}-${subRun.id}` },
    ]));
  };

  const handleViewRunDetails = (run) => {
    setSelectedRun(run);
  };

  const handleCloseRunDetails = () => {
    setSelectedRun(null);
  };

  useEffect(() => {
    dispatch(updateBreadcrumb([{ icon: 'Home', text: 'Home', link: '/' }]));
  }, []);

  const renderContent = () => {
    if (selectedRun) {
      return (
        <RunDetailsPage
          runId={selectedRun.id}
          onClose={handleCloseRunDetails}
          platform={platforms.find(p => p.id === selectedRun.platformId)}
        />
      );
    }

    if (selectedPlatform) {
      return (
        <Platform
          platform={selectedPlatform}
          onSubRunClick={handleSubRunClick}
          selectedSubRun={selectedSubRun}
        />
      );
    }

    return (
      <DataExtractionTable
        onPlatformClick={handlePlatformClick}
        onViewRunDetails={handleViewRunDetails}
      />
    );
  };

  return (
    <div className="w-full flex flex-col bg-background pt-6">
      <div className="w-10/11 pr-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Home;
