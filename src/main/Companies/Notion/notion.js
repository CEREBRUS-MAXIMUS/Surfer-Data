const { customConsoleLog } = require('../../preloadFunctions');


async function exportNotion() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const dropdown = document.getElementsByClassName(
    'notion-sidebar-switcher',
  )[0];

  customConsoleLog('we got the dropdown: ', dropdown);
  if (!dropdown) {
    customConsoleLog('user not connected');
    return 'Not connected';
  }

  dropdown.scrollIntoView({
    behavior: 'instant',
    block: 'center',
  });

  dropdown.click();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  let buttons = document.querySelectorAll('div[role="button"]');

  // First loop to handle clicking on the Settings button
  let foundSettings = false;
  for (const btn of buttons) {
    if (btn.textContent.includes('Settings') && btn.querySelector('svg')) {
      btn.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
      btn.click();
      customConsoleLog('got first settings');
      foundSettings = true;
      break; // Use break instead of return
    }
  }

  if (!foundSettings) {
    customConsoleLog('Settings button not found');
    return;
  }

  // Wait for the first loop to finish before starting the second loop
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const newButtons = document.querySelectorAll('div[role="button"]');
  // Second loop to handle logging the child divs
  foundSettings = false;
  for (const newBtn of newButtons) {
    const childDivs = newBtn.querySelectorAll('div');

    for (const childDiv of childDivs) {
      const grandchildDivs = childDiv.querySelectorAll('div');

      for (const grandchildDiv of grandchildDivs) {
        if (grandchildDiv.textContent.includes('Settings')) {
          grandchildDiv.scrollIntoView({
            behavior: 'instant',
            block: 'center',
          });
          customConsoleLog('got second settings');
          grandchildDiv.click();
          foundSettings = true;
          break; // Use break instead of return
        }
      }
      if (foundSettings) break; // Ensure outer loop also breaks
    }
    if (foundSettings) break; // Ensure outer loop also breaks
  }

  if (!foundSettings) {
    customConsoleLog('Second settings button not found');
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const newestButtons = document.querySelectorAll('div[role="button"]');
  let foundExport = false;
  for (const btn of newestButtons) {
    if (btn.textContent.includes('Export all workspace content')) {
      btn.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
      customConsoleLog('got export dialog');
      btn.click();
      foundExport = true;
      break; // Use break instead of return
    }
  }

  if (!foundExport) {
    customConsoleLog('Export all workspace content button not found');
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const finalButtons = document.querySelectorAll('div[role="button"]');
  let foundFinalExport = false;
  for (const btn of finalButtons) {
    if (btn.textContent === 'Export') {
      btn.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
      customConsoleLog('got export button, should be downloading file!');
      btn.click();
      foundFinalExport = true;
      break; // Use break instead of return
    }
  }

  if (!foundFinalExport) {
    customConsoleLog('Final Export button not found');
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
  return;
}

module.exports = exportNotion;
