const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportGithub(company, name, runID) {
  await wait(2);
  if (document.querySelector('a[href="/login"]')) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const tabButton = await waitForElement(runID, 'button[aria-label="Open user navigation menu"]', 'User navigation menu');

  if (!tabButton) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(runID);
  tabButton.click();

  await wait(2);
  const repoTab = await waitForElement(
    runID,
    '#\\:rg\\:',
    'Repository link',
  );

  bigStepper(runID);
  repoTab.click();

  await wait(2);

  return;
}

async function continueExportGithub() {
      ipcRenderer.sendToHost('get-run-id');
      ipcRenderer.on('got-run-id', async (event, id) => {
        bigStepper(id);
        customConsoleLog(id, 'Continuing GitHub export!');
        
        const repos = [];

        while (true) {
          await wait(2);
          const repoLinks = await waitForElement(id, 'a[itemprop="name codeRepository"]', 'Repositories', true);
          customConsoleLog(id, 'Adding ', repoLinks.length, ' repos!');
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
    ipcRenderer.send('handle-export', 'Microsoft', 'GitHub', repos, id);
    return;
  });
}

module.exports = { exportGithub, continueExportGithub };
