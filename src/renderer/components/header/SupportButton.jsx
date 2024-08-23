import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Play,
  MessageSquarePlus,
  Bug,
  Github,
  Twitter,
  Mail,
  Users,
  Sparkles,
  Shield,
  GithubIcon,
  Laptop,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
      window.electron.ipcRenderer.removeListener(
        'version-number',
        versionNumberListener,
      );
    };
  }, []);

  const handleOpenLink = (url) => {
    window.electron.ipcRenderer.send('open-external', url);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="support-button">
            <HelpCircle size={16} />
            Support
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Support</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleOpenLink('https://discord.gg/5KQkWApkYC')}
            style={{ cursor: 'pointer' }}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Join Community</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleOpenLink('https://github.com/CEREBRUS-MAXIMUS/Surfer-Data')
            }
            style={{ cursor: 'pointer' }}
          >
            <GithubIcon className="mr-2 h-4 w-4" />
            <span>Contribute on GitHub</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              handleOpenLink(
                'https://calendly.com/jackblair/surfer-meeting',
              )
            }
            style={{ cursor: 'pointer' }}
          >
            <Laptop className="mr-2 h-4 w-4" />
            <span>Meet with Founders</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger style={{ cursor: 'pointer' }}>
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>More</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
            <DropdownMenuItem
            onClick={() =>
              handleOpenLink(
                'https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/issues/new/choose',
              )
            }
            style={{ cursor: 'pointer' }}
          >
            <Bug className="mr-2 h-4 w-4" />
            <span>Report a Bug</span>
          </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleOpenLink('https://www.youtube.com/watch?v=XQn2RnTvtHQ')
                }
                style={{ cursor: 'pointer' }}
              >
                <Play className="mr-2 h-4 w-4" />
                <span>Watch Demo Video</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenLink('https://x.com/surfsupai')}
                style={{ cursor: 'pointer' }}
              >
                <Twitter className="mr-2 h-4 w-4" />
                <span>Follow on Twitter</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleOpenLink(`https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/releases`)
                }
                style={{ cursor: 'pointer' }}
              >
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
