if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { ipcRenderer } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');


ipcRenderer.on('export-website', async (event, company, name, runID, dailyExport) => {
  const scraper = require(`./Scrapers/${company}/${name}.js`);

    const data = await scraper(runID, company, name);
    if (data) {
    ipcRenderer.send('handle-export', company, name, data, runID);
    customConsoleLog(runID, 'Got data, need to export now');
  } else {
    customConsoleLog(runID, 'No data, might be going to next step, downloading file, or might be an error');
  }
});