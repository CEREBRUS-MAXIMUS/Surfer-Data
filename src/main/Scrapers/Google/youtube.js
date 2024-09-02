const { 
  customConsoleLog ,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportYoutube(id, company, name) {
if (!window.location.href.includes('youtube.com')) {
  window.location.assign('https://www.youtube.com/');
}


await wait(5);

if (document.querySelector('a[aria-label="Sign in"]')) {
  customConsoleLog(id, 'YOU NEED TO SIGN IN!');
  ipcRenderer.send('connect-website', company);
  return;
}
const videoData = [];

bigStepper(id, 'Waiting for Video elements');

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
    const channelElement = videoElement.querySelector(
      'a.yt-simple-endpoint.style-scope.yt-formatted-string[href^="/@"]',
    );
    const viewCountElement = videoElement.querySelector(
      'span.inline-metadata-item',
    );

    if (titleElement && channelElement && viewCountElement) {
      videoData.push({
        title: titleElement.textContent.trim(),
        channel: channelElement.textContent.trim(),
        viewCount: viewCountElement.textContent.trim(),
      });
    }
  }
} else {
  customConsoleLog(id, 'No video elements found');
}

customConsoleLog(id, 'Video data collected:', videoData.length);

// bigStepper(id);
return videoData;
}

module.exports = exportYoutube;


