import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ChevronDown, ChevronRight, Clock, ArrowLeft, XCircle, Eye, Trash2 } from 'lucide-react';
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { openDB } from 'idb';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { updateRunStatus, deleteRun } from '../../state/actions';

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

const RunDetailsPage = ({ runId, onBack, platform, subRun }) => {
  const dispatch = useDispatch();
  const [run, setRun] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [, forceUpdate] = useState();

  useEffect(() => {
    const loadRun = async () => {
      const db = await openDB('dataExtractionDB', 1);
      const loadedRun = await db.get('runs', runId);

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
    };
    loadRun();

    // Set up an interval to force update every second
    const interval = setInterval(() => forceUpdate({}), 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [runId]);

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

  const handleCancelRun = async () => {
    if (run && (run.status === 'pending' || run.status === 'running')) {
      const updatedRun = { ...run, status: 'error', endDate: new Date().toISOString() };

      // Update Redux
      dispatch(updateRunStatus(updatedRun));

      // Update IndexedDB
      const db = await openDB('dataExtractionDB', 1);
      await db.put('runs', updatedRun);

      // Update local state
      setRun(updatedRun);

      console.log('Run cancelled:', updatedRun);
      // Here you would also implement the logic to actually stop the run process
    }
  };

  const toggleStep = (taskId, stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [`${taskId}-${stepId}`]: !prev[`${taskId}-${stepId}`]
    }));
  };

  const handleDeleteRun = async () => {
    if (window.confirm('Are you sure you want to delete this run?')) {
      dispatch(deleteRun(runId));
      const db = await openDB('dataExtractionDB', 1);
      await db.delete('runs', runId);
      onBack(); // Navigate back after deletion
    }
  };

  const handleViewRun = () => {
    // Implement the logic to view the run details
    console.log('View run:', runId);
  };

  if (!run) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Runs
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{run?.subRunId} Extraction</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleViewRun}>
            <Eye className="mr-2 h-4 w-4" />
            View Run
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteRun}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Run
          </Button>
          {(run?.status === 'pending' || run?.status === 'running') && (
            <Button variant="destructive" size="sm" onClick={handleCancelRun}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Run
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
          <div className="flex h-[600px]">
            <div className="w-1/3 border-r overflow-y-auto">
              {run.tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 border-b cursor-pointer ${selectedTaskId === task.id ? 'bg-gray-100' : ''}`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <StatusIndicator status={task.status} />
                      <span className="font-semibold">{task.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-2/3 overflow-y-auto">
              <ScrollArea className="h-full">
                {run.tasks.find(task => task.id === selectedTaskId)?.steps.map(step => (
                  <div key={step.id} className="p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStep(selectedTaskId, step.id)}
                        >
                          {expandedSteps[`${selectedTaskId}-${step.id}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </Button>
                        <StatusIndicator status={step.status} />
                        <span className="font-semibold">{step.name}</span>
                      </div>
                      <span>{getElapsedTime(step.startTime, step.endTime)}</span>
                    </div>
                    {expandedSteps[`${selectedTaskId}-${step.id}`] && (
                      <div className="bg-gray-100 p-2 rounded">
                        <pre className="text-sm">
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
  );
};

export default RunDetailsPage;
