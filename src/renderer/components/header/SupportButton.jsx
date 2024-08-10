import React, { useState, useEffect } from 'react';
import { LifeBuoy, Play, MessageSquarePlus, Bug, Github, Twitter, Mail, Users, Sparkles, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { HelpCircle } from 'lucide-react';

const SupportButton = () => {
  const [versionNumber, setVersionNumber] = useState(null);

  useEffect(() => {
    window.electron.ipcRenderer.send('get-version-number');
    const versionNumberListener = (event) => {
      if (event) {
        console.log('Version number:', event);
        setVersionNumber(event);
      }
    };

    window.electron.ipcRenderer.on('version-number', versionNumberListener);

    return () => {
      window.electron.ipcRenderer.removeListener('version-number', versionNumberListener);
    };
  }, []);

  const handleOpenLink = (url) => {
    window.electron.ipcRenderer.send('open-external', url);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="support-button"
          >
            <HelpCircle size={16} />
            Support</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Support</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleOpenLink('https://discord.gg/5KQkWApkYC')} style={{ cursor: 'pointer' }}>
                <Users className="mr-2 h-4 w-4" />
                <span>Join Community</span>
              </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenLink('https://insigh.to/b/second')} style={{ cursor: 'pointer' }}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>Request New Feature</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenLink('https://insigh.to/b/second')} style={{ cursor: 'pointer' }}>
            <Bug className="mr-2 h-4 w-4" />
            <span>Report a Bug</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger style={{ cursor: 'pointer' }}>
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>More</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleOpenLink('mailto:lihas1002@gmail.com')} style={{ cursor: 'pointer' }}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Email Us</span>
          </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenLink('https://www.youtube.com/watch?v=6l7xL46s0Ec')} style={{ cursor: 'pointer' }}>
                <Play className="mr-2 h-4 w-4" />
                <span>Watch Demo Video</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenLink('https://x.com/surfsupai')} style={{ cursor: 'pointer' }}>
                <Twitter className="mr-2 h-4 w-4" />
                <span>Follow on Twitter</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenLink(`https://surfer.framer.website/whatsnew`)} style={{ cursor: 'pointer' }}>
                <Sparkles className="mr-2 h-4 w-4" />
                <span>What's New in v{versionNumber}</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  );
};

export default SupportButton;
