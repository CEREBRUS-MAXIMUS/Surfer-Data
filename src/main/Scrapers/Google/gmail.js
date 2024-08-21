const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportGmail(company, name, runID) {
  await wait(2);
  if (document.querySelector('h1')) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const emails = []; // will add JSON structure later + handle multiple emails in same thread!

  const mailLink = await waitForElement(runID, "div.xS[role='link']", 'Mail link');
  if (!mailLink) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(runID);
  mailLink.click();
  await wait(2);

  bigStepper(runID);
  while (true) {
    const email = await waitForElement(runID, '#\\:3', 'Current email content');
    if (email) {
      emails.push(email.innerText || '');
    }

    const nextParent = await waitForElement(runID, '.h0', 'Next email button');
    if (!nextParent) {
      customConsoleLog(runID, 'Navigation buttons not found');
      break;
    }

    const childNodes = Array.from(nextParent.childNodes);
    const olderButton = childNodes.find(
      (node) =>
        node.getAttribute && node.getAttribute('aria-label') === 'Older',
    );

    if (!olderButton || olderButton.getAttribute('aria-disabled') === 'true') {
      customConsoleLog(runID, 'Reached the end of emails');
      break;
    }

    olderButton.click();
    await wait(2);
  }
  const uniqueEmails = [...new Set(emails)];
  customConsoleLog(runID, 'Unique emails collected:', uniqueEmails.length);

  bigStepper(runID);
  ipcRenderer.send('handle-export', company, name, uniqueEmails, runID);

  return;
}

module.exports = exportGmail;
