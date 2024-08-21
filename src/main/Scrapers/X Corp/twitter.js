const { customConsoleLog, wait, waitForElement, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportTwitter(company, name, runID) {
  await wait(5);
  if (document.querySelector('h1').innerText === 'Sign in to X') {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  customConsoleLog('Querying for profile pictures');
  const profilePics = await waitForElement(
    runID,
    'img[alt]:not([alt=""]):not([alt="Image"])',
    'Your profile picture',
    true
  );

  customConsoleLog(runID, 'this pfp\'s', profilePics);

  if (!profilePics) {
    customConsoleLog(runID, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(runID);
  profilePics[1].click();
  await wait(2);

  const tweetSet = new Set();
  let lastProcessedTweet = null;
  let noNewTweetsCount = 0;
  //const scrollArray = ['start', 'center', 'end', 'nearest'];

  bigStepper(runID);
  customConsoleLog(runID, 'Starting tweet collection');
  while (noNewTweetsCount < 3) {
    const tweets = await waitForElement(
      runID,
      'div[data-testid="cellInnerDiv"]',
      'Tweets',
      true,
    );
    customConsoleLog(runID, `Found ${tweets.length} tweets on the page`);

    if (tweets.length === 0) {
      customConsoleLog(runID, 'No tweets found, waiting 2 seconds before retry');
      await wait(2);
      noNewTweetsCount++;
      continue;
    }

    customConsoleLog(runID, 'Processing new tweets');
    const initialSize = tweetSet.size;
    tweets.forEach((tweet) => {
        tweet.scrollIntoView({
          behavior: 'instant',
          block: 'end',
        });

      const tweetText = tweet.innerText.replace(/\n/g, ' ');
      tweetSet.add(tweetText);
    });

    const newTweetsAdded = tweetSet.size - initialSize;
    customConsoleLog(runID, `Added ${newTweetsAdded} new unique tweets. Total: ${tweetSet.size}`);

    if (newTweetsAdded === 0) {
      customConsoleLog(runID, 'NO NEW TWEETS ADDED, TRYING AGAIN!');
      //window.scrollBy(0, 10000);
      noNewTweetsCount++;
    } else {
      noNewTweetsCount = 0;
    }
  
    customConsoleLog(runID, 'Waiting 2 seconds before getting more tweets');
    await wait(2);
  }

  if (tweetSet.size === 0) {
    customConsoleLog(runID, 'No tweets were collected');
    return;
  }

  const tweetArray = Array.from(tweetSet);
  customConsoleLog(runID, `Exporting ${tweetArray.length} tweets`);
  bigStepper(runID);
  ipcRenderer.send('handle-export', company, name, tweetArray, runID);
  return;
}

module.exports = exportTwitter;