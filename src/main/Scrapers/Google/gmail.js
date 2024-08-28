const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportGmail(company, name, runID) {
  const emails = [];
  let steps = [
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
        { selector: '#\\:3', name: 'Email container', label: 'Email content' },
        {
          selector: '.h0',
          name: 'Navigation buttons',
          label: 'Email navigation',
        },
      ],
      olderButtonLabel: 'Older',
      description: 'Collecting emails',
    },
    {
      status: 'pending',
      function: 'sendExport',
      description: 'Sending the export',
    },
  ];
  // console.log('this steps: ', steps);
  for (const step of steps) {
    bigStepper(runID);
    console.log('this step: ', step);
    switch (step.function) {
      case 'wait':
        const waitTime = Math.random() * 2 + 1; // Random float between 1 and 3
        customConsoleLog(runID, `Waiting for ${waitTime.toFixed(2)} seconds`);
        await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        customConsoleLog(runID, `Waited for ${waitTime.toFixed(2)} seconds`);
        break;

      case 'checkSignIn':
        if (document.querySelector(step.elements[0].selector)) {
          customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
          ipcRenderer.send('connect-website', company);
          return;
        }
        break;

      case 'waitForElement':
        const element = await waitForElement(
          runID,
          step.elements[0].selector,
          step.elements[0].name,
        );
        if (!element) {
          customConsoleLog(
            runID,
            `Element not found: ${step.elements[0].name}`,
          );
          return;
        }
        break;

      case 'click':
        const clickElement = document.querySelector(step.elements[0].selector);
        if (clickElement) {
          clickElement.click();
        } else {
          customConsoleLog(
            runID,
            `Click element not found: ${step.elements[0].name}`,
          );
        }
        break;

      case 'collectEmails':
        while (true) {
          const email = await waitForElement(
            runID,
            step.elements[0].selector,
            step.elements[0].name,
          );
          if (email) {
            emails.push(email.innerText || '');
          }

          const nextParent = await waitForElement(
            runID,
            step.elements[1].selector,
            step.elements[1].name,
          );
          if (!nextParent) {
            customConsoleLog(runID, 'Navigation buttons not found');
            break;
          }

          const childNodes = Array.from(nextParent.childNodes);
          const olderButton = childNodes.find(
            (node) =>
              node.getAttribute &&
              node.getAttribute('aria-label') === step.olderButtonLabel,
          );

          if (
            !olderButton ||
            olderButton.getAttribute('aria-disabled') === 'true'
          ) {
            customConsoleLog(runID, 'Reached the end of emails');
            break;
          }

          olderButton.click();
          await wait(2);
        }
        break;

      case 'sendExport':
        const uniqueEmails = [...new Set(emails)];
        customConsoleLog(
          runID,
          'Unique emails collected:',
          uniqueEmails.length,
        );
        ipcRenderer.send('handle-export', company, name, uniqueEmails, runID);
        break;

      default:
        customConsoleLog(runID, `Unknown action: ${step.function}`);
    }
  }
}

module.exports = { exportGmail };
