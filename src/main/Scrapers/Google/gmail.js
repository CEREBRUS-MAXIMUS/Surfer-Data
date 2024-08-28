const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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

async function exportGmail(company, name, runID, steps) {
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
          const email = await waitForElement(
            runID,
            step.elements[0].selector,
            step.elements[0].name,
          );
          if (email) {
            const emailContent = email.innerText || '';
            const emailExists = await checkIfEmailExists(emailContent);
            if (emailExists) {
              existingEmailFound = true;
              break;
            }
            // Send each new email immediately
            ipcRenderer.send(
              'handle-update',
              company,
              name,
              emailContent,
              runID,
            );
            customConsoleLog(runID, 'New email sent for update');
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

module.exports = { exportGmail };
