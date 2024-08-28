const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let userDataPath;

ipcRenderer.invoke('get-user-data-path').then((path) => {
  userDataPath = path;
});

async function checkIfEmailExists(emailContent) {
  if (!userDataPath) {
    console.error('User data path not available');
    return false;
  }

  const surferDataPath = path.join(userDataPath, 'surfer_data');
  const gmailPath = path.join(surferDataPath, 'Google', 'Gmail');

  // If the Gmail folder doesn't exist, no emails have been exported yet
  if (!fs.existsSync(gmailPath)) {
    return false;
  }

  // Get all items in the Gmail folder
  const items = fs.readdirSync(gmailPath);

  for (const item of items) {
    const itemPath = path.join(gmailPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // If it's a directory, check files inside
      const files = fs
        .readdirSync(itemPath)
        .filter((file) => file.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(itemPath, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Check if the email content exists in the file
        if (
          fileContent.content &&
          fileContent.content.some((email) => email.includes(emailContent))
        ) {
          return true;
        }
      }
    } else if (stats.isFile() && item.endsWith('.json')) {
      // If it's a JSON file, check its content
      const fileContent = JSON.parse(fs.readFileSync(itemPath, 'utf-8'));

      // Check if the email content exists in the file
      if (
        fileContent.content &&
        fileContent.content.some((email) => email.includes(emailContent))
      ) {
        return true;
      }
    }
  }

  return false;
}

async function exportTakeout(id) {
    await wait(4);
    const nextButton = await waitForElement(
      id,
      'button[aria-label="Next step"]',
      'Next Step',
    );
    nextButton.scrollIntoView();
    nextButton.click();

    await wait(2);

    const exportButton = await waitForElement(
      id,
      'span[jsname="V67aGc"].UywwFc-vQzf8d',
      'Export Button',
      true,
    );
    exportButton[1].scrollIntoView();
    exportButton[1].click();
    customConsoleLog(id, 'Clicked Export Button, going to gmail soon!');
    await wait(3);
    ipcRenderer.sendToHost('change-url', 'https://gmail.com', id); // later this will not be hardcoded
    return;
}

async function continueExportTakeout(id) {
  customConsoleLog(
    id,
    'Continuing export for Takeout, will take a few minutes to get download email!',
  );

  let emailFound = false;
  let refreshCounter = 0;

  const checkEmails = async () => {
    const emails = await waitForElement(
      id,
      "div.xS[role='link']",
      'Download Email',
      true,
    );
    for (const email of emails) {
      if (email.innerText.includes('Your Google data is ready to download')) {
        bigStepper(id);
        email.click();
        return true;
      }
    }
    return false;
  };

  while (!emailFound) {
    emailFound = await checkEmails();
    if (!emailFound) {
      await wait(1);
      refreshCounter++;
      
      if (refreshCounter >= 10) {
        const refreshButton = document.querySelector('div[role="button"][aria-label="Refresh"]');
        if (refreshButton) {
          // Simulate a click because Gmail is weird
          ['mousedown', 'click', 'mouseup'].forEach((eventType) => {
            var event = new MouseEvent(eventType, {
              view: window,
              bubbles: true,
              cancelable: true,
            });
            refreshButton.dispatchEvent(event);
          });
          customConsoleLog(id, 'Refreshing emails');
          await wait(1); // Wait for refresh to complete
        }
        refreshCounter = 0;
      }
    }
  }

  // Wait for the email to load
  await wait(2);

  let downloadBtns = [];
  while (downloadBtns.length === 0) {
    downloadBtns = await waitForElement(
      id,
      'a[href*="https://accounts.google.com/AccountChooser?continue=https://takeout.google.com"]',
      'Download button',
      true,
    );
    if (downloadBtns.length === 0) {
      await wait(1); // Wait for 1 second before checking again
    }
  }

  bigStepper(id);
  downloadBtns[downloadBtns.length - 1].click();

  customConsoleLog(
    id,
    'Download button clicked, will take a few minutes to download + convert!!!',
  );
}

async function exportGmail(company, name, runID, firstExport, steps) {
  const gmailPath = path.join(userDataPath, 'surfer_data', 'Google', 'Gmail');

if (!fs.existsSync(gmailPath)) {
  ipcRenderer.sendToHost(
    'change-url',
    'https://takeout.google.com/u/0/settings/takeout/custom/gmail', // HARDCODING THE FIRST ACCOUNT RN!
    runID,
  ); 

    customConsoleLog(
      runID,
      'This is the first export, will do google takeout here!',
    );
    return;
  }

  customConsoleLog(runID, 'Not first export, so updating emails!');

  let existingEmailFound = false;

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
        while (!existingEmailFound) {
          const emails = await waitForElement(
            runID,
            step.elements[0].selector,
            step.elements[0].name,
            true
          );
          if (emails) {
            for (const email of emails) {
document.querySelector('div[aria-label="Show details"]').click();
await wait(1)
const emailDetails = document.getElementsByClassName('ajv');

              const emailJSON = {
                from: Array.from(emailDetails).find(detail => detail.innerText.includes('from:'))?.innerText.split(':').slice(1).join(':').trim() || '',
                to: Array.from(emailDetails).find(detail => detail.innerText.includes('to:') && !detail.innerText.includes('reply-to:'))?.innerText.split(':').slice(1).join(':').trim() || '',
                subject: Array.from(emailDetails).find(detail => detail.innerText.includes('subject:'))?.innerText.split(':').slice(1).join(':').trim() || '',
                date: Array.from(emailDetails).find(detail => detail.innerText.includes('date:'))?.innerText.split(':').slice(1).join(':').trim() || '',
                body: email.innerText || '',
              }
              
              const emailExists = await checkIfEmailExists(JSON.stringify(emailJSON));
              if (emailExists) {
                existingEmailFound = true;
                break;
              }
                          ipcRenderer.send(
                            'handle-update',
                            company,
                            name,
                            JSON.stringify(emailJSON),
                            runID,
                          );
                          customConsoleLog(runID, 'New email sent for update');
            }
            // Send each new email immediately

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

      case 'sendUpdate':
        customConsoleLog(runID, 'Email collection completed');
        ipcRenderer.send('export-complete', company, name, runID);
        break;

      default:
        customConsoleLog(runID, `Unknown action: ${step.function}`);
    }
  }
}

module.exports = { exportGmail, continueExportTakeout, exportTakeout };
