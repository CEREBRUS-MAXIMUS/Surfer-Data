if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { contextBridge, ipcRenderer, BrowserWindow } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');
const { platforms } = require('../renderer/platforms');
const electronHandler = require('./preloadElectron');

// Generic export function
async function genericExport(company, name, runID, exportPath) {
  const platform = platforms.find(p => p.name === name);
  if (platform && platform.exportFunction) {
    await platform.exportFunction(company, name, runID);
  } else {
    console.error(`Export function not found for ${name}`); 
  } 
}

ipcRenderer.on('export-website', async (event, url, company, name, runID, exportPath) => {
  customConsoleLog(runID, 'Exporting', name);
  await genericExport(company, name, runID, exportPath);
  if (exportPath) {
    ipcRenderer.send('export-complete', company, name, runID, exportPath);
  }
});

(async () => {
  if (window.location.href.includes('?tab=repositories')) {
    await continueExportGithub();
  }
})();

ipcRenderer.on('change-url-success', async (event, url, id) => {
  if (id.includes('chatgpt-001')) {
    await continueExportChatgpt(id);
  }
});
