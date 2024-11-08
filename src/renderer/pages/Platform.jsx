import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Folder } from 'lucide-react';
import { openDB } from 'idb';
import RunDetails from '../components/RunDetails';
import { useTheme } from '../components/ui/theme-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { useDispatch } from 'react-redux';
import { deleteRunsForPlatform } from '../state/actions';
import { setCurrentRoute, updateBreadcrumb } from '../state/actions';
import { formatLastRunTime } from '../helpers';

const Platform = ({ platform }) => {
  const [runs, setRuns] = useState([]);
  
  const [expandedRuns, setExpandedRuns] = useState({});
  const [selectedRunId, setSelectedRunId] = useState(null);
  const dispatch = useDispatch();

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

  const handleDeleteAllData = async () => {
    try {
      await deleteRunsForPlatformFromDB(platform.id);
      dispatch(deleteRunsForPlatform(platform.id));
      setRuns([]);
    } catch (error) {
      console.error('Error deleting platform data:', error);
    }
  };

  return (
    <div className="space-y-8 px-[50px] pt-6">
          <div className="flex justify-between items-center">
            <CardTitle>{platform.name} History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.electron.ipcRenderer.send('open-platform-export-folder', platform.company, platform.name)}
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
                        {formatLastRunTime(run.exportDate || run.startDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {run.status}
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
        <RunDetails
          runId={selectedRunId}
          onClose={handleCloseDetails}
          platform={platform}
        />
      )}
    </div>
  );
};

export default Platform;
