import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setDefaultChatPanelPosition,
  setHighlightButtons,
  setApplicationFont,
  setShowSystemMessages,
  setCurrentPage,
} from '../../state/actions';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useTheme } from '../ui/theme-provider';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';

const Settings = () => {
  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.preferences);
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value) => {
    setTheme(value);
  };

  const handleApplicationFontChange = (value) => {
    dispatch(setApplicationFont(value));
  };


  const handleCheckForUpdates = () => {
    window.electron.ipcRenderer.send('check-for-updates');
  };

  const handleResetEntireApp = async () => {
    if (window.confirm('Are you sure you want to reset the entire app? This action cannot be undone.')) {
      try {
        await deleteAllDatabases();

        localStorage.clear();
        sessionStorage.clear();

        await window.electron.ipcRenderer.invoke('delete-graphrag-folder');
        await window.electron.ipcRenderer.invoke('deleteWebHistoryCollection');
        await window.electron.ipcRenderer.invoke('deleteFileSystemCollection');

        await auth.signOut();

        // dispatch(resetEntireApp());

        await window.electron.ipcRenderer.invoke('restart-app');

        toast({
          title: 'App Reset',
          description: 'The app has been reset successfully. Please restart the application.',
        });
      } catch (error) {
        console.error('Error resetting app:', error);
        toast({
          title: 'Error',
          description: 'Failed to reset the app. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleBack = () => {
    dispatch(setCurrentPage('tabs'));
  };

  return (
    <div className={`container mx-auto px-4 py-8`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleBack}>Back</Button>
      </div>

      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <RadioGroup
              value={theme}
              onValueChange={handleThemeChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system">System</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Application Font</h2>
            <RadioGroup
              value={preferences.applicationFont}
              onValueChange={handleApplicationFontChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="font-default" />
                <Label htmlFor="font-default" className="font-sans">Default (Inter)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="niramit" id="font-niramit" />
                <Label htmlFor="font-niramit" className="font-niramit">Niramit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bricolage" id="font-bricolage" />
                <Label htmlFor="font-bricolage" className="font-bricolage">Bricolage Grotesque</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gurajada" id="font-gurajada" />
                <Label htmlFor="font-gurajada" className="font-gurajada">Gurajada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="averia" id="font-averia" />
                <Label htmlFor="font-averia" className="font-averia">Averia Sans Libre</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Application Updates</h2>
            <Button onClick={handleCheckForUpdates}>
              Check for Updates
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Reset Application</h2>
            <p className="mb-4">Reset the entire application to its initial state. This will clear all data and sign you out.</p>
            <Button variant="destructive" onClick={handleResetEntireApp}>
            Reset and Restart App
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
