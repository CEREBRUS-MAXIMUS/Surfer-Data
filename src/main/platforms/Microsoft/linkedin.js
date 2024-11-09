const { customConsoleLog, waitForElement, wait, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');



async function exportLinkedin(id, platformId, filename, company, name) {
  if (!window.location.href.includes('linkedin.com')) {
    bigStepper(id, 'Navigating to LinkedIn');
    customConsoleLog(id, 'Navigating to LinkedIn');
    window.location.assign('https://linkedin.com/');
  }
  await wait(2);

  if (document.querySelector('input[aria-label="Email or phone"]')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN (click the eye in the top right)!');
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }
  const profileButton = await waitForElement(
    id,
    'img[alt*="Photo of"]',
    'Profile Button',
  );

  if (!profileButton) {
    bigStepper(id, 'Export stopped, waiting for sign in');
    customConsoleLog(id, 'YOU NEED TO SIGN IN (click the eye in the top right)!');
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }
  bigStepper(id, 'Clicking on Profile Button');
  profileButton.click();

  await wait(2);

  const contactBtn = await waitForElement(
    id,
    '#top-card-text-details-contact-info',
    'Contact Info Button',
  );

  if (!contactBtn) {
    customConsoleLog(id, 'Contact button not found');
    return 'NOTHING';
  }
  bigStepper(id, 'Clicking on Contact Button');
  contactBtn.click();

  await wait(2);

  const contactInfoElement = await waitForElement(
    id,
    '.pv-contact-info__contact-type',
    'Contact Info Card',
  );

  if (!contactInfoElement) {
    customConsoleLog(id, 'Contact info not found');
    return 'NOTHING';
  }

  return new Promise(async (resolve) => {
    const sections = await waitForElement(
      id,
      "section[data-view-name='profile-card']",
      'Profile Card Sections',
      true,
    );
    const contactBtn = await waitForElement(
      id,
      '#top-card-text-details-contact-info',
      'Contact Button',
    );
    if (sections && sections.length > 5 && contactBtn) {
      const mainContent = await waitForElement(
        id,
        '.scaffold-layout__main',
        'Main Content',
      );

      if (mainContent) {
        bigStepper(id, 'Clicking on Contact Button');
        contactBtn.click();

        await wait(2);

        customConsoleLog(id, 'Waiting for Contact Info');
        const contactInfoElements = await waitForElement(
          id,
          '.pv-contact-info__contact-type',
          'Contact Info Elements',
          true,
        );

        if (contactInfoElements) {
          customConsoleLog(id, 'Trying to get contact info (if any)');
          let email = '';
          // Loop through each element
          Array.from(contactInfoElements).forEach((element) => {
            // Check for anchor tags to get links
            const links = element.getElementsByTagName('a');
            if (links.length > 0) {
              Array.from(links).forEach((link) => {
                if (link.href.includes('mailto:')) {
                  email = link.href.replace('mailto:', '');
                  customConsoleLog(id, 'got email: ', email);
                }
              });
            }
          });

          const profileData = {
            name: (await waitForElement(id, 'h1', 'Name'))?.innerText || '',
            subheading:
              (
                await waitForElement(
                  id,
                  '.text-body-medium.break-words',
                  'Subheading',
                )
              )?.innerText || '',
            about: (
              (
                await waitForElement(
                  id,
                  "section[data-view-name='profile-card'] div#about",
                  'About Section',
                )
              )?.closest('section')?.innerText || ''
            ).replace(/^About\nAbout\n/, ''),
            profile_url: window.location.href,
            experience: (
              (
                await waitForElement(
                  id,
                  "section[data-view-name='profile-card'] div#experience",
                  'Experience Section',
                )
              )?.closest('section')?.innerText || ''
            ).replace(/^Experience\nExperience\n/, ''),
            email: email || '',
          };

          customConsoleLog(id, 'sending back profile data!');
          customConsoleLog(id, 'linkedin done!');
          bigStepper(id, 'Exporting data');
          resolve(profileData);
        }
      }
    } else {
      customConsoleLog(id, 'Required elements not found');
      resolve(null);
    }
  });
}

module.exports = exportLinkedin;