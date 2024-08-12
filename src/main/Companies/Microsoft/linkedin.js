const { customConsoleLog, waitForElement, wait } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');



async function exportLinkedin(company, name, runID) {
  await wait(2);
  const profileButton = await waitForElement('.ember-view.block', 'Profile Button');

  if (!profileButton) {
    customConsoleLog('user not connected');
    ipcRenderer.send('connect-website', company);
    return;
  }

  profileButton.click();

  await wait(2);
  
  const contactBtn = await waitForElement('#top-card-text-details-contact-info', 'Contact Info Button');
  
  if (!contactBtn) {
    customConsoleLog('Contact button not found');
    return;
  }

  contactBtn.click();

  await wait(2);

  const contactInfoElement = await waitForElement('.pv-contact-info__contact-type', 'Contact Info Card');

  if (!contactInfoElement) {
    customConsoleLog('Contact info not found');
    return;
  }

  return new Promise(async (resolve) => {
    const sections = await waitForElement("section[data-view-name='profile-card']", 'Profile Card Sections', true);
    const contactBtn = await waitForElement('#top-card-text-details-contact-info', 'Contact Button');
    if (sections && sections.length > 5 && contactBtn) {
      const mainContent = await waitForElement('.scaffold-layout__main', 'Main Content');
      
      if (mainContent) {
        contactBtn.click();

        await wait(2);

        const contactInfoElements = await waitForElement('.pv-contact-info__contact-type', 'Contact Info Elements', true);

        if (contactInfoElements) {
          let email = '';
          // Loop through each element
          Array.from(contactInfoElements).forEach((element) => {
            // Check for anchor tags to get links
            const links = element.getElementsByTagName('a');
            if (links.length > 0) {
              Array.from(links).forEach((link) => {
                if (link.href.includes('mailto:')) {
                  email = link.href.replace('mailto:', '');
                  customConsoleLog('got email: ', email);
                }
              });
            }
          });

          const profileData = {
            name: (await waitForElement('h1', 'Name'))?.innerText || '',
            subheading: (await waitForElement('.text-body-medium.break-words', 'Subheading'))?.innerText || '',
            about: (
              (await waitForElement("section[data-view-name='profile-card'] div#about", 'About Section'))
                ?.closest('section')?.innerText || ''
            ).replace(/^About\nAbout\n/, ''),
            profile_url: window.location.href,
            experience: (
              (await waitForElement("section[data-view-name='profile-card'] div#experience", 'Experience Section'))
                ?.closest('section')?.innerText || ''
            ).replace(/^Experience\nExperience\n/, ''),
            email: email || '',
          };

          customConsoleLog('sending back profile data!');
          customConsoleLog('linkedin done!');
          
          // Send profile data directly to ipcRenderer
          ipcRenderer.send('handle-export', company, name, JSON.stringify(profileData, null, 2), runID);
          resolve(); // Resolve the promise after sending data
        }
      }
    } else {
      customConsoleLog('Required elements not found');
      resolve(); // Resolve the promise if elements are not found
    }
  });
}

module.exports = exportLinkedin;