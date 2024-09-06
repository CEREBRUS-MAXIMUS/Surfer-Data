import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronRight, Clock, ArrowLeft, XCircle, Eye, Trash2, ChevronLeft, Folder } from 'lucide-react';
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { openDB } from 'idb';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { updateRunStatus, deleteRun } from '../../state/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import MonacoEditor from '@monaco-editor/react';
import { stopRun, closeRun } from '../../state/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

const StatusIndicator = ({ status }) => {
  switch (status) {
    case 'pending':
      return <div className="w-3 h-3 rounded-full bg-gray-400" />;
    case 'running':
      return (
        <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
      );
    case 'success':
      return <div className="w-3 h-3 rounded-full bg-green-400" />;
    case 'error':
      return <div className="w-3 h-3 rounded-full bg-red-400" />;
    default:
      return null;
  }
};

const RunDetailsPage = ({ runId, onClose, platform, subRun }) => {
  const dispatch = useDispatch();
  const reduxRuns = useSelector(state => state.app.runs);
  const activeRunIndex = useSelector((state) => state.app.activeRunIndex);
  const [run, setRun] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [, forceUpdate] = useState();
  const [artifacts, setArtifacts] = useState([]);
  const [currentArtifactIndex, setCurrentArtifactIndex] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadRun = async () => {
      // Check if the run exists in Redux state
      const reduxRun = reduxRuns.find(r => r.id === runId);

      if (reduxRun) {
        setRun(reduxRun);
        if (reduxRun.tasks.length > 0) {
          setSelectedTaskId(reduxRun.tasks[0].id);
        }
      } else {
        // If not in Redux, load from IndexedDB
        const db = await openDB('dataExtractionDB', 1);
        const loadedRun = await db.get('runs', runId);

        if (loadedRun) {
          // Ensure the first task and its first step are running
          if (loadedRun.tasks.length > 0) {
            loadedRun.tasks[0].status = 'running';
            loadedRun.tasks[0].startTime = loadedRun.tasks[0].startTime || new Date().toISOString();
            if (loadedRun.tasks[0].steps.length > 0) {
              loadedRun.tasks[0].steps[0].status = 'running';
              loadedRun.tasks[0].steps[0].startTime = loadedRun.tasks[0].steps[0].startTime || new Date().toISOString();
            }
          }

          setRun(loadedRun);
          if (loadedRun.tasks.length > 0) {
            setSelectedTaskId(loadedRun.tasks[0].id);
          }
        }
      }
    };
    loadRun();

    // Set up an interval to force update every second
    const interval = setInterval(() => forceUpdate({}), 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [runId, reduxRuns]);

  useEffect(() => {
    if (run?.status === 'success' && run?.exportPath) {
      window.electron.ipcRenderer.send('get-artifact-files', run.exportPath);
    }
  }, [run]);

  useEffect(() => {
    const handleArtifactFiles = (files) => {
      console.log('Artifact files:', files);
      setArtifacts(files || []);
      console.log('Artifacts:', artifacts);
    };

    window.electron.ipcRenderer.on('artifact-files', handleArtifactFiles);

    return () => {
      window.electron.ipcRenderer.removeListener('artifact-files', handleArtifactFiles);
    };
  }, []);

  const getElapsedTime = (startTime, endTime) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end - start;
    const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleStopRun = async () => {
    const activeRun = run;
    if (activeRun && (activeRun.status === 'pending' || activeRun.status === 'running')) {
      dispatch(stopRun(activeRun.id));
      console.log("Stopping run:", activeRun.id);

      // Update the run in IndexedDB
      const db = await openDB('dataExtractionDB', 1);
      const updatedRun = { ...activeRun, status: 'stopped', endDate: new Date().toISOString() };
      await db.put('runs', updatedRun);

      // Remove the run from Redux state
      dispatch(closeRun(activeRun.id));

      // Adjust active run index if necessary
      if (activeRunIndex >= reduxRuns.length - 1) {
        dispatch(setActiveRunIndex(Math.max(0, reduxRuns.length - 2)));
      }
    }
  };

  const toggleStep = (taskId, stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [`${taskId}-${stepId}`]: !prev[`${taskId}-${stepId}`]
    }));
  };

  const handleDeleteRun = async () => {
    dispatch(deleteRun(runId));
    const db = await openDB('dataExtractionDB', 1);
    await db.delete('runs', runId);
    setIsDeleteDialogOpen(false);
    onClose(); // Close the main dialog after deletion
  };

  const handleViewRun = () => {
    // Implement the logic to view the run details
    console.log('View run:', runId);
  };

  const handlePrevArtifact = () => {
    setCurrentArtifactIndex((prev) => (prev > 0 ? prev - 1 : artifacts.length - 1));
  };

  const handleNextArtifact = () => {
    setCurrentArtifactIndex((prev) => (prev < artifacts.length - 1 ? prev + 1 : 0));
  };

  const handleViewArtifacts = () => {
    if (run?.exportPath) {
      window.electron.ipcRenderer.send('open-folder', run.exportPath);
    }
  };

  if (!run) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[70vw] h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>{run?.subRunId} Extraction</DialogTitle>
        </DialogHeader>

        {run.status === 'success' && artifacts.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Button onClick={handlePrevArtifact} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{`${currentArtifactIndex + 1} / ${artifacts.length}`}</span>
              <Button onClick={handleNextArtifact} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {artifacts[currentArtifactIndex] && (
              <div className="rounded-lg overflow-hidden">
                <MonacoEditor
                  height="200px"
                  language="json"
                  theme="vs-dark"
                  value={artifacts[currentArtifactIndex].content}
                  options={{ readOnly: true, minimap: { enabled: false } }}
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Run
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this run?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the run and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRun}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {(run?.status === 'pending' || run?.status === 'running') && (
                <Button variant="destructive" size="sm" onClick={handleStopRun}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Run
                </Button>
              )}
              {run?.status === 'success' && run?.exportPath && (
                <Button variant="outline" size="sm" onClick={handleViewArtifacts}>
                  <Folder className="mr-2 h-4 w-4" />
                  View Artifacts
                </Button>
              )}
            </div>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{run.subRunId} Extraction</CardTitle>
              <div className="flex items-center space-x-2">
                <StatusIndicator status={run.status} />
                <span>{run.status}</span>
                <Clock size={16} />
                <span>{getElapsedTime(run.startDate, run.endDate)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px]">
                <div className="w-1/3 border-r overflow-y-auto">
                  {run.tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-2 border-b cursor-pointer ${selectedTaskId === task.id ? 'bg-gray-100' : ''}`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <StatusIndicator status={task.status} />
                        <span className="font-semibold text-sm">{task.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-2/3 overflow-y-auto">
                  <ScrollArea className="h-full">
                    {run.tasks.find(task => task.id === selectedTaskId)?.steps.map(step => (
                      <div key={step.id} className="p-2 border-b">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStep(selectedTaskId, step.id)}
                            >
                              {expandedSteps[`${selectedTaskId}-${step.id}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </Button>
                            <StatusIndicator status={step.status} />
                            <span className="font-semibold text-sm">{step.name}</span>
                          </div>
                          <span className="text-xs">{getElapsedTime(step.startTime, step.endTime)}</span>
                        </div>
                        {expandedSteps[`${selectedTaskId}-${step.id}`] && (
                          <div className="bg-gray-100 p-2 rounded mt-1">
                            <pre className="text-xs">
                              {step.logs || 'No logs available'}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RunDetailsPage;
