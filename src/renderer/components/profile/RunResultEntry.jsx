import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { MoonLoader } from 'react-spinners';
import { ArrowUpRight, HardDriveDownload, Folder, X } from 'lucide-react';
import ConfettiExplosion from 'react-confetti-explosion';
import { formatLastRunTime } from '../../lib/formatting';

const RunResultEntry = ({ run, platform, onViewDetails, onExport, isHovered }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (run.status === 'success' && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2200);
    }
  }, [run.status]);

  const formatExportSize = (sizeInBits) => {
    if (!sizeInBits) return 'Unknown size';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = sizeInBits / (8 * 1024);
    let unitIndex = 0;
    while (size >= 1000 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    const formattedSize = size >= 100 ? Math.round(size).toString() : size >= 10 ? size.toFixed(1) : size.toFixed(2);
    return `${formattedSize} ${units[unitIndex]}`;
  };

  const renderContent = () => {
    switch (run.status) {
      case 'running':
        return (
          <div className="flex items-center space-x-2 group h-[36px]">
            <MoonLoader size={16} color="#000" speedMultiplier={1.4} />
            <span className="group-hover:underline cursor-pointer" onClick={() => onViewDetails(run)}>Running...</span>
            <span className="cursor-pointer flex items-center hover:underline" onClick={() => onViewDetails(run)}>
              <ArrowUpRight size={22} className="ml-1" color="#5a5a5a" />
            </span>
          </div>
        );
      case 'success':
        return (
          <div className='flex justify-between items-center w-full h-[36px]'>
            <div className="flex items-center space-x-2">
              {showConfetti && (
                <ConfettiExplosion particleCount={50} width={200} duration={2200} force={0.4} />
              )}
              <div onClick={() => window.electron.ipcRenderer.send('open-folder', run.exportPath)} style={{ cursor: 'pointer' }}>
                <Folder size={17} color="#5a5a5a" />
              </div>
              <span className="cursor-pointer hover:underline" onClick={() => window.electron.ipcRenderer.send('open-folder', run.exportPath)}>
                {formatExportSize(run.exportSize)}
              </span>
              <span className="text-gray-500">-</span>
              <span className="cursor-pointer flex items-center hover:underline" onClick={() => onViewDetails(run)}>
                {formatLastRunTime(run.exportDate || run.startDate)}
                <ArrowUpRight size={22} className="ml-1" color="#5a5a5a" />
              </span>
            </div>
            {isHovered && (
              <Button size="sm" variant="outline" className="flex items-center ml-4" onClick={() => onExport(platform)}>
                <HardDriveDownload size={16} className="mr-2" />
                Re-Export
              </Button>
            )}
          </div>
        );
      case 'error':
      case 'stopped':
        return (
          <div className="flex items-center justify-between w-full h-[36px]">
            <div className="flex items-center space-x-2">
              <X className="text-red-500" size={16} />
              <span className="hover:underline cursor-pointer" onClick={() => onViewDetails(run)}>
                Export {run.status === 'error' ? 'failed' : 'stopped'}
              </span>
            </div>
            {isHovered && (
              <Button size="sm" variant="outline" className="flex items-center" onClick={() => onExport(platform)}>
                <HardDriveDownload size={16} className="mr-2" />
                Retry Export
              </Button>
            )}
          </div>
        );
      default:
        return (
          <div className="flex justify-between items-center w-full h-[36px]">
            <div></div>
            {isHovered && (
              <Button size="sm" variant="outline" className="flex items-center" onClick={() => onExport(platform)}>
                <HardDriveDownload size={16} className="mr-2" />
                Export
              </Button>
            )}
          </div>
        );
    }
  };

  return renderContent();
};

export default RunResultEntry;
