const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportGithub(id, platformId, company, name) {
  if (!window.location.href.includes('github.com')) {
    customConsoleLog(id, 'Navigating to GitHub');
    bigStepper(id, 'Navigating to GitHub');
    window.location.assign('https://github.com/');
  }
  await wait(2);

  if (window.location.href.includes('github.com') && !window.location.href.includes('tab=repositories')) {
  if (document.querySelector('a[href="/login"]')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    bigStepper(id, 'Export stopped, waiting for sign in');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const tabButton = await waitForElement(id,'button[aria-label="Open user navigation menu"]', 'User navigation menu');

  if (!tabButton) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    bigStepper(id, 'Export stopped, waiting for sign in');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(id, 'Clicking on User navigation menu');
  tabButton.click();

  await wait(2);
  const repoTab = await waitForElement(
    id,
    '#\\:rg\\:',
    'Repository link',
  );

  bigStepper(id, 'Clicking on Repositories');
  repoTab.click();
  customConsoleLog(id, 'Clicked on Repositories!');
  await wait(2);
  }

  if (window.location.href.includes('tab=repositories')) {
            const repos = [];
            while (true) {
              bigStepper(id, 'Getting repositories...');
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
        bigStepper(id, 'Exporting data');
        return repos;
  }


}

module.exports = exportGithub;