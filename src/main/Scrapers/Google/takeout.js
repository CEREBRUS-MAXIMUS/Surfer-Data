const { ipcRenderer } = require('electron');
const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const fs = require('fs');
const path = require('path');



async function checkIfEmailExists(id, emailContent) {
    const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  const gmailPath = path.join(
    userDataPath,
    'surfer_data',
    'Google',
    'Gmail',
    'gmail-001',
    'extracted',
    'emails.json',
  );
  if (!fs.existsSync(gmailPath)) {
    return false;
  }

    const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
   customConsoleLog('fileContent: ', fileContent);
    // Check if the email content exists in the file
    if (Array.isArray(fileContent)) {
      for (const email of fileContent) {
        if (email.subject === JSON.parse(emailContent).subject && email.timestamp.slice(0, -7) === JSON.parse(emailContent).timestamp.slice(0, -7)) {
          customConsoleLog('email exists: ', email);
          return true;
        }
      }
    }
  return false;

}


async function exportTakeout(id, platformId, filename, company, name) {
  const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  const gmailPath = path.join(
    userDataPath,
    'surfer_data',
    'Google',
    'Gmail',
    'gmail-001',
    'extracted',
    'emails.json',
  );

  if (
    !fs.existsSync(gmailPath) &&
    !window.location.href.includes('takeout.google.com') &&
    !window.location.href.includes('mail.google.com')
  ) {
    bigStepper(id, 'Going to Google Takeout');
    window.location.assign(
      'https://takeout.google.com/u/0/settings/takeout/custom/gmail',
    );
  }

  if (window.location.href.includes('takeout.google.com')) {
    customConsoleLog(id, 'Already on takeout, continuing to export!');

    customConsoleLog(
      id,
      'This is the first export, will do google takeout here!',
    );
    bigStepper(id, 'On takeout, clicking next');
    await wait(4);
    const nextButton = await waitForElement(
      id,
      'button[aria-label="Next step"]',
      'Next Step',
    );

    if (!nextButton) {
      customConsoleLog(id, 'YOU NEED TO SIGN IN!');
      bigStepper(id, 'Export stopped, waiting for sign in');
      ipcRenderer.send('connect-website', id);
      return 'CONNECT_WEBSITE';
    }

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
    bigStepper(id, 'Clicked Export Button, going to gmail soon!');
    await wait(3);

    window.location.assign('https://mail.google.com/mail/u/0/#inbox');
  }

  if (window.location.href.includes('mail.google.com')) {
    customConsoleLog(id, 'Already on gmail, continuing to export!');
    bigStepper(id, 'On gmail, checking for takeout email');
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
          bigStepper(id, 'Clicked takeout email');
          email.click();
          return 'DOWNLOADING';
        }
      }
      return 'NOTHING';
    };

    while (!emailFound) {
      emailFound = await checkEmails();
      if (!emailFound) {
        await wait(1);
        refreshCounter++;

        if (refreshCounter >= 10) {
          const refreshButton = document.querySelector(
            'div[role="button"][aria-label="Refresh"]',
          );
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

    bigStepper(id, 'Clicked download button');
    downloadBtns[downloadBtns.length - 1].click();

    customConsoleLog(
      id,
      'Download button clicked, will take a few minutes to download + convert!!!',
    );
    
    bigStepper(id, 'Downloading emails, will take a few minutes!');
  }

}

module.exports = exportTakeout;