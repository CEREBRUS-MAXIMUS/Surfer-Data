async function exportGithub() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // Add your GitHub export logic here
  const tabButton = document.querySelectorAll(
    '[aria-label="Open user navigation menu"]',
  )[0];

  if (!tabButton) {
    console.log('user not connected');
    return "Not connected"
    
    // send msg here that user needs to SIGN IN first!
   
  }

  tabButton.click();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const links = Array.from(document.querySelectorAll('a'));
  const repoTab = links.filter((link) =>
    link.href.includes('tab=repositories'),
  )[0];

  if (!repoTab) {
    console.log('Repository tab not found');
    return;
  }

  repoTab.click();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return;
}

async function continueExportGithub() {

  console.log('CONTINUE GITHUB!!!!');

  const repos = [];

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const repoLinks = document.querySelectorAll(
      'a[itemprop="name codeRepository"]',
    );
    console.log('these repo links!!! ', repoLinks);

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

    const nextPageButton = document.querySelector('a.next_page');
    if (!nextPageButton) {
      break; // Exit the loop if there's no next page button
    }
    nextPageButton.scrollIntoView({
      behavior: 'instant',
      block: 'center',
    });
    nextPageButton.click();
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Assuming ipcRenderer is available in this context
  

  console.log('GitHub export completed. Total repositories:', repos.length);

  return repos;

}

module.exports = { exportGithub, continueExportGithub };
