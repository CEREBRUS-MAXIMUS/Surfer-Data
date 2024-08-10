const { customConsoleLog } = require('../../preloadFunctions');

async function exportTwitter() {
  customConsoleLog('Starting exportTwitter function');
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  customConsoleLog('Waiting initial 5 seconds');
  await wait(5000);

  customConsoleLog('Querying for profile pictures');
  const profilePics = document.querySelectorAll(
    'img[alt]:not([alt=""]):not([alt="Image"])',
  );
  customConsoleLog(`Found ${profilePics.length} profile pictures`);

  if (profilePics.length < 2) {
    customConsoleLog('User not connected: Less than 2 profile pictures found');
    return 'Not connected';
  }

  customConsoleLog('Clicking on the second profile picture');
  profilePics[1].scrollIntoView({ behavior: 'instant', block: 'center' });
  profilePics[1].click();
  customConsoleLog('Waiting 3 seconds after click');
  await wait(3000);

  const tweetSet = new Set();
  let lastProcessedTweet = null;
  let noNewTweetsCount = 0;
  const MAX_NO_NEW_TWEETS = 3;

  customConsoleLog('Starting tweet collection loop');
  while (noNewTweetsCount < MAX_NO_NEW_TWEETS) {
    customConsoleLog(`Current noNewTweetsCount: ${noNewTweetsCount}`);
    const tweets = document.querySelectorAll('[data-testid="tweetText"]');
    customConsoleLog(`Found ${tweets.length} tweets on the page`);

    if (tweets.length === 0) {
      customConsoleLog('No tweets found, waiting 2 seconds before retry');
      await wait(2000);
      continue;
    }

    const newTweets = Array.from(tweets).slice(
      Array.from(tweets).indexOf(lastProcessedTweet) + 1,
    );
    customConsoleLog(`Found ${newTweets.length} new tweets`);

    if (newTweets.length === 0) {
      customConsoleLog('No new tweets found, incrementing noNewTweetsCount');
      noNewTweetsCount++;
      await wait(2000);
      continue;
    }

    customConsoleLog('Processing new tweets');
    newTweets.forEach((tweet, index) => {
      const tweetText = tweet.innerText.replace(/\n/g, ' ');
      customConsoleLog(`Tweet ${index + 1}: ${tweetText.substring(0, 50)}...`);
      tweetSet.add(tweetText);
    });

    customConsoleLog(`Total unique tweets collected: ${tweetSet.size}`);

    lastProcessedTweet = tweets[tweets.length - 1];
    customConsoleLog('Scrolling to the last tweet');
    lastProcessedTweet.scrollIntoView({ behavior: 'instant', block: 'center' });

    customConsoleLog('Waiting 2 seconds before next iteration');
    await wait(2000);
    noNewTweetsCount = 0;
  }

  if (tweetSet.size === 0) {
    customConsoleLog('No tweets were collected');
    return 'No tweets found';
  }

  const tweetArray = Array.from(tweetSet);
  customConsoleLog(`Exporting ${tweetArray.length} unique tweets`);
  customConsoleLog('All unique tweets:', tweetArray);

  return tweetArray;
}

module.exports = exportTwitter;
