import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startRun, toggleRunVisibility, setExportRunning, updateExportStatus, addRun } from '../../state/actions';
import { useTheme } from '../ui/theme-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { ArrowUpRight, ArrowRight, Check, X, Link, Download, Search, ChevronLeft, ChevronRight, HardDriveDownload, Folder, Eye } from 'lucide-react';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Card } from "../ui/card";

const DataExtractionTable = ({ onPlatformClick, webviewRef }) => {
  const dispatch = useDispatch();
  const runs = useSelector(state => state.app.runs);
    const activeRuns = runs.filter(
      (run) => run.status === 'pending' || run.status === 'running',
    );
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
  const [platformLogos, setPlatformLogos] = useState({});
  const [connectedPlatforms, setConnectedPlatforms] = useState({});
  const [filteredPlatforms, setFilteredPlatforms] = useState([]);
  const [allPlatforms, setAllPlatforms] = useState([]);


  const LOGO_SIZE = 24; // Set a consistent size for all logos

  const loadRuns = useCallback(async () => {
    const db = await openDB('dataExtractionDB', 1, {
      upgrade(db) {
        db.createObjectStore('runs', { keyPath: 'id' });
      },
    });
    dbRef.current = db;
    const loadedRuns = await db.getAll('runs');
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

  useEffect(() => {
    const loadScrapers = async () => {
      try {
        const scrapers = await window.electron.ipcRenderer.invoke('get-scrapers');
        console.log('SCRAPERS: ', scrapers);

        setAllPlatforms(scrapers);
      } catch (error) {
        console.error('Error loading scrapers:', error);
        setAllPlatforms([]);
      }
    };

    loadScrapers();
  }, []);

  useEffect(() => {
    setFilteredPlatforms(allPlatforms.filter(scraper =>
      scraper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scraper.company.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [searchTerm, allPlatforms]);


  useEffect(() => {
    const checkConnectedPlatforms = async () => {
      const connected = await window.electron.ipcRenderer.invoke('check-connected-platforms', allPlatforms);
      console.log('CONNECTED PLATFORMS: ', connected);
      setConnectedPlatforms(connected);
    };

    checkConnectedPlatforms();
  }, [allPlatforms]);

  useEffect(() => {
    const handleElementFound = (id) => {
      const platform = allPlatforms.find(p => p.id === id);
      console.log('PLATFORM: ', platform);
      if (platform) {
        handleExportClick(platform);
        setConnectedPlatforms(prev => ({ ...prev, [platform.id]: true }));
      }
    };

    window.electron.ipcRenderer.on('element-found', handleElementFound);

    return () => {
      window.electron.ipcRenderer.removeListener('element-found', handleElementFound);
    };
  }, [allPlatforms]);

  // useEffect(() => {
  //   const runisUpdateds = async () => {
  //     if (runs.length === 0) return;

  //     for (const platform of filteredPlatforms) {
  //       if (platform.isUpdated) {
  //         const platformRuns = runs.filter(run => run.platformId === platform.id);
  //         if (platformRuns.length > 0) {
  //           const today = new Date().toISOString().split('T')[0];
  //           const runsForToday = platformRuns.filter(run => 
  //             (run.status === 'success' || run.status === 'running') && 
  //             run.startDate.split('T')[0] === today
  //           );
  //           console.log('runsForToday: ', runsForToday);
  //           if (runsForToday.length === 0) {
  //             await handleExportClick(platform);
  //             await new Promise(resolve => setTimeout(resolve, 5000));
  //           }
  //         }
  //       }
  //     }
  //   };

  //   runisUpdateds();
  // }, [filteredPlatforms]);

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
    console.log('platform: ', platform);


    const newRun = {
      id: `${platform.id}-${Date.now()}`,
      filename: platform.filename,
      isConnected: true,
      company: platform.company,
      name: platform.name,
      platformId: platform.id,
      tasks: [],
      startDate: new Date().toISOString(),
      status: 'running',
      isUpdated: platform.isUpdated,
      exportSize: null, 
      url: 'about:blank'
    }; 


    dispatch(startRun(newRun));
    // dispatch(toggleRunVisibility());
    dispatch(setExportRunning(newRun.id, true));
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

  const getPlatformLogo = async (platform) => {
    try {
      const response = await fetch(`https://logo.clearbit.com/${platform.name}.com`);
      if (response.ok) {
        const blob = await response.blob();
        const logoUrl = URL.createObjectURL(blob);
        setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
      } else {
        const companyResponse = await fetch(`https://logo.clearbit.com/${platform.company}.com`);
        if (companyResponse.ok) {
          const blob = await companyResponse.blob();
          const logoUrl = URL.createObjectURL(blob);
          setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
        } else if (platform.logoURL) {
          const logoUrlResponse = await fetch(platform.logoURL);
          const logoBlob = await logoUrlResponse.blob();  
          const logoUrl = URL.createObjectURL(logoBlob);
          setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
        }
      }
    } catch (error) {
      console.error(`Error fetching logo for ${platform.name}:`, error);
      if (platform.logoURL) {
          const logoUrlResponse = await fetch(platform.logoURL);
          const logoBlob = await logoUrlResponse.blob();  
          const logoUrl = URL.createObjectURL(logoBlob);
          setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
      }
    }
  };

  useEffect(() => {
    filteredPlatforms.forEach(platform => {
      if (!platformLogos[platform.id]) {
        getPlatformLogo(platform);
      }
    });
  }, [filteredPlatforms]);
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

  return (
    <div className="relative w-full flex items-center">
      <div className="flex-grow flex items-center">
        <div className="flex-shrink-0 mr-4 w-1/2">
          {!latestRun || latestRun.status === 'idle' ? (
            <div className="flex justify-between items-center w-full h-full">
              <div></div>
            </div>
          ) : (
            renderRunStatus(latestRun, platform)
          )}
        </div>
        {latestRun && latestRun.status === 'running' && (
          <div className="flex-grow overflow-hidden">
            {showLogs(platform)}
          </div>
        )}
      </div>
    </div>
  );
};

  const renderRunStatus = (latestRun, platform) => {
    switch (latestRun.status) {
      case 'running':
      return (
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <div className="flex items-center space-x-2 group">
              <MoonLoader size={16} color="#000" speedMultiplier={1.4} />
              <span className="group-hover:underline cursor-pointer" onClick={() => onViewRunDetails(latestRun, platform)}>
                {latestRun.currentStep ? latestRun.currentStep : 'Running...'}
              </span>
              <span
                className="cursor-pointer flex items-center hover:underline"
                onClick={() => onViewRunDetails(latestRun, platform)}
              >
                <ArrowUpRight size={22} className="ml-1" color="#5a5a5a" />
              </span>
            </div>
          </div>
          {/* <div className="flex-grow ml-4">
            {showLogs(platform)}
          </div> */}
        </div>
      );
      case 'success':
        return (
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
        );
      case 'error':
      case 'stopped':
        return (
          <div className="flex items-center space-x-2">
            <X className="text-red-500" size={16} />
            <span className="hover:underline cursor-pointer" onClick={() => onViewRunDetails(latestRun, platform)}>
              Export {latestRun.status === 'error' ? 'failed' : 'stopped'}
            </span>
          </div>
        );
      default:
        return <span>Unknown status</span>;
    }
  };

const showLogs = (platform) => {
  const latestRun = activeRuns.find(run => run.platformId === platform.id);
  if (!latestRun || !latestRun.logs) return null;

  const logLines = latestRun.logs.split('\n');

  return (
    <div id="log-container" className="max-h-[100px] overflow-y-auto bg-black text-green-400 p-2 rounded" style={{ maxWidth: '300px' }}>
      <pre className="font-mono text-xs whitespace-pre-wrap break-words">
        {logLines.map((line, index) => (
          <span key={index} className={line === 'YOU NEED TO SIGN IN (click the eye in the top right)!' ? 'text-red-500' : ''}>
            {line}
            {index < logLines.length - 1 && '\n'}
          </span>
        ))}
      </pre>
    </div>
  );
}

  useEffect(() => {
    const logContainers = document.querySelectorAll('#log-container');
    if (logContainers) {
      logContainers.forEach(container => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [runs]);

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
          <div className="flex items-center mb-2 space-x-4">
            <div className="flex justify-between items-center w-full">
              <div className="relative flex-grow mr-4">
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
              
              {/* <Card className="p-4 flex items-center flex-shrink-0" style={{ maxWidth: '300px' }}>
                <Info size={16} className="mr-2 flex-shrink-0" />
                <div>
                  <AlertTitle className="mb-2">Can't find a platform?</AlertTitle>
                  <AlertDescription>
                    <Button
                      variant="link"
                      className="p-0 h-auto underline"
                      onClick={() => window.electron.ipcRenderer.send('open-external', 'https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/blob/main/docs/ADD_PLATFORMS.md')}
                    >
                      Build a scraper for it!
                    </Button>
                  </AlertDescription>
                </div>
              </Card> */}
            </div>
          </div>
        </div>
      </div>
      {paginatedPlatforms.length > 0 ? (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="overflow-x-auto overflow-y-hidden">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Actions</TableHead>
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
                          <div
                            className="flex items-center space-x-2 cursor-pointer hover:underline"
                            onClick={() => onPlatformClick(platform)}
                          >
                 {platformLogos[platform.id] && (
                  <img src={platformLogos[platform.id]} alt={platform.name} className="w-4 h-4" style={{ width: `${LOGO_SIZE}px`, height: `${LOGO_SIZE}px` }}/>
                )}
                            <div className="flex items-center">
                              <p className="flex items-center">
                                <span className="text-gray-500">{platform.company}/</span>
                                <span className="font-semibold">{platform.name}</span>
                              </p>
                              <ArrowUpRight size={22} className="ml-1" color="#5a5a5a" />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{platform.description || 'No description available'}</p>
                      </TableCell>
                      <TableCell className="w-[600px]">
                        {renderResults(platform)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!connectedPlatforms[platform.id] && platform.needsConnection ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.electron.ipcRenderer.send('connect-platform', platform)}
                            >
                              <Link size={16} className="mr-2" />
                              Connect
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                            variant="outline"
                            onClick={() => handleExportClick(platform)}
                          >
                            <HardDriveDownload size={16} className="mr-2" />
                            {getLatestRun(platform.id) ? (getLatestRun(platform.id).status === 'success' || getLatestRun(platform.id).status === 'running' ? 'Re-Export' : 'Export') : 'Export'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
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
            <p className="text-gray-500 text-lg">Didn't find anything? <a className="underline cursor-pointer" onClick={() => window.electron.ipcRenderer.send('open-external', 'https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/blob/main/docs/ADD_PLATFORMS.md')}>Build a scraper for "{searchTerm}"</a></p>
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
