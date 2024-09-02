const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportGithub(id, company, name) {
  if (!window.location.href.includes('github.com')) {
    customConsoleLog(id, 'Navigating to GitHub');
    window.location.assign('https://github.com/');
  }
  await wait(2);

  if (window.location.href.includes('github.com') && !window.location.href.includes('tab=repositories')) {
  if (document.querySelector('a[href="/login"]')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const tabButton = await waitForElement(id,'button[aria-label="Open user navigation menu"]', 'User navigation menu');

  if (!tabButton) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  // bigStepper(runID);
  tabButton.click();

  await wait(2);
  const repoTab = await waitForElement(
    id,
    '#\\:rg\\:',
    'Repository link',
  );

  // bigStepper(runID);
  repoTab.click();

  await wait(2);
  }

  if (window.location.href.includes('tab=repositories')) {
            const repos = [];
            while (true) {
              customConsoleLog(id, `Waiting for Repositories`);
              await wait(2);
              const repoLinks = await waitForElement(id, 'a[itemprop="name codeRepository"]', 'Repositories', true);
              customConsoleLog(id, 'Adding', repoLinks.length, 'repos!');
              for (const repoLink of repoLinks) {
                let desc = '';
                const siblingDiv =
                  repoLink.parentElement.parentElement.nextElementSibling;
                if (siblingDiv && siblingDiv.childNodes[1]) {
                  desc = siblingDiv.childNodes[1].innerText;
                }
                repos.push({
                  name: repoLink.innerText,
                  url: repoLink.href,
                  description: desc,
                });
              }
              await wait(5);
              const nextPageButton = await waitForElement(id, 'a.next_page', 'Next page button');
              if (!nextPageButton) {
                break;
              }
              nextPageButton.scrollIntoView({
                behavior: 'instant',
                block: 'center',
              });
              nextPageButton.click();
              await wait(2);
            }
        customConsoleLog(
            id,
          'GitHub export completed. Total repositories:',
          repos.length,
        );
        bigStepper(id);
        return repos;
  }


}

module.exports = exportGithub;