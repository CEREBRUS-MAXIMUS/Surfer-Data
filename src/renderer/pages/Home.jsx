import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateBreadcrumb } from '../state/actions';
import DataExtractionTable from '../components/profile/DataExtractionTable';
import Platform from './Platform';
import RunDetailsPage from '../components/profile/RunDetailsPage';
import { platforms } from '../config/platforms';

const Home = () => {
  const dispatch = useDispatch();
  const currentRoute = useSelector((state) => state.app.currentRoute);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedSubRun, setSelectedSubRun] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    // Reset breadcrumb and state when component mounts
    setSelectedPlatform(null);
    setSelectedSubRun(null);
    setSelectedRun(null);
    dispatch(updateBreadcrumb([{ text: 'Home', link: '/home' }]));
  }, [dispatch]);

  useEffect(() => {
    if (currentRoute === '/home') {
      setSelectedPlatform(null);
      setSelectedSubRun(null);
      setSelectedRun(null);
      dispatch(updateBreadcrumb([{ text: 'Home', link: '/home' }]));
    }
  }, [currentRoute, dispatch]);

  const handlePlatformClick = (platform) => {
    setSelectedPlatform(platform);
    setSelectedSubRun(null);
    dispatch(updateBreadcrumb([
      { text: 'Home', link: '/home' },
      { text: platform.name, link: platform.id },
    ]));
  };

  const handleSubRunClick = (subRun) => {
    setSelectedSubRun(subRun);
    dispatch(updateBreadcrumb([
      { text: 'Home', link: '/home' },
      { text: selectedPlatform.name, link: selectedPlatform.id },
      { text: subRun.name, link: `${selectedPlatform.id}-${subRun.id}` },
    ]));
  };

  const handleViewRunDetails = (run) => {
    setSelectedRun(run);
  };

  const handleCloseRunDetails = () => {
    setSelectedRun(null);
  };

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
