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
const exportXTrending = require('./Scrapers/X Corp/trending');
const electronHandler = require('./preloadElectron');
const exportGmail = require('./Scrapers/Google/gmail');
const exportYouTube = require('./Scrapers/Google/youtube');
const exportGoogleWeather = require('./Scrapers/Google/weather');
const exportNews = require('./Scrapers/Google/news');
const {
  exportChatgpt,
  continueExportChatgpt,
} = require('./Scrapers/OpenAI/chatgpt');
contextBridge.exposeInMainWorld('electron', {
  getExportSize: (exportPath) => ipcRenderer.invoke('get-export-size', exportPath),
});

ipcRenderer.on('export-website', async (event, company, name, runID) => {
  customConsoleLog(runID, 'Exporting', name);

  const fs = require('fs');
  const path = require('path');

  const scrapersDir = path.join(__dirname, 'Scrapers');
  const files = fs.readdirSync(scrapersDir, { recursive: true });

  const jsFiles = files.filter(file => file.endsWith('.js'));
  const matchingFile = jsFiles.find(file => {
    const fileName = path.basename(file, '.js').toLowerCase();
    return fileName === name.toLowerCase();
  });

  if (matchingFile) {
    const exportFunction = require(path.join(scrapersDir, matchingFile));
    if (typeof exportFunction === 'function') {
      await exportFunction(company, name, runID);
    } else {
      customConsoleLog(runID, `Error: ${matchingFile} does not export a function`);
    }
  } else {
    customConsoleLog(runID, `Error: No matching scraper found for ${name}`);
  }
});



// ipcRenderer.on('export-website', async (event, company, name, runID, exportPath) => {
//   customConsoleLog(runID, 'Exporting', name);

//   switch (name) {
//     case 'Notion':
//       await exportNotion(company, runID);
//       break;
//     case 'GitHub':
//       await exportGithub(company, name, runID);
//       break;
//     case 'LinkedIn':
//       await exportLinkedin(company, name, runID);
//       break;
//     case 'Twitter':
//       await exportTwitter(company, name, runID);
//       break;
//     case 'Gmail':
//       await exportGmail(company, name, runID);
//       break;
//     case 'YouTube':
//       await exportYouTube(company, name, runID);
//       break;
//     case 'ChatGPT':
//       await exportChatgpt(company, runID);
//       break;
//     case 'Weather':
//       await exportGoogleWeather(company, name, runID);
//       break;
//     case 'X Trending':
//       await exportXTrending(company, name, runID);
//       break;
//     case 'News':
//       await exportNews(company, name, runID);
//       break;
//   }

//   if (exportPath) {
//     ipcRenderer.send('export-complete', company, name, runID, exportPath);
//   }
// });

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
