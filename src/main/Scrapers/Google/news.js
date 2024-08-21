const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportNews(company, name, runID) {
  await wait(2);

  customConsoleLog(runID, 'Querying for news container');
  const newsContainer = await waitForElement(runID, '.aUSKl', 'News container');

  if (!newsContainer) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(runID);
  customConsoleLog(runID, 'News container found, extracting news items');

  const newsItems = document.querySelectorAll('.MkXWrd');
  const extractedData = [];

  bigStepper(runID);
  customConsoleLog(runID, 'Starting news extraction');

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
    customConsoleLog(runID, 'No news items were collected');
    return;
  }

  customConsoleLog(runID, `Extracted ${extractedData.length} news items`);
  bigStepper(runID);
  ipcRenderer.send('handle-export', company, name, extractedData, runID);
}

module.exports = exportNews;
