const { 
  customConsoleLog ,
  wait,
  waitForElement,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportYoutube(id, platformId, filename, company, name) {
  if (!window.location.href.includes('youtube.com')) {
    customConsoleLog(id, 'Navigating to YouTube');
    window.location.assign('https://www.youtube.com/');
  }

  await wait(10);

  if (document.querySelector('a[aria-label="Sign in"]')) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN (click the eye in the top right)!');
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }
  const videoData = [];

  // Extract video information
  customConsoleLog(id, 'Waiting for Video elements');
  const videoElements = await waitForElement(
    id,
    'ytd-rich-grid-media',
    'Video elements',
    true,
  );

  if (videoElements && videoElements.length > 0) {
    customConsoleLog(id, 'Got Video elements');
    for (const videoElement of videoElements) {
      const titleElement = videoElement.querySelector(
        'yt-formatted-string#video-title',
      );

      const linkElement = videoElement.querySelector(
        '#video-title-link'
      )
      const channelElement = videoElement.querySelector(
        'a.yt-simple-endpoint.style-scope.yt-formatted-string[href^="/@"]',
      );
      const viewCountElement = videoElement.querySelector(
        'span.inline-metadata-item',
      );

      if (titleElement && channelElement && viewCountElement) {
        videoData.push({
          title: titleElement.textContent.trim(),
          url: linkElement.href,
          channel: channelElement.textContent.trim(),
          viewCount: viewCountElement.textContent.trim(),
        });
      }
    }
  } else {
    customConsoleLog(id, 'No video elements found');
  }

  customConsoleLog(id, 'Video data collected:', videoData.length);

  return videoData;
}

module.exports = exportYoutube;


