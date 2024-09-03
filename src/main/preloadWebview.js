if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { ipcRenderer } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');


ipcRenderer.on('export-website', async (event, runID, platformId, company, name, dailyExport) => {
  const scraper = require(`./Scrapers/${company}/${name}.js`);

    const data = await scraper(runID, platformId, company, name);
    if (data) {
    ipcRenderer.send('handle-export', runID, platformId, company, name, data, dailyExport);
    customConsoleLog(runID, 'Got data, need to export now');
  } else {
    customConsoleLog(runID, 'No data, might be going to next step, downloading file, or might be an error');
  }
});