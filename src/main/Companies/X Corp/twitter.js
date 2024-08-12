const { customConsoleLog, wait, waitForElement } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportTwitter(company, name, runID) {
  await wait(5)
  customConsoleLog('Querying for profile pictures');
  const profilePics = await waitForElement(
    'img[alt]:not([alt=""]):not([alt="Image"])',
    'Your profile picture',
    true
  );

  customConsoleLog('this pfp\'s', profilePics);

  if (!profilePics) {
    customConsoleLog('User not connected: Less than 2 profile pictures found');
    ipcRenderer.send('connect-website', company);
    return;
  }

  profilePics[1].click();
  await wait(2);

  const tweetSet = new Set();
  let lastProcessedTweet = null;
  let noNewTweetsCount = 0;
  const scrollArray = ['start', 'center', 'end', 'nearest'];

  customConsoleLog('Starting tweet collection');
  while (noNewTweetsCount < 3) {
    const tweets = await waitForElement('article[data-testid="tweet"]', 'Tweets', true);
    customConsoleLog(`Found ${tweets.length} tweets on the page`);

    if (tweets.length === 0) {
      customConsoleLog('No tweets found, waiting 2 seconds before retry');
      await wait(2);
      noNewTweetsCount++;
      continue;
    }

    customConsoleLog('Processing new tweets');
    const initialSize = tweetSet.size;
    tweets.forEach((tweet) => {
      tweet.scrollIntoView({
        behavior: 'instant',
        block: scrollArray[noNewTweetsCount],
      });
      const tweetText = tweet.innerText.replace(/\n/g, ' ');
      tweetSet.add(tweetText);
    });

    const newTweetsAdded = tweetSet.size - initialSize;
    customConsoleLog(`Added ${newTweetsAdded} new unique tweets. Total: ${tweetSet.size}`);

    if (newTweetsAdded === 0) {
      ipcRenderer.sendToHost('toggle-visibility')
      noNewTweetsCount++;
      customConsoleLog('Now scrolling using: ' + scrollArray[noNewTweetsCount])
    } else {
      noNewTweetsCount = 0;
    }

    customConsoleLog('Waiting 2 seconds before getting more tweets');
    await wait(2);
  }

  if (tweetSet.size === 0) {
    customConsoleLog('No tweets were collected');
    return;
  }

  const tweetArray = Array.from(tweetSet);
  customConsoleLog(`Exporting ${tweetArray.length} tweets`);

  ipcRenderer.send('handle-export', company, name, tweetArray, runID);
  return;
}

module.exports = exportTwitter;