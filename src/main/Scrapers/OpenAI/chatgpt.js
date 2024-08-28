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
      customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
        ipcRenderer.send('connect-website', company);
        return;
    }

      customConsoleLog(runID, `Waiting for Dialog Box`);

  const dialogBox = await waitForElement(runID, 'div[role="tablist"]', 'Dialog Box', true);

  if (!dialogBox) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  customConsoleLog('Dialog Box found');

  const buttons = Array.from(document.querySelectorAll('button'));

  const exportBtn = buttons.find(button => button.innerText === 'Export');
  
  bigStepper(runID)
  exportBtn.click();

  const confirmExport = await waitForElement(runID, '.btn.relative.btn-primary', 'Confirm Export');

  bigStepper(runID)
  confirmExport.click();

    // TODO: automatically go to user's email and download the file
    await wait(3)
  bigStepper(runID)
  ipcRenderer.sendToHost('change-url', 'https://gmail.com', runID) // later this will not be hardcoded
}

async function continueExportChatgpt(id){
    // Check for the email every second
  if (document.querySelector('h1')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
      const checkEmails = async () => {
        const emails = await waitForElement(id, "div.xS[role='link']", 'Download Email', true);
        customConsoleLog(id, `Waiting for email from OpenAI`);
        for (const email of emails) {
          if (email.innerText.includes('ChatGPT - Your data export is ready')) {
            bigStepper(id)
            email.click();
            return true; // Return true if the email is found
          }
        }
        return false; // Return false if the email is not found
      };

      let emailFound = false;
      let refreshCounter = 0;
      while (!emailFound) {
        emailFound = await checkEmails(); 
        if (!emailFound) {
          await wait(1);
          refreshCounter++;
          
          if (refreshCounter >= 5) {
            const refreshButton = document.querySelector('div[role="button"][aria-label="Refresh"]');
            if (refreshButton) {

              // had to simulate a click because gmail is weird
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
        customConsoleLog(id, `Waiting for Download button`);
        downloadBtns = await waitForElement(
          id,
          'a[href*="https://proddatamgmtqueue.blob.core.windows.net/exportcontainer/"]',
          'Download button',
          true
        );
        if (downloadBtns.length === 0) {
          await wait(1); // Wait for 1 second before checking again
        }
      }
      customConsoleLog(id, 'Download button found, clicking it!');
      bigStepper(id)
      downloadBtns[downloadBtns.length - 1].click();
  
}

module.exports = { exportChatgpt, continueExportChatgpt };