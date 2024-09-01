const {  
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

(async () => {
console.log('YouTube opened');
console.log('sdfsdfgsdfgsfdg');
if (!window.location.href.includes('youtube.com')) {
  window.location.assign('https://www.youtube.com/');
}
await wait(5);

if (document.querySelector('a[aria-label="Sign in"]')) {
  console.log('YOU NEED TO SIGN IN!');
  ipcRenderer.send('connect-website', company);
  return;
}
const videoData = [];

// bigStepper(runID);

// Extract video information
console.log('Waiting for Video elements');
const videoElements = await waitForElement(
  'ytd-rich-grid-media',
  'Video elements',
  true,
);

if (videoElements && videoElements.length > 0) {
  console.log('Got Video elements');
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
  console.log('No video elements found');
}

console.log('Video data collected:', videoData.length);

// bigStepper(runID);
})();

