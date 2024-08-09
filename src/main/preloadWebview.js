if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { contextBridge, ipcRenderer, BrowserWindow } = require('electron');
const TurndownService = require('./turndown');
const removeCSSAndScriptsFromHTML = require('./preloadFunctions')
const exportNotion = require('./Companies/Notion/notion');
const {
  exportGithub,
  continueExportGithub,
} = require('./Companies/Microsoft/github');
const exportLinkedin = require('./Companies/Microsoft/linkedin');
const exportTwitter = require('./Companies/X Corp/twitter');

const electronHandler = require('./preloadElectron');
const exportGmail = require('./Companies/Google/gmail');

contextBridge.exposeInMainWorld('electron', electronHandler);

const turndown = new TurndownService();

ipcRenderer.on('export-website', async (event, company, name, runID) => {
  console.log('company: ', company);
  console.log('name: ', name);
  console.log('runID: ', runID);
  console.log("EXPORT WEBSITE CALLED!!!!!")
  switch (name) {
    case 'Notion':
      const notionRes = await exportNotion();
      if (notionRes) {
        console.log('SENDING CONNECT WEBSITE!')
        ipcRenderer.send('connect-website', company)
      }
      break;
    case 'GitHub':
      const githubRes = await exportGithub();
      if (githubRes) {
        ipcRenderer.send('connect-website', company);
      }
      break;
    case 'LinkedIn':
      let profile = await exportLinkedin();

      if (profile === 'Not connected') {
        ipcRenderer.send('connect-website', company);
      } else {
        profile = turndown.turndown(removeCSSAndScriptsFromHTML(profile))
        ipcRenderer.send('handle-export', company, name, profile, runID)
      }
      break;
    case 'Twitter':
      const tweetArray = await exportTwitter();

      if (tweetArray === 'Not connected') {
        ipcRenderer.send('connect-website', company);
      } else {
        ipcRenderer.send('handle-export', company, name, tweetArray, runID);
      }
      break;
    case 'Gmail':
      const emails = await exportGmail()

      if (emails === 'Not connected') {
        ipcRenderer.send('connect-website', company)
      }

      else {
        ipcRenderer.send('handle-export', company, name, emails, runID)
      }
      break;
  }
});

(async () => {
  if (window.location.href.includes('?tab=repositories')) {
    console.log('tryna get run id and shit!!')
    ipcRenderer.sendToHost('get-run-id');
    ipcRenderer.on('got-run-id', async (event, id) => {  
      console.log('got run id! ', id)
      const repos = await continueExportGithub();
      ipcRenderer.send('handle-export', 'Microsoft', 'GitHub', repos, id);
    });

  }
})();
