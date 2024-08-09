import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage, addWorkspace } from '../../state/actions';
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
import { Switch } from '../ui/switch';
import { setUserProfileActiveTab } from '../../state/actions';

const Toggle = ({ onClick }) => {
  const { theme, setTheme } = useTheme()
  const dispatch = useDispatch();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };


  const handleSettingsClick = () => {
    dispatch(setCurrentPage('settings'));
    if (onClick) onClick();
  };

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4" />
      <Switch
        id="dark-mode"
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
      />
      <Moon className="h-4 w-4" />
      <Label htmlFor="dark-mode" className="sr-only">
        Toggle dark mode
      </Label>
    </div>
  );
};

export default Toggle;
