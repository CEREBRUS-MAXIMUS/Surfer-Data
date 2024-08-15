const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportNews(company, name, runID) {
  await wait(2);

  customConsoleLog('Querying for news container');
  const newsContainer = await waitForElement('.aUSklf', 'News container');

  if (!newsContainer) {
    customConsoleLog('News container not found');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(runID);
  customConsoleLog('News container found, extracting news items');

  const newsItems = document.querySelectorAll('.MkXWrd');
  const extractedData = [];

  bigStepper(runID);
  customConsoleLog('Starting news extraction');

  for (const item of newsItems) {
    await wait(0.5);

    const titleElement = item.querySelector('.n0jPhd');
    const sourceElement = item.querySelector('.MgUUmf span');
    const timeElement = item.querySelector('.OSrXXb span');
    const linkElement = item.querySelector('a.WlydOe');

    if (titleElement && sourceElement && timeElement && linkElement) {
      const newsItem = {
        title: titleElement.textContent.trim(),
        source: sourceElement.textContent.trim(),
        time: timeElement.textContent.trim(),
        link: linkElement.href,
      };
      extractedData.push(newsItem);
    }
  }

  if (extractedData.length === 0) {
    customConsoleLog('No news items were collected');
    return;
  }

  customConsoleLog(`Extracted ${extractedData.length} news items`);
  bigStepper(runID);
  ipcRenderer.send('handle-export', company, name, extractedData, runID);
}

module.exports = exportNews;
