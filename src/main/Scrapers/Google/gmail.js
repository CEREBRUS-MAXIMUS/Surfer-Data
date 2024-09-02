const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportGmail(id, company, name) {
    if (!window.location.href.includes('mail.google.com')) {
      window.location.assign('https://mail.google.com/');
    }
  await wait(2);

  if (document.querySelector('h1')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const emails = []; // will add JSON structure later + handle multiple emails in same thread!

  const mailLink = await waitForElement(id, "div.xS[role='link']", 'Mail link');
  if (!mailLink) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(id);
  mailLink.click();
  await wait(2);

  bigStepper(id);
  while (true) {
    const email = await waitForElement(id, '#\\:3', 'Current email content');
    if (email) {
      emails.push(email.innerText || '');
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

  bigStepper(id);
  return uniqueEmails;
}

module.exports = exportGmail;
