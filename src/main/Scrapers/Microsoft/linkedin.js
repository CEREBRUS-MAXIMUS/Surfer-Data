const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');



async function exportLinkedin(company, name, runID) {
  await wait(2);

  if (document.querySelector('input[aria-label="Email or phone"]')) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const profileButton = await waitForElement(
    runID,
    'img[alt*="Photo of"]',
    'Profile Button',
  );
  
  if (!profileButton) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  bigStepper(runID);
  profileButton.click();

  await wait(2);
  
  const contactBtn = await waitForElement(runID, '#top-card-text-details-contact-info', 'Contact Info Button');
  
  if (!contactBtn) {
    customConsoleLog(runID, 'Contact button not found');
    return;
  }
  bigStepper(runID);
  contactBtn.click();

  await wait(2);

  const contactInfoElement = await waitForElement(runID, '.pv-contact-info__contact-type', 'Contact Info Card');

  if (!contactInfoElement) {
    customConsoleLog(runID, 'Contact info not found');
    return;
  }
  
  return new Promise(async (resolve) => {
    const sections = await waitForElement(runID, "section[data-view-name='profile-card']", 'Profile Card Sections', true);
    const contactBtn = await waitForElement(runID, '#top-card-text-details-contact-info', 'Contact Button');
    if (sections && sections.length > 5 && contactBtn) {
      const mainContent = await waitForElement(runID, '.scaffold-layout__main', 'Main Content');
      
      if (mainContent) {
        bigStepper(runID);
        contactBtn.click();

        await wait(2);

        customConsoleLog(runID, 'Waiting for Contact Info');
        const contactInfoElements = await waitForElement(runID, '.pv-contact-info__contact-type', 'Contact Info Elements', true);

        if (contactInfoElements) {
          customConsoleLog(runID, 'Trying to get contact info (if any)');
          let email = '';
          // Loop through each element
          Array.from(contactInfoElements).forEach((element) => {
            // Check for anchor tags to get links
            const links = element.getElementsByTagName('a');
            if (links.length > 0) {
              Array.from(links).forEach((link) => {
                if (link.href.includes('mailto:')) {
                  email = link.href.replace('mailto:', '');
                  customConsoleLog(runID, 'got email: ', email);
                }
              });
            }
          });

          const profileData = {
            name: (await waitForElement(runID, 'h1', 'Name'))?.innerText || '',
            subheading: (await waitForElement(runID, '.text-body-medium.break-words', 'Subheading'))?.innerText || '',
            about: (
              (await waitForElement(runID, "section[data-view-name='profile-card'] div#about", 'About Section'))
                ?.closest('section')?.innerText || ''
            ).replace(/^About\nAbout\n/, ''),
            profile_url: window.location.href,
            experience: (
              (await waitForElement(runID, "section[data-view-name='profile-card'] div#experience", 'Experience Section'))
                ?.closest('section')?.innerText || ''
            ).replace(/^Experience\nExperience\n/, ''),
            email: email || '',
          };

          customConsoleLog(runID, 'sending back profile data!');
          customConsoleLog(runID, 'linkedin done!');
          bigStepper(runID);
          // Send profile data directly to ipcRenderer
          ipcRenderer.send('handle-export', company, name, JSON.stringify(profileData, null, 2), runID);
          resolve(); // Resolve the promise after sending data
        }
      }
    } else {
      customConsoleLog(runID, 'Required elements not found');
      resolve(); // Resolve the promise if elements are not found
    }
  });
}

module.exports = exportLinkedin;