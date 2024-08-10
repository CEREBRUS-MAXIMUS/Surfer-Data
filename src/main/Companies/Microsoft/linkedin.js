const { customConsoleLog } = require('../../preloadFunctions');

async function exportLinkedin() {
  await new Promise((resolve) => setTimeout(resolve, 7000));
  const profileButton = document.getElementsByClassName('ember-view block')[0];

  if (!profileButton) {
    customConsoleLog('user not connected');
    return 'Not connected';
  }

  profileButton.click();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const sections = document.querySelectorAll(
        "section[data-view-name='profile-card']",
      );
      const contactBtn = document.getElementById(
        'top-card-text-details-contact-info',
      );
      if (sections.length > 5 && contactBtn) {
        customConsoleLog('GOT SECTIONS + contact btn!');
        clearInterval(interval);
        const mainContent = document.querySelector('.scaffold-layout__main');
        if (mainContent) {
          contactBtn.click();

          // wait for this class to work for document.querySelector: pv-contact-info__contact-type
          let email = '';
          const waitForContactInfo = setInterval(() => {
            const contactInfoElements = document.getElementsByClassName(
              'pv-contact-info__contact-type',
            );
            if (contactInfoElements.length > 0) {
              clearInterval(waitForContactInfo);

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
                name: document.querySelector('h1')?.innerText || '',
                subheading:
                  document.querySelector('.text-body-medium.break-words')
                    ?.innerText || '',
                about: (
                  document
                    .querySelector(
                      "section[data-view-name='profile-card'] div#about",
                    )
                    ?.closest('section')?.innerText || ''
                ).replace(/^About\nAbout\n/, ''),
                profile_url: window.location.href,
                experience: (
                  document
                    .querySelector(
                      "section[data-view-name='profile-card'] div#experience",
                    )
                    ?.closest('section')?.innerText || ''
                ).replace(/^Experience\nExperience\n/, ''),
                email: email || '',
              };
              customConsoleLog('sending back profile data!');
              customConsoleLog('linkedin done!');
              resolve(profileData);
            }
          }, 100);
        }
      }
    }, 100);
  });
}

module.exports = exportLinkedin;
