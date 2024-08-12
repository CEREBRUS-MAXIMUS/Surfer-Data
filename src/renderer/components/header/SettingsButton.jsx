import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Brain,
  Terminal,
  Clock,
  Trash2,
  LogOut,
  Code,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Settings as IconSettings } from 'lucide-react';
import { useTheme } from '../ui/theme-provider';
import {
  RadioGroup,
  RadioGroupItem
} from '../ui/radio-group';
import { Label } from '../ui/label';
import { setCurrentRoute } from '../../state/actions';


const SettingsButton = ({ handleOpenHistory }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const { setTheme } = useTheme();

  const handleQuitApplication = () => {
    if (window.electron) {
      window.electron.ipcRenderer.send('quit-app');
    } else {
      console.error('Electron API not available');
    }
  };

  const handleOpenFullSettings = () => {
    dispatch(setCurrentRoute('/settings'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="history-button" alt="settings button" style={{ cursor: 'pointer' }}>
          <IconSettings size={18} color="hsl(var(--foreground))" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger style={{ cursor: 'pointer' }}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Appearance</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')} style={{ cursor: 'pointer' }}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} style={{ cursor: 'pointer' }}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} style={{ cursor: 'pointer' }}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={handleOpenFullSettings} style={{ cursor: 'pointer' }}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Full Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsButton;
