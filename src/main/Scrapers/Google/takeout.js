const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');


async function exportTakeout(company, name, runID) {
  await wait(2);

  // ADD SIGN IN CHECK LATER!

  const deselectAll = await waitForElement(
    runID,
    'button[aria-label="Deselect all"]',
    'Deselect All',
  );

  deselectAll.click();

  await wait(2);

  const checkMail = await waitForElement(
    runID,
    'input[aria-label="Select Mail"]',
    'Select Mail',
  );
  checkMail.scrollIntoView();

  checkMail.click();

  await wait(2);

  const nextButton = await waitForElement(
    runID,
    'button[aria-label="Next step"]',
    'Next Step',
  );
  nextButton.scrollIntoView();
  nextButton.click();

  await wait(2);

  const exportButton = await waitForElement(
    runID,
    'span[jsname="V67aGc"].UywwFc-vQzf8d',
    'Export Button',
    true,
  );
  exportButton[1].scrollIntoView();
  exportButton[1].click();
  customConsoleLog(runID, 'Clicked Export Button, going to gmail soon!');
  await wait(3);
  ipcRenderer.sendToHost('change-url', 'https://gmail.com', runID); // later this will not be hardcoded
}

async function continueExportTakeout(id) {
  customConsoleLog(id, 'Continuing export for Takeout, will take a few minutes to get download email!');

  let emailFound = false;
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
        emailFound = true;
        break;
      }
    }
  };

  while (!emailFound) {
    await checkEmails();
    if (!emailFound) {
      await wait(1); // Wait for 1 second before checking again
    }
  }

  // Wait for the email to load
  await wait(2);

  // Wait for the email to load
  await wait(2);

  let downloadBtns = [];
  while (downloadBtns.length === 0) {
    downloadBtns = await waitForElement(
      id,
      'a[href*="https://accounts.google.com/AccountChooser?continue=https://takeout.google.com/settings/takeout/download?"]',
      'Download button',
      true,
    );
    if (downloadBtns.length === 0) {
      await wait(1); // Wait for 1 second before checking again
    }
  }

  bigStepper(id);
  downloadBtns[downloadBtns.length - 1].click();

  customConsoleLog(id, 'Download button clicked, will take a few minutes to download + convert!!!');
}

module.exports = { exportTakeout, continueExportTakeout };
