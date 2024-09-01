if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { contextBridge, ipcRenderer, BrowserWindow } = require('electron');
// const exportNotion = require('./Scrapers/Notion/notion');
// const {
//   exportGithub,
//   continueExportGithub,
// } = require('./Scrapers/Microsoft/github');
// const exportLinkedin = require('./Scrapers/Microsoft/linkedin');
// const exportTwitter = require('./Scrapers/X Corp/twitter');
// const exportXTrending = require('./Scrapers/X Corp/trending');
// const electronHandler = require('./preloadElectron');
// const exportGmail = require('./Scrapers/Google/gmail');
// const exportYouTube = require('./Scrapers/Google/youtube');
// const exportGoogleWeather = require('./Scrapers/Google/weather');
// const exportNews = require('./Scrapers/Google/news');
// const {
//   exportChatgpt,
//   continueExportChatgpt,
// } = require('./Scrapers/OpenAI/chatgpt');
const { customConsoleLog } = require('./preloadFunctions');
contextBridge.exposeInMainWorld('electron', {
  getExportSize: (exportPath) => ipcRenderer.invoke('get-export-size', exportPath),
});

ipcRenderer.on('export-website', async (event, company, name, runID) => {
  customConsoleLog(runID, 'Exporting: ', name);

  const fs = require('fs');
  const path = require('path');

  const scrapersDir = path.join(__dirname, 'Scrapers');
  const files = fs.readdirSync(scrapersDir, { recursive: true });

  const jsFiles = files.filter(file => file.endsWith('.js')); 
  const matchingFile = jsFiles.find(file => {
    const fileName = path.basename(file, '.js');
    return fileName.toLowerCase() === name.toLowerCase();
  });

  if (matchingFile) { 
    customConsoleLog(runID, 'Matching file:', matchingFile);
    const exportModule = require(path.join(scrapersDir, matchingFile));
    customConsoleLog(runID, 'exportModule', JSON.stringify(exportModule));

    try { 
      customConsoleLog(runID, 'Exporting module!'); 
      if (typeof exportModule === 'function') {
        await exportModule(company, name, runID);
      } else if (typeof exportModule === 'object' && exportModule !== null) {
        const exportFunction = exportModule[name] || exportModule.default;
        if (typeof exportFunction === 'function') {
          await exportFunction(company, name, runID);
        } else {
          throw new Error(`No valid export function found for ${name}`);
        }
      } else {
        throw new Error(`Invalid module export for ${name}`);
      }
      customConsoleLog(runID, `Export completed for ${company}/${name}`);
    } catch (error) {
      customConsoleLog(runID, `Error during export of ${company}/${name}:`, error);
    }

  } else {
    customConsoleLog(runID, `Error: No matching scraper found for ${company}/${name}`);
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

// (async () => {
//   if (window.location.href.includes('?tab=repositories')) {
//     await continueExportGithub();
//   }
// })();

// ipcRenderer.on('change-url-success', async (event, url, id) => {
//   if (id.includes('chatgpt-001')) {
//     await continueExportChatgpt(id);
//   }
// });
