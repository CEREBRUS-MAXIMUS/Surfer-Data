const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function checkIfEmailExists(id, email) {
  // finish this function later when we have takeout
}

async function exportGmail(id, platformId, filename, company, name) {
  if (!window.location.href.includes('mail.google.com')) {
    customConsoleLog(id, 'Navigating to Gmail');
    bigStepper(id, 'Navigating to Gmail');
    window.location.assign('https://mail.google.com/');
  }
  await wait(2);

  if (document.querySelector('h1')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    bigStepper(id, 'Export stopped, waiting for sign in');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const emails = []; // will add JSON structure later + handle multiple emails in same thread!
  bigStepper(id, 'Getting first email');
  const mailLink = await waitForElement(id, "div.xS[role='link']", 'Mail link');
  if (!mailLink) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    bigStepper(id, 'Export stopped, waiting for sign in');
    ipcRenderer.send('connect-website', company);
    return;
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

      const emailExists = await checkIfEmailExists(id, emailJSON);
      if (!emailExists) {
        emails.push(emailJSON);
      } else {
        return;
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

  bigStepper(id, 'Exporting data');

  return uniqueEmails;
}

module.exports = exportGmail;