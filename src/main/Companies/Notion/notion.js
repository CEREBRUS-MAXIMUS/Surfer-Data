const { customConsoleLog, waitForElement, wait } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportNotion(company) {
    await wait(2);
  const dropdown = await waitForElement('.notion-sidebar-switcher', 'Dropdown');

  if (!dropdown) {
    ipcRenderer.send('connect-website', company);
    return;
  }

  dropdown.scrollIntoView({ behavior: 'instant', block: 'center' });
  dropdown.click();
  await wait(2);
  // First Settings button
  const settingsButton = await waitForElement('div[role="button"]', 'First settings button', true);
  let foundSettings = false;
  if (settingsButton) {
    for (const btn of settingsButton) {
      if (btn.textContent.includes('Settings') && btn.querySelector('svg')) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        btn.click();
        await wait(2);
        foundSettings = true;
        break;
      }
    }
  }

  // Second Settings button
  const newButtons = await waitForElement('div[role="button"]', 'Second settings button', true);
  foundSettings = false;
  if (newButtons) {
    for (const newBtn of newButtons) {
      const childDivs = newBtn.querySelectorAll('div');
      for (const childDiv of childDivs) {
        const grandchildDivs = childDiv.querySelectorAll('div');
        for (const grandchildDiv of grandchildDivs) {
          if (grandchildDiv.textContent.includes('Settings')) {
            grandchildDiv.scrollIntoView({ behavior: 'instant', block: 'center' });
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
  const exportButton = await waitForElement('div[role="button"]', 'Export all workspace content button', true);
  let foundExport = false;
  if (exportButton) {
    for (const btn of exportButton) {
      if (btn.textContent.includes('Export all workspace content')) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        btn.click();
        foundExport = true;
        await wait(2);
        break;
      }
    }
  }

  // Final Export button
  const finalExportButton = await waitForElement('div[role="button"]', 'Final Export button', true);
  let foundFinalExport = false;
  if (finalExportButton) {
    for (const btn of finalExportButton) {
      if (btn.textContent === 'Export') {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        btn.click();
        await wait(2);  
        foundFinalExport = true;
        break;
      }
    }
  }
}

module.exports = exportNotion;