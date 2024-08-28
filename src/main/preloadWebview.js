if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}
const { contextBridge, ipcRenderer, BrowserWindow } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');
const { exportGmail, continueExportTakeout, exportTakeout } = require('./Scrapers/Google/gmail');

contextBridge.exposeInMainWorld('electron', {
  getExportSize: (exportPath) =>
    ipcRenderer.invoke('get-export-size', exportPath),
});

ipcRenderer.on(
  'export-website',
  async (event, company, name, runID, firstExport, steps, exportPath) => {
    customConsoleLog(runID, 'Exporting', name);
    console.log('this steps: ', steps);
    switch (name) {
      case 'Gmail':
        await exportGmail(company, name, runID, firstExport, steps);
        break;
    }

    if (exportPath) {
      ipcRenderer.send('export-complete', company, name, runID, exportPath);
    }
  },
);

(async () => {
  if (window.location.href.includes('?tab=repositories')) {
    await continueExportGithub();
  }
})();

ipcRenderer.on('change-url-success', async (event, url, id) => {
  if (id.includes('chatgpt-001')) {
    await continueExportChatgpt(id);
  }

  if (id.includes('takeout-001')) {
    await continueExportTakeout(id);
  }

  if (id.includes('gmail-001')) {
    if (url.includes('takeout.google.com')) {
      await exportTakeout(id);
    }

    else {
      await continueExportTakeout(id);
    }

  }
});
