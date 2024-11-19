if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { ipcRenderer } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');


ipcRenderer.on('export-platform', async (event, runID, platformId, filename, company, name, isUpdated) => {
  const platform = require(`./platforms/${company}/${filename}.js`);

    const data = await platform(runID, platformId, filename, company, name);
    console.log('data', data);

  if (data === 'CONNECT_WEBSITE') {
    console.log('CONNECT_WEBSITE');
  }

  else if (data === 'NOTHING') {
    console.log('NOTHING')
  }

  else if (data === 'DOWNLOADING') {
    customConsoleLog(runID, 'Downloading export (will take some time!');
  }

  else if (data === 'HANDLE_UPDATE_COMPLETE') {
    customConsoleLog(runID, 'Finishing updating data!');
  }

  else if (data) {
    ipcRenderer.send(
      'handle-export',
      runID,
      platformId,
      filename,
      company,
      name,
      data,
      isUpdated,
    );
    customConsoleLog(runID, 'Got data, need to export now');
  }

  else {
 console.log(
   runID,
   "Something might've gone wrong (click the Eye icon to view the run)",
 );
  }
});