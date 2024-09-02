import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Download, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { openDB } from 'idb';
import RunDetailsPage from '../components/profile/RunDetailsPage';
import SubRun from './SubRun';
import { useTheme } from '../components/ui/theme-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { useDispatch } from 'react-redux';
import { deleteRunsForPlatform } from '../state/actions';
import { deleteRunsForPlatformFromDB } from '../lib/databases';
import { setCurrentRoute, updateBreadcrumb } from '../state/actions';
import RunResultEntry from '../components/profile/RunResultEntry';
import { formatLastRunTime } from '../lib/formatting';

const Platform = ({ platform }) => {
  const [runs, setRuns] = useState([]);
  const [expandedRuns, setExpandedRuns] = useState({});
  const [selectedRunId, setSelectedRunId] = useState(null);
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const LOGO_SIZE = 64; // Larger size for the platform logo in the header

  useEffect(() => {
    const loadRuns = async () => {
      const db = await openDB('dataExtractionDB', 1, {
        upgrade(db) {
          db.createObjectStore('runs', { keyPath: 'id' });
        },
      });
      const loadedRuns = await db.getAll('runs');
      setRuns(loadedRuns.filter(run => run.platformId === platform.id));
    };
    loadRuns();
  }, [platform.id]);

  const toggleRunExpansion = (runId) => {
    setExpandedRuns(prev => ({ ...prev, [runId]: !prev[runId] }));
  };

  const handleViewDetails = (run) => {
    setSelectedRunId(run.id);
  };

  const handleCloseDetails = () => {
    setSelectedRunId(null);
  };

  const handleSubRunClick = (subRun) => {
    dispatch(setCurrentRoute(`/subrun/${platform.id}/${subRun.id}`));
    dispatch(updateBreadcrumb([
      { icon: 'Home', text: 'Home', link: '/home' },
      { text: platform.name, link: `/platform/${platform.id}` },
      { text: subRun.name, link: `/subrun/${platform.id}/${subRun.id}` }
    ]));
  };

  const handleDeleteAllData = async () => {
    try {
      await deleteRunsForPlatformFromDB(platform.id);
      dispatch(deleteRunsForPlatform(platform.id));
      setRuns([]);
    } catch (error) {
      console.error('Error deleting platform data:', error);
    }
  };

  const getPlatformLogo = () => {
    const Logo = theme === 'dark' ? platform.logo.dark : platform.logo.light;
    return Logo ? (
      <div style={{ width: `${LOGO_SIZE}px`, height: `${LOGO_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo style={{ width: '100%', height: '100%' }} />
      </div>
    ) : null;
  };

  const handleOpenExportFolder = () => {
    console.log('open-platform-export-folder', platform.company, platform.name);
    window.electron.ipcRenderer.send('open-platform-export-folder', platform.company, platform.name);
  };

  return (
    <div className="space-y-8 px-[50px] pt-6">
          {/* {getPlatformLogo()}
          <div>
            <CardTitle className="text-2xl">{platform.name}</CardTitle>
          </div>
      <Card>
        <CardHeader>
          <CardTitle>Data Extraction Options</CardTitle>
          <CardDescription>Select the type of data you want to extract from {platform.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {platform.subRuns.map((subRun) => (
              <Button key={subRun.id} variant="outline" className="flex items-center" onClick={() => handleSubRunClick(subRun)}>
                {subRun.icon && <subRun.icon size={16} />}
                <span className="ml-2">{subRun.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card> */}

          <div className="flex justify-between items-center">
            <CardTitle>{platform.name} History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExportFolder}
              className="flex items-center"
            >
              <Folder size={16} className="mr-2" />
              Open Export Folder
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                return (
                  <React.Fragment key={run.id}>
                    <TableRow>
                      <TableCell>
                        {formatLastRunTime(run.startDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                      <RunResultEntry
                      run={run}
                      platform={platform}
                      onViewDetails={handleViewDetails}
                      onExport={() => {}}
                      isHovered={false}
                    />
                      </TableCell>
                    </TableRow>

                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete All Platform Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all data associated with {platform.name}, including all runs and extracted information.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllData}>
                  Yes, delete all data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {selectedRunId && (
        <RunDetailsPage
          runId={selectedRunId}
          onClose={handleCloseDetails}
          platform={platform}
        />
      )}
    </div>
  );
};

export default Platform;
