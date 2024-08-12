const { customConsoleLog, wait, waitForElement } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportTwitter(company, name, runID) {
  customConsoleLog('Querying for profile pictures');
  const profilePics = await waitForElement(
    'img[alt]:not([alt=""]):not([alt="Image"])',
    'Your profile picture',
    true
  );

  if (profilePics.length < 2) {
    customConsoleLog('User not connected: Less than 2 profile pictures found');
    ipcRenderer.send('connect-website', company);
    return;
  }

  profilePics[1].click();
  await wait(2);

  const tweetSet = new Set();
  let lastProcessedTweet = null;
  let noNewTweetsCount = 0;
  const MAX_NO_NEW_TWEETS = 3;

  customConsoleLog('Starting tweet collection');
  while (noNewTweetsCount < MAX_NO_NEW_TWEETS) {
    const tweets = await waitForElement('[data-testid="tweetText"]', 'Tweets', true);
    customConsoleLog(`Found ${tweets.length} tweets on the page`);

    if (tweets.length === 0) {
      customConsoleLog('No tweets found, waiting 2 seconds before retry');
      await wait(2);
      continue;
    }

    const newTweets = Array.from(tweets).slice(
      Array.from(tweets).indexOf(lastProcessedTweet) + 1,
    );
    customConsoleLog(`Found ${newTweets.length} new tweets`);

    if (newTweets.length === 0) {
      noNewTweetsCount++;
      await wait(2);
      continue;
    }

    customConsoleLog('Processing new tweets');
    newTweets.forEach((tweet, index) => {
      const tweetText = tweet.innerText.replace(/\n/g, ' ');
      tweetSet.add(tweetText);
    });

    customConsoleLog(`Total unique tweets collected: ${tweetSet.size}`);

    lastProcessedTweet = tweets[tweets.length - 1];
    customConsoleLog('Scrolling to the last tweet');
    lastProcessedTweet.scrollIntoView({ behavior: 'instant', block: 'center' });

    customConsoleLog('Waiting 2 seconds before getting more tweets');
    await wait(2);
    noNewTweetsCount = 0;
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
