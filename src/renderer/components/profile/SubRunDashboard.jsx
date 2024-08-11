import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addRun, stopRun } from '../../state/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';
import { openDB } from 'idb';
import RunDetailsPage from './RunDetailsPage';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { platforms } from '../../config/platforms';

const SubRunDashboard = ({ platform, subRun, onBack }) => {
  const dispatch = useDispatch();
  const [runs, setRuns] = useState([]);
  const [expandedRuns, setExpandedRuns] = useState({});
  const [selectedRunId, setSelectedRunId] = useState(null);

  useEffect(() => {
    const loadRuns = async () => {
      const db = await openDB('dataExtractionDB', 1, {
        upgrade(db) {
          db.createObjectStore('runs', { keyPath: 'id' });
        },
      });
      const loadedRuns = await db.getAll('runs');
      setRuns(loadedRuns.filter(run => run.platformId === platform.id && run.subRunId === subRun.id));
    };
    loadRuns();
  }, [platform.id, subRun.id]);

  const toggleRunExpansion = (runId) => {
    setExpandedRuns(prev => ({ ...prev, [runId]: !prev[runId] }));
  };

  const handleViewDetails = (run) => {
    setSelectedRunId(run.id);
  };

  const handleCloseDetails = () => {
    setSelectedRunId(null);
  };

  const handleStartNewRun = () => {
    const currentPlatform = platforms.find(p => p.id === platform.id);
    const currentSubRun = currentPlatform?.subRuns.find(sr => sr.id === subRun.id);

    if (!currentSubRun) {
      console.error('SubRun not found in config');
      return;
    }

    const startTime = new Date().toISOString();
    const newRun = {
      id: Date.now().toString(),
      platformId: platform.id,
      subRunId: subRun.id,
      startDate: startTime,
      status: 'pending',
      tasks: currentSubRun.tasks.map(task => ({
        ...task,
        startTime,
        steps: task.steps.map(step => ({ ...step, status: 'pending', startTime })),
        status: 'pending'
      })),
    };

    // Dispatch the action to add the new run to Redux
    dispatch(addRun(newRun));

    // Add the run to IndexedDB
    const addRunToDB = async () => {
      const db = await openDB('dataExtractionDB', 1);
      await db.add('runs', newRun);
    };
    addRunToDB();

    // Update the local state
    setRuns(prevRuns => [...prevRuns, newRun]);

    console.log('Starting new run for', subRun.name);
  };

  const handleStopRun = (runId) => {
    // Dispatch action to stop the run
    dispatch(stopRun(runId));

    // Update the run status in IndexedDB
    const updateRunInDB = async () => {
      const db = await openDB('dataExtractionDB', 1);
      const run = await db.get('runs', runId);
      if (run) {
        run.status = 'stopped';
        run.endDate = new Date().toISOString();
        await db.put('runs', run);
      }
    };
    updateRunInDB();

    // Update the local state
    setRuns(prevRuns => prevRuns.map(run =>
      run.id === runId ? { ...run, status: 'stopped', endDate: new Date().toISOString() } : run
    ));

    console.log('Stopping run:', runId);
  };

  const renderBreadcrumb = () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink onClick={onBack}>{platform.name}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{subRun.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <div className="space-y-8 px-[50px] pt-6">
      {renderBreadcrumb()}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2" size={16} />
        Back to Platform Dashboard
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{subRun.name}</CardTitle>
            <CardDescription>{subRun.description}</CardDescription>
          </div>
          <Button onClick={handleStartNewRun}>Start New Run</Button>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Extraction Method:</h3>
          <p>{subRun.extractionMethod}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
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
                    <TableCell>{run.status}</TableCell>
                    <TableCell>{run.startDate}</TableCell>
                    <TableCell>{run.endDate || '-'}</TableCell>
                    <TableCell>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(run)}>
                          View Details
                        </Button>
                        {(run.status === 'pending' || run.status === 'running') && (
                          <Button size="sm" variant="destructive" onClick={() => handleStopRun(run.id)}>
                            Stop Run
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRuns[run.id] && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="pl-8">
                          {run.tasks && run.tasks.map((task) => (
                            <div key={task.id} className="mb-4">
                              <h4 className="font-medium">{task.name}</h4>
                              <div className="flex items-center space-x-2">
                                <div className={`px-2 py-1 rounded ${task.status === 'pending' ? 'bg-gray-200' : task.status === 'running' ? 'bg-blue-200 animate-pulse' : task.status === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>
                                  {task.status}
                                </div>
                                <ul className="list-disc list-inside">
                                  {task.steps && task.steps.map((step) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRunId && (
        <RunDetailsPage
          runId={selectedRunId}
          onClose={handleCloseDetails}
          platform={platform}
          subRun={subRun}
        />
      )}
    </div>
  );
};

export default SubRunDashboard;
