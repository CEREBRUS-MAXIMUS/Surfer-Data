import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronRight, Clock, XCircle, Trash2, Folder, Code, BarChart, Brain } from 'lucide-react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent } from "./ui/dialog";
import { stopRun } from '../state/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import CodeBlock from './CodeBlock';
import { getCodeExamples } from "../helpers";

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

const RunDetails = ({ runId, onClose }) => {
  const dispatch = useDispatch();
  const run = useSelector(state => state.app.runs.find(r => r.id === runId));
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const codeExamples = getCodeExamples(run);

  useEffect(() => {
    if (run?.status === 'success' && run?.exportPath) {
      console.log('this run: ', run);
      window.electron.ipcRenderer.send('get-run-files', run.exportPath);
    }
  }, [run]);

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
    }
  };

  const handleDeleteRun = async () => {
    dispatch(deleteRun(runId));
    setIsDeleteDialogOpen(false);
    onClose(); // Close the main dialog after deletion
  };

  const handleViewFiles = () => {
    if (run?.exportPath) {
      window.electron.ipcRenderer.send('open-folder', run.exportPath);
    }
  };

  if (!run) return null;

  const sections = [
    {
      id: 'dashboard',
      title: 'Build Streamlit Chatbot',
      icon: <Code className="h-4 w-4" />,
      content: <CodeBlock title="Create a Streamlit Chatbot" code={codeExamples.dashboard} />
    },
    {
      id: 'analysis',
      title: 'Analyze Data',
      icon: <BarChart className="h-4 w-4" />,
      content: <CodeBlock title="Analyze Your Data" code={codeExamples.analysis} />
    },
    {
      id: 'ai',
      title: 'Train AI',
      icon: <Brain className="h-4 w-4" />,
      content: <CodeBlock title="Train AI Model" code={codeExamples.aiTraining} />
    },
    {
      id: 'logs',
      title: 'Logs',
      icon: <Clock className="h-4 w-4" />,
      content: (
        <Card>
          <CardContent className="pt-6">
            {run.logs ? (
              <div className="space-y-2 overflow-y-auto max-h-[75vh]">
                {run.logs.split('\n').map((log, index) => (
                  <div key={index}>
                    <div className="flex items-start gap-2">
                      <div className="w-1 h-1 flex-shrink-0 rounded-full bg-primary mt-2" />
                      <div className="break-all whitespace-pre-wrap min-w-0 flex-1">{log}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No logs available</p>
            )}
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-muted/40 p-4 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Build Options</h2>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors
                    ${activeSection === section.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                    }`}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Actions</h2>
              <div className="space-y-2">
                {run?.exportPath && (
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleViewFiles}>
                    <Folder className="mr-2 h-4 w-4" />
                    Open Files
                  </Button>
                )}
                
                {(run?.status === 'pending' || run?.status === 'running') && (
                  <Button variant="destructive" size="sm" className="w-full justify-start" onClick={handleStopRun}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Stop Run
                  </Button>
                )}

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Run
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this run and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteRun}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StatusIndicator status={run.status} />
                <span className="capitalize">{run.status}</span>
                <span>•</span>
                <span>{getElapsedTime(run.startDate, run.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              {sections.find(s => s.id === activeSection)?.content}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RunDetails;
