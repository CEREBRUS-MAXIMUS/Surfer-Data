import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Clock, Plus, Home, Wrench, Eye } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSelector, useDispatch } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useTheme } from '../ui/theme-provider';
import { setCurrentPage, toggleRunVisibility } from '../../state/actions';
import { Button } from '../ui/button';
import Toggle from './Toggle';
import SettingsButton from './SettingsButton';
import SupportButton from './SupportButton';
import IntegrationsButton from './IntegrationsButton';

const getStyleHorizontalLock = (style) =>
  style?.transform
    ? {
        ...style,
        transform: `translate(${style.transform.split(',')[0].split('(').pop()}, 0px)`,
      }
    : style;

const StyledSurferHeader = styled.div`
  align-items: center;
  border-bottom-style: solid;
  border-bottom-width: 0.8px;
  border-color: hsl(var(--border));
  display: flex;
  gap: 16px;
  height: 55px;
  padding: 13.72px 13px 14.28px;
  position: relative;
  width: 100%;
  -webkit-app-region: drag;
  user-select: none;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));

  & .div {
    align-items: center;
    display: flex;
    height: 36px;
    flex: 1;
    flex-grow: 1;
    justify-content: space-between;
    margin-bottom: -4.49px;
    margin-top: -4.49px;
    position: relative;
  }

  & .header-main-content {
    align-items: center;
    display: flex;
    flex: 1;
    flex-grow: 1;
    gap: 16px;
    position: relative;
  }

  & .browser-controls {
    height: 13px;
    position: relative;
    width: 52px;
  }

  & .option-expand {
    background-color: #27ca40;
    border: 0.5px solid;
    border-color: #3eaf3f;
    border-radius: 6px;
    height: 12px;
    left: 40px;
    position: absolute;
    top: 1px;
    width: 12px;
  }

  & .option-minimize {
    background-color: #ffc130;
    border: 0.5px solid;
    border-color: #e1a325;
    border-radius: 6px;
    height: 12px;
    left: 20px;
    position: absolute;
    top: 1px;
    width: 12px;
  }

  & .option-close {
    background-color: #ff6058;
    border: 0.5px solid;
    border-color: #e14942;
    border-radius: 6px;
    height: 12px;
    left: 0;
    position: absolute;
    top: 1px;
    width: 12px;
  }

  & .header-tabs {
    display: flex;
    flex: 1;
    overflow-x: auto;
    padding-right: 24px;
    -webkit-app-region: drag;
    align-items: center;
    height: 100%;
  }

  & .tabs-container {
    display: flex;
    flex: 1;
    align-items: center;
    height: 100%;
    overflow: hidden; // Hide overflowing content during transitions
  }

  & .img-button,
  & .history-button {
    height: 32px;
    width: 32px;
    background-color: hsl(var(--secondary));
    border-radius: 9999px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    color: hsl(var(--secondary-foreground));
  }

  & .img-button:hover,
  & .history-button:hover {
    background-color: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
  }


  & .surfer-tab {
    align-items: center;
    background-color: hsl(var(--background));
    border-radius: 9999px;
    display: flex;
    justify-content: space-between;
    padding: 6px 6px 6px 12px;
    position: relative;
    margin-right: 8px;
    height: 36px;
    cursor: pointer;
    flex-grow: inherit;
    -webkit-app-region: no-drag;
    transition: background-color 0.2s ease;
  }

  & .surfer-tab:hover {
    background-color: hsl(var(--secondary));
  }

  & .surfer-tab.selected {
    background-color: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
  }

  & .div-2 {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  & .frame-2 {
    height: 18px;
    width: 18px;
    flex-shrink: 0;
    border-radius: 6px;
  }

  & .tab-right-content {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }

  & .close-icon {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  & .close-icon:hover {
    opacity: 1;
  }

  & .px-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .py-1\.5 {
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
  }

  & .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  & .font-bold {
    font-weight: 700;
  }

  & .text-white {
    color: #ffffff;
  }

  & .tab-name {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #ffffff;
    display: -webkit-box;
    font-family: 'SF Pro-Medium', Helvetica;
    font-size: 13px;
    font-weight: 500;
    height: 16px;
    left: 0;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    position: fixed;
    text-overflow: ellipsis;
    top: 0;
  }

  & .span {
    letter-spacing: 0.02px;
  }

  & .tab-name-5 {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #484848;
    display: -webkit-box;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 13px;
    font-weight: 500;
    height: 15px;
    left: 0;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .tab-name-2 {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #707070;
    display: -webkit-box;
    flex: 1;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: normal;
    margin-top: -0.5px;
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
  }

  & .live-indicator {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    padding: 0px 0px 0px 8px;
    position: relative;
  }

  & .live-indicator-2 {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    gap: 4px;
    position: relative;
  }

  & .frame-3 {
    height: 17px;
    position: relative;
    width: 17px;
  }

  & .live-indicator-3 {
    align-items: center;
    background-color: #22c55e1a;
    border-radius: 9999px;
    display: inline-flex;
    flex: 0 0 auto;
    height: 23.99px;
    padding: 3.99px 10px 4px 4px;
    position: relative;
  }

  & .background-2 {
    background-color: #22c55e;
    border-radius: 9999px;
    height: 6px;
    position: relative;
    width: 6px;
    animation: blinkBackground 1s infinite; // Add blinking animation
  }

  @keyframes blinkBackground {
    0% {
      background-color: #22c55e;
    }
    50% {
      background-color: transparent;
    }
    100% {
      background-color: #22c55e;
    }
  }

  & .live-indicator-text {
    color: #22c55e;
    font-family: 'SF Pro Text-Regular', Helvetica;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 16px;
    margin-top: -1px;
    position: relative;
    white-space: nowrap;
    width: fit-content;
  }

  & .button-menu-2 {
    align-items: center;
    background: linear-gradient(
      180deg,
      rgb(27, 27, 29) 0%,
      rgb(27, 27, 29) 100%
    );
    border-radius: 9999px;
    display: flex;
    flex: 1;
    flex-grow: 1;
    justify-content: space-between;
    padding: 6px 6px 6px 12px;
    position: relative;
  }

  & .p {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #ffffff;
    display: -webkit-box;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
    width: fit-content;
  }

  & .tab-name-3 {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #484848;
    display: -webkit-box;
    flex: 1;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
  }

  & .container-wrapper {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    position: relative;
  }

  & .overlay-2 {
    align-items: center;
    background-color: #c522221a;
    border-radius: 9999px;
    display: inline-flex;
    flex: 0 0 auto;
    height: 23.99px;
    padding: 3.99px 10px 4px 4px;
    position: relative;
  }

  & .background-3 {
    background-color: #c52222;
    border-radius: 9999px;
    height: 6px;
    position: relative;
    width: 6px;
  }

  & .text-wrapper-2 {
    color: #c52222;
    font-family: 'SF Pro Text-Regular', Helvetica;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 16px;
    margin-top: -1px;
    position: relative;
    white-space: nowrap;
    width: fit-content;
  }

  & .header-option-panel {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    gap: 8px;
    position: relative;
    -webkit-app-region: no-drag;
    height: 100%;
    // margin-right: 2px;
  }

  & .support-button {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    gap: 6px;
    height: 32px;
    cursor: pointer;
    padding: 0 10px;
  }

  & .support-button:hover {
    background-color: #ffffff13;
  }

  & .SVG {
    height: 16px;
    position: relative;
    width: 16px;
  }

  & .text-wrapper-3 {
    color: #ffffffb2;
    font-family: 'SF Pro Text-Regular', Helvetica;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 20px;
    margin-top: -1px;
    position: relative;
    text-align: center;
    white-space: nowrap;
    width: fit-content;
  }

  & .auth-button {
    cursor: pointer;
    align-items: center;
    background-color: hsl(var(--background));
    border-radius: 9999px;
    display: flex;
    flex-direction: column;
    height: 32px;
    justify-content: center;
    position: relative;
    width: 32px;
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition: background-color 0.2s ease;
  }

  & .auth-button:hover {
    background-color: hsl(var(--background));
    cursor: pointer;
  }

  & .image-user-profile {
    margin-bottom: -2px;
    margin-left: -2px;
    margin-right: -2px;
    margin-top: -2px;
    padding: 3px;
    object-fit: cover;
    position: relative;
    border-radius: 9999px;
    object-fit: fill;
    cursor: pointer;
    background-color: hsl(var(--secondary));
  }

  & .settings-button {
    flex: 0 0 auto;
    position: relative;
    transition: background-color 0.2s ease;
  }

  & .tab-wrapper {
    flex: 1;
    min-width: 0; // Allow tabs to shrink below their content size
    transition: flex 150ms ease; // Changed from 300ms to 150ms
  }

  /* Update animation styles */
  .tab-enter {
    opacity: 0;
    flex: 0.01 !important;
  }
  .tab-enter-active {
    opacity: 1;
    flex: 1 !important;
    transition:
      opacity 150ms ease,
      flex 150ms ease; // Changed from 300ms to 150ms
  }
  .tab-exit {
    opacity: 1;
    flex: 1;
  }
  .tab-exit-active {
    opacity: 0;
    flex: 0.01 !important;
    transition:
      opacity 150ms ease,
      flex 150ms ease; // Changed from 300ms to 150ms
  }
`;

export const SurferHeader = () => {
  const dispatch = useDispatch();
  const runs = useSelector((state) => state.runs);
  const isRunLayerVisible = useSelector((state) => state.isRunLayerVisible);
  const activeRuns = useSelector(
    (state) => state.runs.filter((run) => run.status === 'running').length,
  );

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    window.electron.ipcRenderer.send('get-platform');

    const handlePlatformReply = (event) => {
      setIsMac(event === 'darwin');
    };

    const handleFullscreenChange = (event) => {
      console.log('Fullscreen:', event);
      setIsFullScreen(event);
    };

    window.electron.ipcRenderer.on('platform', handlePlatformReply);
    window.electron.ipcRenderer.on(
      'fullscreen-changed',
      handleFullscreenChange,
    );

    return () => {
      window.electron.ipcRenderer.removeAllListeners('platform');
      window.electron.ipcRenderer.removeAllListeners('fullscreen-changed');
    };
  }, []);

  const { theme } = useTheme();

  const handleViewRuns = () => {
    dispatch(setCurrentPage('tabs'));
    dispatch(toggleRunVisibility());
  };

  return (
    <StyledSurferHeader theme={theme} className="bg-background text-foreground">
      <div className="div">
        <div className="header-main-content">
          {!isFullScreen && isMac && <div className="browser-controls" />}

          <div className="header-tabs">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleViewRuns}
                    className="history-button relative"
                  >
                    <Eye size={18} />
                    {runs.length > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                        {activeRuns}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Runs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {activeRuns > 0 && (
              <div className="ml-2 bg-blue-500 text-white rounded-full px-2 py-1 text-xs flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                {activeRuns} active run{activeRuns !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        <div className="header-option-panel">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SupportButton />
              </TooltipTrigger>
              <TooltipContent>
                <p>Support</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <IntegrationsButton />
              </TooltipTrigger>
              <TooltipContent>
                <p>Integrations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SettingsButton />
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </StyledSurferHeader>
  );
};
