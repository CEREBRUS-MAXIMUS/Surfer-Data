const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function checkIfEmailExists(id, platformId, company, name, emailContent) {
  const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  const gmailPath = path.join(
    userDataPath,
    'surfer_data',
    company,
    name,
    platformId,
    'extracted',
    `${platformId}.json`
  );

  console.log('gmailPath: ', gmailPath);

  if (fs.existsSync(gmailPath)) {
    const fileContent = JSON.parse(fs.readFileSync(gmailPath, 'utf-8'));
    // Check if the email content exists in the file
    console.log('fileContent: ', fileContent);
    console.log('emailContent: ', emailContent);
      for (const email of fileContent.content) {
        if (
          email.subject === emailContent.subject &&
          email.timestamp.slice(0, -7) ===
            emailContent.timestamp.slice(0, -7)
        ) {
          customConsoleLog('email exists: ', email);
          return true;
        }
      }
  }
  return false;
}

async function exportGmail(id, platformId, filename, company, name) {
  const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  const gmailPath = path.join(
    userDataPath,
    'surfer_data',
    company,
    name,
    platformId,
    'extracted',
    `${platformId}.json`,
  );

  if (!fs.existsSync(gmailPath)) {
    customConsoleLog(id, 'First export, doing Google Takeout here!')

    if (!window.location.href.includes('takeout.google.com') && !window.location.href.includes('mail.google.com')) {
      bigStepper(id, 'Going to Google Takeout');
      window.location.assign(
        'https://takeout.google.com/u/0/settings/takeout/custom/gmail',
      );
    }

  if (window.location.href.includes('takeout.google.com')) {

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



else {

  customConsoleLog(id, 'Not first export, getting current emails!');

  if (
    !window.location.href.includes('mail.google.com') &&
    !window.location.href.includes('gmail')
  ) {
    console.log('this window location href: ', window.location.href);
    customConsoleLog(id, 'Navigating to Gmail');
    bigStepper(id, 'Navigating to Gmail');
    window.location.assign('https://mail.google.com/');
  }
  customConsoleLog(id, 'Waiting for page to load');
  await wait(2);

  if (document.querySelector('h1')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    bigStepper(id, 'Export stopped, waiting for sign in');
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }
  const emails = []; // will add JSON structure later + handle multiple emails in same thread!
  bigStepper(id, 'Getting first email');
  const mailLink = await waitForElement(id, "div.xS[role='link']", 'Mail link');
  if (!mailLink) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    bigStepper(id, 'Export stopped, waiting for sign in');
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }

  bigStepper(id, 'Clicking first email');
  mailLink.click();
  await wait(2);

  bigStepper(id, 'Getting emails...');
  while (true) {
    const email = await waitForElement(id, '#\\:3', 'Current email content');
    if (email) {
      document.querySelector('div[aria-label="Show details"]').click();
      await wait(1);
      const emailDetails = document.getElementsByClassName('ajv');

      const emailJSON = {
        accountID: new URL(window.location.href).pathname.split('/')[3] || '0',
        from:
          Array.from(emailDetails)
            .find((detail) => detail.innerText.includes('from:'))
            ?.innerText.split(':')
            .slice(1)
            .join(':')
            .trim() || '',
        to:
          Array.from(emailDetails)
            .find(
              (detail) =>
                detail.innerText.includes('to:') &&
                !detail.innerText.includes('reply-to:'),
            )
            ?.innerText.split(':')
            .slice(1)
            .join(':')
            .trim() || '',
        subject:
          Array.from(emailDetails)
            .find((detail) => detail.innerText.includes('subject:'))
            ?.innerText.split(':')
            .slice(1)
            .join(':')
            .trim() || '',
        timestamp:
          new Date(
            Array.from(emailDetails)
              .find((detail) => detail.innerText.includes('date:'))
              ?.innerText.split(':')
              .slice(1)
              .join(':')
              .trim(),
          ).toISOString() || null,
        body: email.innerText || '',
      };

      const emailExists = await checkIfEmailExists(id, platformId, company, name, emailJSON);
      if (emailExists) {
        customConsoleLog(id, 'Email already exists, skipping');
        ipcRenderer.send('handle-update-complete', id, platformId, company, name, gmailPath);
        return 'HANDLE_UPDATE_COMPLETE';
      } else {
            ipcRenderer.send(
              'handle-update',
              company,
              name,
              platformId,
              JSON.stringify(emailJSON),
              id,
              gmailPath
            );
            emails.push(emailJSON);
      }
    }

    const nextParent = await waitForElement(id, '.h0', 'Next email button');
    if (!nextParent) {
      customConsoleLog(id, 'Navigation buttons not found');
      break;
    }

    const childNodes = Array.from(nextParent.childNodes);
    const olderButton = childNodes.find(
      (node) =>
        node.getAttribute && node.getAttribute('aria-label') === 'Older',
    );

    if (!olderButton || olderButton.getAttribute('aria-disabled') === 'true') {
      customConsoleLog(id, 'Reached the end of emails');
      break;
    }

    olderButton.click();
    await wait(2);
  }
  const uniqueEmails = [...new Set(emails)];
  customConsoleLog(id, 'Unique emails collected:', uniqueEmails.length);

        ipcRenderer.send(
          'handle-update-complete',
          id,
          platformId,
          company,
          name,
          gmailPath,
        );
        return 'HANDLE_UPDATE_COMPLETE';
}
}

module.exports = exportGmail;