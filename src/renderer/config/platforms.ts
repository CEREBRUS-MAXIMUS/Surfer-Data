import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Users,
  Code,
  Book,
  Mail,
  Folder,
  MessageSquare,
  User,
  Twitter,
  FileText,
  Briefcase,
  AtSign,
  Cloud,
} from 'lucide-react';
import GithubLight from '../components/assets/platforms/GithubLight';
import GithubDark from '../components/assets/platforms/GithubDark';
import XLight from '../components/assets/platforms/XLight';
import XDark from '../components/assets/platforms/XDark';
import LinkedInLight from '../components/assets/platforms/LinkedInLight';
import LinkedInDark from '../components/assets/platforms/LinkedInDark';
import GmailLight from '../components/assets/platforms/GmailLight';
import GmailDark from '../components/assets/platforms/GmailDark';
import NotionLight from '../components/assets/platforms/NotionLight';
import NotionDark from '../components/assets/platforms/NotionDark';
import GoogleCalendarLight from '../components/assets/platforms/GoogleCalendarLight';
import GoogleCalendarDark from '../components/assets/platforms/GoogleCalendarDark';
import WhatsAppLight from '../components/assets/platforms/WhatsAppLight';
import WhatsAppDark from '../components/assets/platforms/WhatsAppDark';
import FacebookLight from '../components/assets/platforms/FacebookLight';
import FacebookDark from '../components/assets/platforms/FacebookDark';
import MediumLight from '../components/assets/platforms/MediumLight';
import MediumDark from '../components/assets/platforms/MediumDark';
import YoutubeLight from '../components/assets/platforms/YoutubeLight';
import YoutubeDark from '../components/assets/platforms/YoutubeDark';
import WeatherLight from '../components/assets/platforms/WeatherLight';
import WeatherDark from '../components/assets/platforms/WeatherDark';
import XTrendingLight from '../components/assets/platforms/XTrendingLight';
import XTrendingDark from '../components/assets/platforms/XTrendingDark';
import DevpostLight from '../components/assets/platforms/DevpostLight';
import DevpostDark from '../components/assets/platforms/DevpostDark';
import UnsplashLight from '../components/assets/platforms/UnsplashLight';
import UnsplashDark from '../components/assets/platforms/UnsplashDark';
import DiscordLight from '../components/assets/platforms/DiscordLight';
import DiscordDark from '../components/assets/platforms/DiscordDark';
import ChatGPTLight from '../components/assets/platforms/ChatGPTLight';
import ChatGPTDark from '../components/assets/platforms/ChatGPTDark';
import ClaudeLight from '../components/assets/platforms/ClaudeLight';
import ClaudeDark from '../components/assets/platforms/ClaudeDark';
import NewsLight from '../components/assets/platforms/NewsLight';
import NewsDark from '../components/assets/platforms/NewsDark';
import { IPlatform } from '../types/interfaces';

export const platforms: IPlatform[] = [
  {
    id: 'gmail-001',
    name: 'Gmail',
    description: 'Exports all emails.',
    logo: {
      light: GmailLight,
      dark: GmailDark,
    },
    company: 'Google',
    companyLogo: '/assets/logos/google.svg',
    home_url: 'https://mail.google.com',
    subRuns: [
      {
        id: 'gmail-001-all',
        name: 'All Email',
        icon: Mail,
        description: 'Extracts all emails',
        extractionMethod:
          'The general approach here is to use Google Takeout to request a full export of all your emails, then download the MBOX file that gets sent to Gmail and convert the MBOX file to JSON.',
        tasks: [
          {
            id: 'gmail-001-all-task-1',
            name: 'Google Takeout',
            steps: [
              {
                id: 'step-1',
                name: 'Navigate to Google Takeout',
                status: 'pending',
              },
              {
                id: 'step-2',
                name: 'Wait for export to complete',
                status: 'pending',
              },
              {
                id: 'step-3',
                name: 'Download exported file',
                status: 'pending',
              },
            ],
            status: 'pending',
          },
          {
            id: 'gmail-001-all-task-2',
            name: 'Convert MBOX to JSON',
            steps: [
              { id: 'step-1', name: 'Parse MBOX file', status: 'pending' },
              {
                id: 'step-2',
                name: 'Convert to JSON format',
                status: 'pending',
              },
              { id: 'step-3', name: 'Save JSON file', status: 'pending' },
            ],
            status: 'pending',
          },
        ],
      },
    ],
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to Gmail', status: 'pending' },
      { id: 'step-002', name: 'Clicking on first emails', status: 'pending' },
      { id: 'step-003', name: 'Going through all emails', status: 'pending' },
      { id: 'step-004', name: 'Exporting Data', status: 'pending' },
    ],
  },
  {
    id: 'takeout-001',
    name: 'Takeout',
    description: 'Exports all data from Google Takeout.',
    logo: {
      light: GmailLight,
      dark: GmailDark,
    },
    company: 'Google',
    companyLogo: '/assets/logos/google.svg',
    home_url: 'https://takeout.google.com',
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to Google Takeout', status: 'pending' },
      { id: 'step-002', name: 'Clicking on first emails', status: 'pending' },
      { id: 'step-003', name: 'Going through all emails', status: 'pending' },
      { id: 'step-004', name: 'Exporting Data', status: 'pending' },
    ],
  }
]