import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronRight, Clock, ArrowLeft, XCircle, Eye, Trash2, ChevronLeft, Folder } from 'lucide-react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { updateRunStatus, deleteRun } from '../state/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import MonacoEditor from '@monaco-editor/react';
import { stopRun  } from '../state/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

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

const RunDetails = ({ runId, onClose, platform }) => {
  const dispatch = useDispatch();
  const reduxRuns = useSelector(state => state.app.runs);
  const activeRunIndex = useSelector((state) => state.app.activeRunIndex);
  const run = reduxRuns.find(r => r.id === runId);
  const [selectedTaskId, setSelectedTaskId] = useState(() => run?.tasks[0]?.id || null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (run?.status === 'success' && run?.exportPath) {
      window.electron.ipcRenderer.send('get-run-files', run.exportPath);
    }
  }, [run]);

  useEffect(() => {
    const handleFiles = (files) => {
      console.log('Files:', files);
      setFiles(files || []);
      console.log('Files:', files);
    };

    window.electron.ipcRenderer.on('run-files', handleFiles);

    return () => {
      window.electron.ipcRenderer.removeListener('run-files', handleFiles);
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
    setIsDeleteDialogOpen(false);
    onClose(); // Close the main dialog after deletion
  };

  const handleViewRun = () => {
    // Implement the logic to view the run details
    console.log('View run:', runId);
  };

  const handlePrevFile = () => {
    setCurrentFileIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };

  const handleNextFile = () => {
    setCurrentFileIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };

  const handleViewFiles = () => {
    if (run?.exportPath) {
      window.electron.ipcRenderer.send('open-folder', run.exportPath);
    }
  };

  if (!run) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[70vw] h-[80vh] overflow-y-auto bg-background">

        {run.status === 'success' && files.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Button onClick={handlePrevFile} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{`${currentFileIndex + 1} / ${files.length}`}</span>
              <Button onClick={handleNextFile} variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {files[currentFileIndex] && (
              <div className="rounded-lg overflow-hidden">
                <MonacoEditor
                  height="200px"
                  language="json"
                  theme="vs-dark"
                  value={files[currentFileIndex].content}
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
                <Button variant="outline" size="sm" onClick={handleViewFiles}>
                  <Folder className="mr-2 h-4 w-4" />
                  View Files
                </Button>
              )}
            </div>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{run.name} Export</CardTitle>
              <div className="flex items-center space-x-2">
                <StatusIndicator status={run.status} />
                <span>{run.status}</span>
                <Clock size={16} />
                <span>{getElapsedTime(run.startDate, run.endDate)}</span>
              </div>
            </CardHeader>
            <CardContent className="max-w-full"> 
              {run.logs.length > 0 ? (
                <div className="space-y-2">
                  {run.logs.split('\n').map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        index === run.logs.length - 1 ? 'bg-muted font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 flex-shrink-0 rounded-full bg-primary mt-2" />
                        <div className="break-all whitespace-pre-wrap min-w-0 flex-1">
                          {log}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No logs</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RunDetails;
