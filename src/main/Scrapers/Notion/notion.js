const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportNotion(company, runID) {
  await wait(5);
  if (document.querySelector('input[aria-label="Enter your email address..."]')) {
    ipcRenderer.send('connect-website', company);
    return;
  }
  const dropdown = await waitForElement(runID, '.notion-sidebar-switcher', 'Dropdown');

  if (!dropdown) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(runID);
  dropdown.scrollIntoView({ behavior: 'instant', block: 'center' });
  dropdown.click();
  await wait(5);

  // First Settings button
  const settingsButton = await waitForElement(runID, 'div[role="button"]', 'First settings button', true);
  let foundSettings = false;
  if (settingsButton) {
    for (const btn of settingsButton) {
      if (btn.textContent.includes('Settings') && btn.querySelector('svg')) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        bigStepper(runID);
        btn.click();
        foundSettings = true;
        break;
      }
    }
  }
        await wait(4);
  // Second Settings button
  const newButtons = await waitForElement(runID, 'div[role="button"]', 'Second settings button', true);
  foundSettings = false;
  if (newButtons) {
    for (const newBtn of newButtons) {
      const childDivs = newBtn.querySelectorAll('div');
      for (const childDiv of childDivs) {
        const grandchildDivs = childDiv.querySelectorAll('div');
        for (const grandchildDiv of grandchildDivs) {
          if (grandchildDiv.textContent === 'Settings') {
            grandchildDiv.scrollIntoView({ behavior: 'instant', block: 'center' });
            bigStepper(runID);
            grandchildDiv.click();
            await wait(2);
            foundSettings = true;
            break;
          }
        }
        if (foundSettings) break;
      }
      if (foundSettings) break;
    }
  }

  // Export all workspace content button
  const exportButton = await waitForElement(runID, 'div[role="button"]', 'Export all workspace content button', true);
  let foundExport = false;
  if (exportButton) {
    for (const btn of exportButton) {
      if (btn.textContent.includes('Export all workspace content')) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        bigStepper(runID);
        btn.click();
        foundExport = true;
        await wait(2);
        break;
      }
    }
  }

  // Final Export button
  const finalExportButton = await waitForElement(runID, 'div[role="button"]', 'Final Export button', true);
  let foundFinalExport = false;
  if (finalExportButton) {
    for (const btn of finalExportButton) {
      if (btn.textContent === 'Export') {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        bigStepper(runID);
        btn.click();
        await wait(2);  
        foundFinalExport = true;
        break;
      }
    }
  }
}

module.exports = exportNotion;