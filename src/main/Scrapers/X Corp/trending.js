const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportXTrending(company, name, runID) {
  await wait(2);
  if (document.querySelector('h1').innerText === 'Sign in to X') {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  await wait(2);
  bigStepper(runID);

  const trendingItems = [];
  const trendingDivs = document.querySelectorAll('div[data-testid="trend"]');

  trendingDivs.forEach((div) => {
    const item = {};

    // Extract rank
    const rankElement = div.querySelector('div[dir="ltr"][aria-hidden="true"]');
    if (rankElement) {
      item.rank = rankElement.textContent.trim();
    }

    // Extract category
    const categoryElement = div.querySelector(
      'div[dir="ltr"].r-n6v787.r-1cwl3u0.r-16dba41',
    );
    if (categoryElement) {
      item.category = categoryElement.textContent.trim();
    }

    // Extract trend name
    const nameElement = div.querySelector('div[dir="ltr"].r-b88u0q.r-1bymd8e');
    if (nameElement) {
      item.name = nameElement.textContent.trim();
    }

    // Extract post count or related topics
    const infoElement = div.querySelector(
      'div[dir="ltr"].r-8akbws, div[dir="ltr"].r-14gqq1x',
    );
    if (infoElement) {
      item.info = infoElement.textContent.trim();
    }

    trendingItems.push(item);
  });

  customConsoleLog(runID, 'Trending items collected:', trendingItems.length);

  bigStepper(runID);
  ipcRenderer.send('handle-export', company, name, trendingItems, runID);
}

module.exports = exportXTrending;
