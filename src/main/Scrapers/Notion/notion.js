const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportNotion(id, company, name) {
  if (!window.location.href.includes('notion.so')) {
    bigStepper(id, 'Navigating to Notion');
  customConsoleLog(id, 'Navigating to Notion');
    window.location.assign('https://notion.so/');
  }
  await wait(5);
  if (document.querySelector('input[aria-label="Enter your email address..."]')) {
    bigStepper(id, 'Export stopped, waiting for sign in');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const dropdown = await waitForElement(id, '.notion-sidebar-switcher', 'Dropdown');

  if (!dropdown) {
    bigStepper(id, 'Export stopped, waiting for sign in');
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(id, 'Clicking on Notion');
  dropdown.scrollIntoView({ behavior: 'instant', block: 'center' });
  dropdown.click();
  await wait(5);

  // First Settings button
  bigStepper(id, 'Waiting for First settings button');
  const settingsButton = await waitForElement(id, 'div[role="button"]', 'First settings button', true);
  let foundSettings = false;
  if (settingsButton) {
    customConsoleLog(id, 'Got first settings button');
    for (const btn of settingsButton) {
      if (btn.textContent.includes('Settings') && btn.querySelector('svg')) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        bigStepper(id, 'Clicking on First settings button');
        btn.click();
        foundSettings = true;
        break;
      }
    }
  }
        await wait(4);
  // Second Settings button
  bigStepper(id, 'Waiting for Second settings button');
  const newButtons = await waitForElement(id, 'div[role="button"]', 'Second settings button', true);
  foundSettings = false;
  if (newButtons) {
    for (const newBtn of newButtons) {
      const childDivs = newBtn.querySelectorAll('div');
      for (const childDiv of childDivs) {
        const grandchildDivs = childDiv.querySelectorAll('div');
        for (const grandchildDiv of grandchildDivs) {
          if (grandchildDiv.textContent === 'Settings') {
            customConsoleLog(id, 'Got second settings button');
            grandchildDiv.scrollIntoView({ behavior: 'instant', block: 'center' });
            bigStepper(id, 'Clicking on Second settings button');
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
  bigStepper(id, 'Waiting for Export all workspace content button');
  const exportButton = await waitForElement(id, 'div[role="button"]', 'Export all workspace content button', true);
  let foundExport = false;
  if (exportButton) {
    for (const btn of exportButton) {
      if (btn.textContent.includes('Export all workspace content')) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        bigStepper(id, 'Clicking on Export all workspace content button');
        customConsoleLog(id, 'Got export all workspace content button');
        btn.click();
        foundExport = true;
        await wait(2);
        break;
      }
    }
  }

  // Final Export button
  bigStepper(id, 'Waiting for Final Export button');
  const finalExportButton = await waitForElement(id, 'div[role="button"]', 'Final Export button', true);
  let foundFinalExport = false;
  if (finalExportButton) {
    for (const btn of finalExportButton) {
      if (btn.textContent === 'Export') {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        bigStepper(id, 'Downloading data');
        customConsoleLog(id, 'Got final export button');
        btn.click();
        await wait(2);  
        foundFinalExport = true;
        break;
      }
    }
  }
}

module.exports = exportNotion;