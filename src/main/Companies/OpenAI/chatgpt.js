const {
  customConsoleLog,
  waitForElement,
  wait,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportChatgpt(company, runID) {
  await wait(3);

    if (document.querySelector('button[data-testid="login-button"]')) {
        ipcRenderer.send('connect-website', company);
        return;
    }

  const dialogBox = await waitForElement('div[role="tablist"]', 'Dialog Box', true);

  if (!dialogBox) {
    ipcRenderer.send('connect-website', company);
    return;
  }

  customConsoleLog('Dialog Box found');

  const buttons = Array.from(document.querySelectorAll('button'));

  const exportBtn = buttons.find(button => button.innerText === 'Export');
  
  bigStepper(runID)
  exportBtn.click();

  const confirmExport = await waitForElement('.btn.relative.btn-primary', 'Confirm Export');

  bigStepper(runID)
  confirmExport.click();

    // TODO: automatically go to user's email and download the file

    // ipcRenderer.sendToHost('new-url', 'https://gmail.com')

    // ipcRenderer.on('new-url-success', (event, url) => {
    //     customConsoleLog('New URL:', url);
    //     // execute clicking the email + downloading!
    // });

}

module.exports = exportChatgpt;