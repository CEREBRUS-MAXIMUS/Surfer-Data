const { customConsoleLog, wait, waitForElement, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportTwitter(id, company, name) {
  if (!window.location.href.includes('x.com')) {
    bigStepper(id, 'Navigating to Twitter');
    customConsoleLog(id, 'Navigating to Twitter');
    window.location.assign('https://x.com/');
  }
  await wait(5);
  if (document.querySelector('h1').innerText === 'Sign in to X') {
    bigStepper(id, 'Export stopped, waiting for sign in');
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }
  customConsoleLog(id, 'Waiting for profile pictures');
  const profilePics = await waitForElement(
    id,
    'img.css-9pa8cd',
    'Your profile picture',
    true
  );

  customConsoleLog(id, 'Got profile picture!');

  if (!profilePics) {
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', company);
    return;
  }

  bigStepper(id, 'Clicking on Profile Picture');
  profilePics[1].click();
  await wait(2);

  const tweetSet = new Set();
  let lastProcessedTweet = null;
  let noNewTweetsCount = 0;
  //const scrollArray = ['start', 'center', 'end', 'nearest'];

  bigStepper(id, 'Getting tweets...');
  customConsoleLog(id, 'Starting tweet collection');
  while (noNewTweetsCount < 3) {
    const tweets = await waitForElement(
      id,
      'div[data-testid="cellInnerDiv"]',
      'Tweets',
      true,
    );
    customConsoleLog(id, `Found ${tweets.length} tweets on the page`);

    if (tweets.length === 0) {
      customConsoleLog(id, 'No tweets found, waiting 2 seconds before retry');
      await wait(2);
      noNewTweetsCount++;
      continue;
    }

    customConsoleLog(id, 'Processing new tweets');
    const initialSize = tweetSet.size;
    tweets.forEach((tweet) => {
        tweet.scrollIntoView({
          behavior: 'instant',
          block: 'end',
        });


      if (tweet.querySelector('time')) {
        const jsonTweet = {
        text: tweet.innerText.replace(/\n/g, ' '),
        timestamp: tweet.querySelector('time').getAttribute('datetime'),
        }

        tweetSet.add(JSON.stringify(jsonTweet));
      }
      

    });

    const newTweetsAdded = tweetSet.size - initialSize;
    customConsoleLog(id, `Added ${newTweetsAdded} new unique tweets. Total: ${tweetSet.size}`);

    if (newTweetsAdded === 0) {
      customConsoleLog(id, 'NO NEW TWEETS ADDED, TRYING AGAIN!');
      //window.scrollBy(0, 10000);
      noNewTweetsCount++;
    } else {
      noNewTweetsCount = 0;
    }
  
    customConsoleLog(id, 'Waiting 2 seconds before getting more tweets');
    await wait(2);
  }

  if (tweetSet.size === 0) {
    customConsoleLog(id, 'No tweets were collected');
    return;
  }

  const tweetArray = Array.from(tweetSet);
  customConsoleLog(id, `Exporting ${tweetArray.length} tweets`);
  bigStepper(id, 'Exporting data');
  return tweetArray;
}

module.exports = exportTwitter;