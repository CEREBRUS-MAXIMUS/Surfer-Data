import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Download, ChevronRight, ChevronDown } from 'lucide-react';
import { openDB } from 'idb';
import RunDetailsPage from './RunDetailsPage';
import SubRunDashboard from './SubRunDashboard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { useTheme } from '../ui/theme-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useDispatch } from 'react-redux';
import { deleteRunsForPlatform } from '../../state/actions';
import { deleteRunsForPlatformFromDB } from '../../lib/databases';

const PlatformDashboard = ({ platform, onSubRunClick }) => {
  const [runs, setRuns] = useState([]);
  const [expandedRuns, setExpandedRuns] = useState({});
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedSubRun, setSelectedSubRun] = useState(null);
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
    setSelectedSubRun(subRun);
  };

  const handleBackFromSubRun = () => {
    setSelectedSubRun(null);
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

  const renderBreadcrumb = () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{platform.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  const getPlatformLogo = () => {
    const Logo = theme === 'dark' ? platform.logo.dark : platform.logo.light;
    return Logo ? (
      <div style={{ width: `${LOGO_SIZE}px`, height: `${LOGO_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo style={{ width: '100%', height: '100%' }} />
      </div>
    ) : null;
  };

  if (selectedSubRun) {
    return <SubRunDashboard platform={platform} subRun={selectedSubRun} onBack={handleBackFromSubRun} />;
  }

  return (
    <div className="space-y-8">
      {renderBreadcrumb()}

      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          {getPlatformLogo()}
          <div>
            <CardTitle className="text-2xl">{platform.name}</CardTitle>
          </div>
        </CardHeader>
      </Card>

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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extraction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const subRun = platform.subRuns.find(sr => sr.id === run.subRunId);
                return (
                  <React.Fragment key={run.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRunExpansion(run.id)}
                        >
                          {expandedRuns[run.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {subRun?.icon && <subRun.icon size={16} />}
                          <span className="ml-2">{subRun?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{run.status}</TableCell>
                      <TableCell>{run.startDate}</TableCell>
                      <TableCell>{run.endDate || '-'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(run)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRuns[run.id] && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="pl-8">
                            {run.tasks.map((task) => (
                              <div key={task.id} className="mb-4">
                                <h4 className="font-medium">{task.name}</h4>
                                <div className="flex items-center space-x-2">
                                  <div className={`px-2 py-1 rounded ${task.status === 'pending' ? 'bg-gray-200' : task.status === 'running' ? 'bg-blue-200 animate-pulse' : task.status === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>
                                    {task.status}
                                  </div>
                                  <ul className="list-disc list-inside">
                                    {task.steps.map((step) => (
                                      <li key={step.id} className={step.status === 'error' ? 'text-red-500' : ''}>
                                        {step.name} - {step.status}
                                        {step.errorMessage && <span className="text-red-500 ml-2">{step.errorMessage}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

export default PlatformDashboard;
