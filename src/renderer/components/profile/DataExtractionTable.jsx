import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startRun, toggleRunVisibility, setExportRunning, updateExportStatus } from '../../state/actions';
import { useTheme } from '../ui/theme-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { ArrowUpRight, ArrowRight, Check, X, Link, Download, Search, ChevronLeft, ChevronRight, HardDriveDownload, Folder, Eye } from 'lucide-react';
import { platforms } from '../../config/platforms';
import { openDB } from 'idb';
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { formatDistanceToNow, parseISO, format, isToday, isYesterday } from 'date-fns';
import { Progress } from "../ui/progress";
import RunDetailsPage from './RunDetailsPage';
import { platform } from 'os';
import { MoonLoader } from 'react-spinners';
import ConfettiExplosion from 'react-confetti-explosion';

const DataExtractionTable = ({ onPlatformClick, webviewRef }) => {
  const dispatch = useDispatch();
  const runs = useSelector(state => state.app.runs);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { theme } = useTheme(); // Get the current theme
  const [dbUpdateTrigger, setDbUpdateTrigger] = useState(0);
  const dbRef = useRef(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [completedRuns, setCompletedRuns] = useState({});
  const prevRunsRef = useRef({});
  const [hoveredPlatformId, setHoveredPlatformId] = useState(null);

  const LOGO_SIZE = 24; // Set a consistent size for all logos

  const loadRuns = useCallback(async () => {
    const db = await openDB('dataExtractionDB', 1, {
      upgrade(db) {
        db.createObjectStore('runs', { keyPath: 'id' });
      },
    });
    dbRef.current = db;
    const loadedRuns = await db.getAll('runs');
    loadedRuns.forEach(run => {
      dispatch(addRun(run.platformId, run));
    });
  }, [dispatch]);

  useEffect(() => {
    loadRuns();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, [loadRuns, dbUpdateTrigger]);

  useEffect(() => {
    const handleDbChange = () => {
      setDbUpdateTrigger(prev => prev + 1);
    };

    window.electron.ipcRenderer.on('db-changed', handleDbChange);

    return () => {
      window.electron.ipcRenderer.removeListener('db-changed', handleDbChange);
    };
  }, []);

  // useEffect(() => {
  //   console.log('opening dev tools')
  //   window.electron.ipcRenderer.send('show-dev-tools')
  // }, [])



  const getLatestRun = useCallback((platformId) => {
    const platformRuns = runs.filter(run => run.platformId === platformId);
    if (platformRuns.length === 0) return null;

    return platformRuns.reduce((latest, current) => {
      const latestDate = latest.startDate ? new Date(latest.startDate) : new Date(0);
      const currentDate = current.startDate ? new Date(current.startDate) : new Date(0);
      return currentDate > latestDate ? current : latest;
    });
  }, [runs]);

  const renderSubRuns = (subRuns) => {
    const displayCount = 2;
    const displayedRuns = subRuns.slice(0, displayCount);
    const remainingCount = subRuns.length - displayCount;

    return (
      <div>
        {displayedRuns.map((subRun, index) => (
          <span key={subRun.id} className="text-sm text-gray-600">
            {subRun.name}{index < displayedRuns.length - 1 ? ', ' : ''}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-sm text-gray-600"> +{remainingCount} more</span>
        )}
      </div>
    );
  };

  const filteredPlatforms = platforms
  .filter(platform => platform.steps)
  .filter(platform =>
    platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredPlatforms.length / itemsPerPage);
  const paginatedPlatforms = filteredPlatforms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleExportClick = async (platform) => {
    const newRun = {
      id: `${platform.id}-${Date.now()}`,
      platformId: platform.id,
      subRunId: 'export',
      startDate: new Date().toISOString(),
      status: 'running',
      tasks: [],
      url: platform.home_url,
      exportSize: null,
    };

    dispatch(startRun(newRun));
    // dispatch(toggleRunVisibility());
    dispatch(setExportRunning(newRun.id, true));

    // Trigger the export process
    window.electron.ipcRenderer.send('export-website', platform.company, platform.name, newRun.id);
  };

  const formatLastRunTime = (run) => {
    const dateString = run.exportDate || run.startDate;
    if (!dateString) return 'Never';
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  const getPlatformLogo = (platform) => {
    const Logo = theme === 'dark' ? platform.logo.dark : platform.logo.light;
    return Logo ? (
      <div style={{ width: `${LOGO_SIZE}px`, height: `${LOGO_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo style={{ width: '100%', height: '100%' }} />
      </div>
    ) : null;
  };

  const isExportRunning = useCallback((platformId) => {
    return runs.some(run => run.platformId === platformId && run.status === 'running');
  }, [runs]);

  const onViewRunDetails = (run, platform) => {
    setSelectedRun({ run, platform });
  };

  const handleCloseDetails = () => {
    setSelectedRun(null);
  };

  const formatExportSize = (sizeInBits) => {
    if (!sizeInBits) return 'Unknown size';

    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = sizeInBits / (8 * 1024); // Convert bits to KB
    let unitIndex = 0;

    while (size >= 1000 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    // Format to a maximum of 4 digits
    let formattedSize;
    if (size >= 100) {
      formattedSize = Math.round(size).toString();
    } else if (size >= 10) {
      formattedSize = size.toFixed(1);
    } else {
      formattedSize = size.toFixed(2);
    }

    return `${formattedSize} ${units[unitIndex]}`;
  };

  const renderResults = (platform) => {
    const latestRun = getLatestRun(platform.id);
    const exportRunning = isExportRunning(platform.id);
    const isHovered = hoveredPlatformId === platform.id;

    if (!latestRun || latestRun.status === 'idle') {
      return (
        <div className="flex justify-between items-center w-full h-[36px]">
          <div></div>
          {isHovered ? (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center"
              onClick={() => handleExportClick(platform)}
            >
              <HardDriveDownload size={16} className="mr-2" />
              Export
            </Button>
          ) : <div className="w-[100px]"></div>}
        </div>
      );
    }

    switch (latestRun.status) {
      case 'running':
        return (
          <div className="flex items-center space-x-2 group h-[36px]">
            <MoonLoader size={16} color="#000" speedMultiplier={1.4} />
            <span className="group-hover:underline cursor-pointer" onClick={() => onViewRunDetails(latestRun, platform)}>Running...</span>
            <span
              className="cursor-pointer flex items-center hover:underline"
              onClick={() => onViewRunDetails(latestRun, platform)}
            >
              <ArrowUpRight size={22} className="ml-1" color="#5a5a5a" />
            </span>
          </div>
        );
      case 'success':
        return (
          <div className='flex justify-between items-center w-full h-[36px]'>
            <div className="flex items-center space-x-2">
              {completedRuns[latestRun.id] && (
                    <ConfettiExplosion
                      particleCount={50}
                      width={200}
                      duration={2200}
                      force={0.4}
                    />
                )}
              <div
                onClick={() => window.electron.ipcRenderer.send('open-folder', latestRun.exportPath)}
                style={{ cursor: 'pointer' }}
              >
                <Folder size={17} color="#5a5a5a" />
              </div>

              <span
                className="cursor-pointer hover:underline"
                onClick={() => window.electron.ipcRenderer.send('open-folder', latestRun.exportPath)}
              >
                {formatExportSize(latestRun.exportSize)}
              </span>
              <span className="text-gray-500">-</span>
              <span
                className="cursor-pointer flex items-center hover:underline"
                onClick={() => onViewRunDetails(latestRun, platform)}
              >
                {formatLastRunTime(latestRun)}

                <ArrowUpRight size={22} className="ml-1" color="#5a5a5a" />
              </span>
            </div>
            {isHovered ? (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center ml-4"
                onClick={() => handleExportClick(platform)}
              >
                <HardDriveDownload size={16} className="mr-2" />
                Re-Export
              </Button>
            ) : <div className="w-[100px]"></div>}
          </div>
        );
      case 'error':
      case 'stopped':
        return (
          <div className="flex items-center justify-between w-full h-[36px]">
            <div className="flex items-center space-x-2">
              <X className="text-red-500" size={16} />
              <span className="hover:underline cursor-pointer" onClick={() => onViewRunDetails(latestRun, platform)}>
                Export {latestRun.status === 'error' ? 'failed' : 'stopped'}
              </span>
            </div>
            {isHovered ? (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center"
                onClick={() => handleExportClick(platform)}
              >
                <HardDriveDownload size={16} className="mr-2" />
                Retry Export
              </Button>
            ) : <div className="w-[100px]"></div>}
          </div>
        );
      default:
        return <div className="h-[36px]"><span>Unknown status</span></div>;
    }
  };

  useEffect(() => {
    runs.forEach(run => {
      const prevRun = prevRunsRef.current[run.id];
      if (prevRun && prevRun.status === 'running' && run.status === 'success' && !completedRuns[run.id]) {
        setCompletedRuns(prev => ({ ...prev, [run.id]: true }));
        setTimeout(() => {
          setCompletedRuns(prev => {
            const newState = { ...prev };
            delete newState[run.id];
            return newState;
          });
        }, 2200); // Duration of the confetti explosion
      }
    });

    // Update prevRunsRef for the next render
    prevRunsRef.current = runs.reduce((acc, run) => {
      acc[run.id] = run;
      return acc;
    }, {});
  }, [runs]);

  return (
    <div className="w-full h-full flex-col px-[50px] pt-6 pb-6 select-none">
      <div className="flex-shrink-0 mb-4">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search company or platform..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-10 w-full"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      {paginatedPlatforms.length > 0 ? (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="overflow-auto flex-grow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlatforms.map((platform) => (
                  <TableRow
                    key={platform.id}
                    onMouseEnter={() => setHoveredPlatformId(platform.id)}
                    onMouseLeave={() => setHoveredPlatformId(null)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {/* Wrap the logo and text in a clickable div */}
                        <div
                          className="flex items-center space-x-2 cursor-pointer hover:underline"
                          onClick={() => onPlatformClick(platform)}
                        >
                          {getPlatformLogo(platform)}
                          <div className="flex flex-col">
                            <p>
                              <span className="text-gray-500">{platform.company}/</span>
                              <span className="font-semibold">{platform.name}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{platform.description}</p>
                    </TableCell>
                    <TableCell>
                      {renderResults(platform)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredPlatforms.length > itemsPerPage && (
            <div className="flex-shrink-0 flex justify-between items-center mt-4">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPlatforms.length)} of {filteredPlatforms.length} platforms
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pageCount}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center py-8 bg-gray-100 rounded-md">
            <p className="text-gray-500 text-lg">No platforms found matching "{searchTerm}"</p>
            <button
              onClick={clearSearch}
              className="mt-2 text-blue-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        </div>
      )}
      {selectedRun && (
        <RunDetailsPage
          runId={selectedRun.run.id}
          onClose={handleCloseDetails}
          platform={selectedRun.platform}
          subRun={{ id: 'export', name: 'Export' }}
        />
      )}
    </div>
  );
};

export default DataExtractionTable;
