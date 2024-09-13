const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs')
const path = require('path')

async function checkIfRepoExists(id, platformId, company, name, currentRepo) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const filePath = path.join(
    userData,
    'surfer_data',
    company,
    name,
    platformId,
    `${platformId}.json`,
  );
  console.log(id, `Checking if file exists at ${filePath}`);
  const fileExists = await fs.existsSync(filePath);
  if (fileExists) {
    console.log(id, `File exists, reading file`);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim() === '') {
        console.log(id, 'File is empty');
        return false;
      }
      const repos = JSON.parse(fileContent);
      console.log(id, 'Repos: ', repos);
      if (repos && repos.content && Array.isArray(repos.content)) {
        for (const repo of repos.content) {
          if (
            repo.name === currentRepo.name &&
            repo.url === currentRepo.url &&
            repo.description === currentRepo.description
          ) {
            console.log(id, 'Repo already exists, skipping');
            return true;
          }
        }
      } else {
        console.log(id, 'Invalid or empty repos structure');
      }
    } catch (error) {
      console.error(id, `Error reading or parsing file: ${error.message}`);
    }
  }

  return false;
}

async function exportGithub(id, platformId, filename, company, name) {
  if (!window.location.href.includes('github.com')) {
    customConsoleLog(id, 'Navigating to GitHub');
    bigStepper(id, 'Navigating to GitHub');
    window.location.assign('https://github.com/');
  }
  await wait(2);

  if (
    window.location.href.includes('github.com') &&
    !window.location.href.includes('tab=repositories')
  ) {
    if (document.querySelector('a[href="/login"]')) {
      customConsoleLog(id, 'YOU NEED TO SIGN IN (click the eye in the top right)!');
      bigStepper(id, 'Export stopped, waiting for sign in');
      ipcRenderer.send('connect-website', id);
      return 'CONNECT_WEBSITE';
    }
    const tabButton = await waitForElement(
      id,
      'button[aria-label="Open user navigation menu"]',
      'User navigation menu',
    );

    if (!tabButton) {
      customConsoleLog(id, 'YOU NEED TO SIGN IN (click the eye in the top right)!');
      bigStepper(id, 'Export stopped, waiting for sign in');
      ipcRenderer.send('connect-website', id);
      return 'CONNECT_WEBSITE';
    }

    bigStepper(id, 'Clicking on User navigation menu');
    tabButton.click();

    await wait(2);
    const repoTab = await waitForElement(id, '#\\:rg\\:', 'Repository link');

    bigStepper(id, 'Clicking on Repositories');
    repoTab.click();
    customConsoleLog(id, 'Clicked on Repositories!');
    await wait(2);
  }

  if (window.location.href.includes('tab=repositories')) {
    const repos = [];
    bigStepper(id, 'Getting repositories...');
    customConsoleLog(id, 'Starting repository collection');

    while (true) {
      const repoLinks = await waitForElement(
        id,
        'a[itemprop="name codeRepository"]',
        'Repositories',
        true,
      );
      customConsoleLog(id, `Found ${repoLinks.length} repositories on the page`);

      for (const repoLink of repoLinks) {
        let desc = '';
        const siblingDiv = repoLink.parentElement.parentElement.nextElementSibling;
        if (siblingDiv && siblingDiv.childNodes[1]) {
          desc = siblingDiv.childNodes[1].innerText;
        }

        const jsonRepo = {
          name: repoLink.innerText,
          url: repoLink.href,
          description: desc,
        };

        const repoExists = await checkIfRepoExists(id, platformId, company, name, jsonRepo);

        if (repoExists) {
          customConsoleLog(id, 'Repo already exists, skipping');
            ipcRenderer.send(
              'handle-update-complete',
              id,
              platformId,
              company,
              name,
            );
          return 'HANDLE_UPDATE_COMPLETE';
        }

        else {
                    ipcRenderer.send(
                      'handle-update',
                      company,
                      name,
                      platformId,
                      JSON.stringify(jsonRepo),
                      id,
                    );
                    repos.push(jsonRepo);
        }



      }

      const nextPageButton = await waitForElement(
        id,
        'a.next_page',
        'Next page button',
      );
      if (!nextPageButton) {
        break;
      }
      nextPageButton.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
      nextPageButton.click();
      await wait(5);
    }

    customConsoleLog(id, `Exporting ${repos.length} repositories`);
    bigStepper(id, 'Exporting data');
    ipcRenderer.send(
      'handle-update-complete',
      id,
      platformId,
      company,
      name,
    );
    return 'HANDLE_UPDATE_COMPLETE';
  }
}

module.exports = exportGithub;