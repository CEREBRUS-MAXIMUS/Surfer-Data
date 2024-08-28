import GmailLight from '../renderer/components/assets/platforms/GmailLight';
import GmailDark from '../renderer/components/assets/platforms/GmailDark';

export const platforms = [
  {
    id: 'gmail-001',
    name: 'Gmail',
    description: 'Exports all new emails.',
    logo: {
      light: GmailLight,
      dark: GmailDark,
    },
    company: 'Google',
    companyLogo: '/assets/logos/google.svg',
    home_url: 'https://mail.google.com',
    firstExport: false,
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
        elements: [
          { selector: 'h1', name: 'Sign-in header', label: 'Sign-in check' },
        ],
        description: 'Checking if the user is signed in',
      },
      {
        status: 'pending',
        function: 'waitForElement',
        elements: [
          {
            selector: "div.xS[role='link']",
            name: 'Mail link',
            label: 'Mail link',
          },
        ],
        description: 'Waiting for mail link to appear',
      },
      {
        status: 'pending',
        function: 'click',
        elements: [
          {
            selector: "div.xS[role='link']",
            name: 'Mail link',
            label: 'Mail link',
          },
        ],
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
        elements: [
          {
            selector: '#\\:3',
            name: 'Email container',
            label: 'Email content',
          },
          {
            selector: '.h0',
            name: 'Navigation buttons',
            label: 'Email navigation',
          },
        ],
        olderButtonLabel: 'Older',
        description: 'Collecting new emails',
      },
      {
        status: 'pending',
        function: 'sendUpdate',
        description: 'Sending the update',
      }, 
    ],
  } 
];
