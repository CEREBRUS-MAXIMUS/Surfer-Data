import { Mail } from 'lucide-react';
import GmailLight from '../components/assets/platforms/GmailLight';
import GmailDark from '../components/assets/platforms/GmailDark';
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
    supportedOS: ['mac', 'windows', 'linux'],
    steps: [
      {
        status: 'pending',
        function: 'wait',
        description: 'Waiting for the page to load',
      },
      {
        status: 'pending',
        function: 'checkSignIn',
        elementSelector: 'h1',
        description: 'Checking if the user is signed in',
      },
      {
        status: 'pending',
        function: 'waitForElement',
        elementSelector: "div.xS[role='link']",
        elementName: 'Mail link',
        description: 'Waiting for mail link to appear',
      },
      {
        status: 'pending',
        function: 'click',
        elementSelector: "div.xS[role='link']",
        description: 'Clicking on the mail link',
      },
      {
        status: 'pending',
        function: 'wait',
        description: 'Waiting for the mail page to load',
      },
      {
        status: 'pending',
        function: 'collectEmails',
        elementSelector: '#\\:3',
        elementName: 'Email container',
        description: 'Collecting emails',
      },
      {
        status: 'pending',
        function: 'sendExport',
        description: 'Sending the export',
      },
    ],
  },
];
