const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportYouTube(company, name, runID) {
  await wait(5);
  if (document.querySelector('a[aria-label="Sign in"]')) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  const videoData = [];

  bigStepper(runID);

  // Extract video information
  const videoElements = await waitForElement(
    runID,  
    'ytd-rich-grid-media',
    'Video elements',
    true,
  );

  if (videoElements && videoElements.length > 0) {
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

  bigStepper(runID);
  ipcRenderer.send('handle-export', company, name, videoData, runID);

  return;
}

module.exports = exportYouTube;
