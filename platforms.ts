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
import GithubLight from './src/renderer/components/assets/platforms/GithubLight';
import GithubDark from './src/renderer/components/assets/platforms/GithubDark';
import XLight from './src/renderer/components/assets/platforms/XLight';
import XDark from './src/renderer/components/assets/platforms/XDark';
import LinkedInLight from './src/renderer/components/assets/platforms/LinkedInLight';
import LinkedInDark from './src/renderer/components/assets/platforms/LinkedInDark';
import GmailLight from './src/renderer/components/assets/platforms/GmailLight';
import GmailDark from './src/renderer/components/assets/platforms/GmailDark';
import NotionLight from './src/renderer/components/assets/platforms/NotionLight';
import NotionDark from './src/renderer/components/assets/platforms/NotionDark';
import GoogleCalendarLight from './src/renderer/components/assets/platforms/GoogleCalendarLight';
import GoogleCalendarDark from './src/renderer/components/assets/platforms/GoogleCalendarDark';
import WhatsAppLight from './src/renderer/components/assets/platforms/WhatsAppLight';
import WhatsAppDark from './src/renderer/components/assets/platforms/WhatsAppDark';
import FacebookLight from './src/renderer/components/assets/platforms/FacebookLight';
import FacebookDark from './src/renderer/components/assets/platforms/FacebookDark';
import MediumLight from './src/renderer/components/assets/platforms/MediumLight';
import MediumDark from './src/renderer/components/assets/platforms/MediumDark';
import YoutubeLight from './src/renderer/components/assets/platforms/YoutubeLight';
import YoutubeDark from './src/renderer/components/assets/platforms/YoutubeDark';
import WeatherLight from './src/renderer/components/assets/platforms/WeatherLight';
import WeatherDark from './src/renderer/components/assets/platforms/WeatherDark';
import XTrendingLight from './src/renderer/components/assets/platforms/XTrendingLight';
import XTrendingDark from './src/renderer/components/assets/platforms/XTrendingDark';
import DevpostLight from './src/renderer/components/assets/platforms/DevpostLight';
import DevpostDark from './src/renderer/components/assets/platforms/DevpostDark';
import UnsplashLight from './src/renderer/components/assets/platforms/UnsplashLight';
import UnsplashDark from './src/renderer/components/assets/platforms/UnsplashDark';
import DiscordLight from './src/renderer/components/assets/platforms/DiscordLight';
import DiscordDark from './src/renderer/components/assets/platforms/DiscordDark';
import ChatGPTLight from './src/renderer/components/assets/platforms/ChatGPTLight';
import ChatGPTDark from './src/renderer/components/assets/platforms/ChatGPTDark';
import ClaudeLight from './src/renderer/components/assets/platforms/ClaudeLight';
import ClaudeDark from './src/renderer/components/assets/platforms/ClaudeDark';
import NewsLight from './src/renderer/components/assets/platforms/NewsLight';
import NewsDark from './src/renderer/components/assets/platforms/NewsDark';
import { IPlatform } from './src/renderer/types/interfaces';

export const platforms: IPlatform[] = [
  {
    id: 'github-001',
    name: 'GitHub',
    description: 'Exports repository names, links, and descriptions (if any).',
    logo: {
      light: GithubLight,
      dark: GithubDark,
    },
    company: 'Microsoft',
    companyLogo: '/assets/logos/microsoft.svg',
    home_url: 'https://github.com',
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to GitHub', status: 'pending' },
      { id: 'step-002', name: 'Opening user navigation menu', status: 'pending' },
      { id: 'step-003', name: 'Clicking on repositories tab', status: 'pending' },
      { id: 'step-004', name: 'Getting all repositories', status: 'pending' },
      { id: 'step-005', name: 'Exporting Data', status: 'pending' },
    ],
  },
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
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to Gmail', status: 'pending' },
      { id: 'step-002', name: 'Clicking on first emails', status: 'pending' },
      { id: 'step-003', name: 'Going through all emails', status: 'pending' },
      { id: 'step-004', name: 'Exporting Data', status: 'pending' },
    ],
  },
  {
    id: 'notion-001',
    name: 'Notion',
    description: 'Exports your entire workspace.',
    logo: {
      light: NotionLight,
      dark: NotionDark,
    },
    company: 'Notion',
    companyLogo: '/assets/logos/notion.png',
    home_url: 'https://notion.so',
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to Notion', status: 'pending' },
      { id: 'step-002', name: 'Clicking on Dropdown', status: 'pending' },
      {
        id: 'step-003',
        name: 'Clicking on first settings button',
        status: 'pending',
      },
      {
        id: 'step-004',
        name: 'Clicking on second settings button',
        status: 'pending',
      },
      { id: 'step-005', name: 'Clicking on Export dialog', status: 'pending' },
      { id: 'step-006', name: 'Clicking on export button', status: 'pending' },
      { id: 'step-007', name: 'Exporting Data', status: 'pending' },
    ],
  },
  {
    id: 'linkedin-001',
    name: 'LinkedIn',
    description: 'Exports your profile information.',
    logo: {
      light: LinkedInLight,
      dark: LinkedInDark,
    },
    company: 'Microsoft',
    companyLogo: '/assets/logos/microsoft.png',
    home_url: 'https://linkedin.com/feed',
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to LinkedIn', status: 'pending' },
      { id: 'step-002', name: 'Clicking on Profile', status: 'pending' },
      { id: 'step-003', name: 'Clicking on Contact Info', status: 'pending' },
      { id: 'step-004', name: 'Scraping Data', status: 'pending' },
      { id: 'step-005', name: 'Exporting Data', status: 'pending' },
    ],
  },
  {
    id: 'twitter-001',
    name: 'Twitter',
    description: 'Exports your posts.',
    logo: {
      light: XLight,
      dark: XDark,
    },
    company: 'X Corp',
    companyLogo: '/assets/logos/x.png',
    home_url: 'https://x.com/home',
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to Twitter', status: 'pending' },
      { id: 'step-002', name: 'Clicking on Profile', status: 'pending' },
      { id: 'step-003', name: 'Getting tweets', status: 'pending' },
      { id: 'step-005', name: 'Exporting Data', status: 'pending' },
    ],
  },
  {
    id: 'youtube-001',
    name: 'YouTube',
    description: 'Exports the videos in your recommended feed.',
    logo: {
      light: YoutubeLight,
      dark: YoutubeDark,
    },
    company: 'Google',
    companyLogo: '/assets/logos/google.svg',
    home_url: 'https://www.youtube.com',
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      { id: 'step-001', name: 'Going to YouTube', status: 'pending' },
      { id: 'step-002', name: 'Waiting for page to load', status: 'pending' },
      { id: 'step-003', name: 'Extracting video titles', status: 'pending' },
      { id: 'step-004', name: 'Exporting Data', status: 'pending' },
    ],
  },
  {
    id: 'chatgpt-001',
    name: 'ChatGPT',
    description: 'Exports your entire ChatGPT history.',
    logo: {
      light: ChatGPTLight,
      dark: ChatGPTDark,
    },
    company: 'OpenAI',
    companyLogo: '/assets/logos/openai.png',
    home_url: 'https://chatgpt.com/#settings/DataControls',
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      {
        id: 'step-001',
        name: 'Going to ChatGPT Data Controls',
        status: 'pending',
      },
      { id: 'step-002', name: 'Clicking on Export', status: 'pending' },
      { id: 'step-003', name: 'Clicking on Confirm Export', status: 'pending' },
      {
        id: 'step-004',
        name: 'Going to Gmail and waiting for export email',
        status: 'pending',
      },
      { id: 'step-005', name: 'Clicking on export email', status: 'pending' },
      { id: 'step-006', name: 'Exporting data', status: 'pending' },
    ],
  },
  {
    id: 'slack-001',
    name: 'Slack',
    // logo: {
    //   light: SlackLight,
    //   dark: SlackDark,
    // },
    company: 'Salesforce',
    companyLogo: '/assets/logos/salesforce.png',
    home_url: 'https://app.slack.com',
    subRuns: [
      {
        id: 'slack-001-messages',
        name: 'Messages',
        icon: MessageSquare,
        description: 'Extracts all messages',
        extractionMethod: 'Slack API - /chat.postMessage endpoint',
        tasks: [],
      },
      {
        id: 'slack-001-channels',
        name: 'Channels',
        icon: MessageSquare,
        description: 'Extracts channel information',
        extractionMethod: 'Slack API - /conversations.list endpoint',
        tasks: [],
      },
      {
        id: 'slack-001-users',
        name: 'Users',
        icon: Users,
        description: 'Extracts user data',
        extractionMethod: 'Slack API - /users.list endpoint',
        tasks: [],
      },
    ],
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'google-calendar-001',
    name: 'Google Calendar',
    logo: {
      light: GoogleCalendarLight,
      dark: GoogleCalendarDark,
    },
    company: 'Google',
    companyLogo: '/assets/logos/google.png',
    home_url: 'https://calendar.google.com',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'whatsapp-001',
    name: 'WhatsApp',
    logo: {
      light: WhatsAppLight,
      dark: WhatsAppDark,
    },
    company: 'Meta',
    companyLogo: '/assets/logos/meta.png',
    home_url: 'https://web.whatsapp.com',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'facebook-001',
    name: 'Facebook',
    logo: {
      light: FacebookLight,
      dark: FacebookDark,
    },
    company: 'Meta',
    companyLogo: '/assets/logos/meta.png',
    home_url: 'https://www.facebook.com',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'medium-001',
    name: 'Medium',
    logo: {
      light: MediumLight,
      dark: MediumDark,
    },
    company: 'Medium',
    companyLogo: '/assets/logos/medium.png',
    home_url: 'https://medium.com',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'devpost-001',
    name: 'Devpost',
    logo: {
      light: DevpostLight,
      dark: DevpostDark,
    },
    company: 'Devpost',
    companyLogo: '/assets/logos/devpost.png',
    home_url: 'https://devpost.com',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'unsplash-001',
    name: 'Unsplash',
    logo: {
      light: UnsplashLight,
      dark: UnsplashDark,
    },
    company: 'Unsplash',
    companyLogo: '/assets/logos/unsplash.png',
    home_url: 'https://unsplash.com',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'discord-001',
    name: 'Discord',
    logo: {
      light: DiscordLight,
      dark: DiscordDark,
    },
    company: 'Discord',
    companyLogo: '/assets/logos/discord.png',
    home_url: 'https://discord.com',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'claude-001',
    name: 'Claude',
    logo: {
      light: ClaudeLight,
      dark: ClaudeDark,
    },
    company: 'Anthropic',
    companyLogo: '/assets/logos/claude.png',
    home_url: 'https://claude.ai',
    supportedOS: ['mac', 'windows', 'linux'],
  },
  {
    id: 'weather-001',
    name: 'Weather',
    description: 'Exports your current weather and forecast data.',
    logo: {
      light: WeatherLight,
      dark: WeatherDark,
    },
    company: 'Google',
    companyLogo: '/assets/logos/google.svg',
    home_url: 'https://www.google.com/search?q=my+current+weather',
    supportedOS: ['mac', 'windows', 'linux'],
    // steps: [
    //   { id: 'step-001', name: 'Go to Google', status: 'pending' },
    //   {
    //     id: 'step-002',
    //     name: 'Search for "my current weather"',
    //     status: 'pending',
    //   },
    //   {
    //     id: 'step-003',
    //     name: 'Wait for weather data to load',
    //     status: 'pending',
    //   },
    //   {
    //     id: 'step-004',
    //     name: 'Extract  forecast',
    //     status: 'pending',
    //   },
    //   { id: 'step-005', name: 'Exporting Data', status: 'pending' },
    // ],
  },
  {
    id: 'xTrending-001',
    name: 'X Trending',
    description: 'Exports trending topics from X (formerly Twitter).',
    logo: {
      light: XTrendingLight,
      dark: XTrendingDark,
    },
    company: 'X Corp',
    companyLogo: '/assets/logos/x.png',
    home_url: 'https://x.com/explore/tabs/keyword',
    supportedOS: ['mac', 'windows', 'linux'],
    // steps: [
    //   { id: 'step-001', name: 'Go to X', status: 'pending' },
    //   {
    //     id: 'step-002',
    //     name: 'Navigate to Explore',
    //     status: 'pending',
    //   },
    //   {
    //     id: 'step-003',
    //     name: 'Wait for trending topics',
    //     status: 'pending',
    //   },
    //   {
    //     id: 'step-004',
    //     name: 'Extract trending data',
    //     status: 'pending',
    //   },
    //   { id: 'step-005', name: 'Exporting Data', status: 'pending' },
    // ],
  },
  {
    id: 'news-001',
    name: 'News',
    description: 'Exports current top news headlines and stories.',
    logo: {
      light: NewsLight,
      dark: NewsDark,
    },
    company: 'Google',
    companyLogo: '/assets/logos/google.svg',
    home_url: 'https://www.google.com/search?q=news',
    supportedOS: ['mac', 'windows', 'linux'],
    // steps: [
    //   { id: 'step-001', name: 'Go to Google News', status: 'pending' },
    //   { id: 'step-002', name: 'Wait for page to load', status: 'pending' },
    //   { id: 'step-003', name: 'Extract top headlines', status: 'pending' },
    //   {
    //     id: 'step-004',
    //     name: 'Navigate through categories',
    //     status: 'pending',
    //   },
    //   { id: 'step-005', name: 'Extract category news', status: 'pending' },
    //   { id: 'step-006', name: 'Exporting Data', status: 'pending' },
    // ],
  },
];
