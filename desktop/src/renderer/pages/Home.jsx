import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentRoute, updateBreadcrumb } from '../state/actions';
import DataExtractionTable from '../components/PlatformDashboard';

const Home = () => {
  const dispatch = useDispatch();
  const handlePlatformClick = (platform) => {
    dispatch(setCurrentRoute(`/platform/${platform.id}`, { platform }));
    dispatch(updateBreadcrumb([
      { text: 'Home', link: '/home' },
      { text: platform.name, link: `/platform/${platform.id}` },
    ]));
  };

  return (
    <div className="w-full flex flex-col bg-background h-screen">
      <DataExtractionTable
        onPlatformClick={handlePlatformClick}
      />
    </div>
  );
};

export default Home;
