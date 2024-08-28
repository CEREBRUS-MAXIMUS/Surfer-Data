if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}
const { contextBridge, ipcRenderer, BrowserWindow } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');
const { exportGmail } = require('./Scrapers/Google/gmail');

contextBridge.exposeInMainWorld('electron', {
  getExportSize: (exportPath) =>
    ipcRenderer.invoke('get-export-size', exportPath),
});

ipcRenderer.on(
  'export-website',
  async (event, company, name, runID, exportPath) => {
    customConsoleLog(runID, 'Exporting', name);

    switch (name) {
      case 'Gmail':
        await exportGmail(company, name, runID);
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
});
