if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { contextBridge, ipcRenderer, BrowserWindow } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');
const exportNotion = require('./Scrapers/Notion/notion');
const {
  exportGithub,
  continueExportGithub,
} = require('./Scrapers/Microsoft/github');
const exportLinkedin = require('./Scrapers/Microsoft/linkedin');
const exportTwitter = require('./Scrapers/X Corp/twitter');

const electronHandler = require('./preloadElectron');
const exportGmail = require('./Scrapers/Google/gmail');
const exportYouTube = require('./Scrapers/Google/youtube');
const { exportChatgpt, continueExportChatgpt } = require('./Scrapers/OpenAI/chatgpt');
contextBridge.exposeInMainWorld('electron', electronHandler);

ipcRenderer.on('export-website', async (event, company, name, runID) => {
  customConsoleLog('company: ', company);
  customConsoleLog('name: ', name);
  customConsoleLog('runID: ', runID);
  switch (name) {
    case 'Notion':
      await exportNotion(company, runID);
      break;
    case 'GitHub':
      await exportGithub(company, name, runID);
      break;
    case 'LinkedIn':
      await exportLinkedin(company, name, runID);
      break;
    case 'Twitter':
      await exportTwitter(company, name, runID);
      break;
    case 'Gmail':
      await exportGmail(company, name, runID);
      break;
    case 'YouTube':
      await exportYouTube(company, name, runID);
      break;
    case 'ChatGPT':
      await exportChatgpt(company, runID);
      break;
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
})
