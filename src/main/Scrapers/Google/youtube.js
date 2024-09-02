const { 
  customConsoleLog ,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportYoutube(runID, company, name) {
customConsoleLog(runID, 'YouTube opened');

if (!window.location.href.includes('youtube.com')) {
  window.location.assign('https://www.youtube.com/');
}
await wait(5);

if (document.querySelector('a[aria-label="Sign in"]')) {
  customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
  ipcRenderer.send('connect-website', company);
  return;
}
const videoData = [];

bigStepper(runID, 'Waiting for Video elements');

// Extract video information
customConsoleLog(runID, 'Waiting for Video elements');
const videoElements = await waitForElement(
  'ytd-rich-grid-media',
  'Video elements',
  true,
);

if (videoElements && videoElements.length > 0) {
  customConsoleLog(runID, 'Got Video elements');
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
  customConsoleLog(runID, 'No video elements found');
}

customConsoleLog(runID, 'Video data collected:', videoData.length);

// bigStepper(runID);
return videoData;
}

module.exports = exportYoutube;


