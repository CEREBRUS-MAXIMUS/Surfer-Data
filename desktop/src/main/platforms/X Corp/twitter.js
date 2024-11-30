const {
  customConsoleLog,
  wait,
  waitForElement,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function checkIfTweetExists(id, platformId, company, name, currentTweet) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const filePath = path.join(
    userData,
    'exported_data',
    company,
    name,
    platformId,
    `${platformId}.json`,
  );
  console.log(id, `Checking if file exists at ${filePath}`);
  const fileExists = await fs.existsSync(filePath);
  if (fileExists) {
    console.log(id, `File exists, reading file`);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim() === '') {
        console.log(id, 'File is empty');
        return false;
      }
      const tweets = JSON.parse(fileContent);
      console.log(id, 'Tweets: ', tweets);
      if (tweets && tweets.content && Array.isArray(tweets.content)) {
        for (const tweet of tweets.content) {
          if (
            tweet.timestamp === currentTweet.timestamp &&
            tweet.text === currentTweet.text
          ) {
            console.log(id, 'Tweet already exists, skipping');
            return true;
          }
        }
      } else {
        console.log(id, 'Invalid or empty tweets structure');
      }
    } catch (error) {
      console.error(id, `Error reading or parsing file: ${error.message}`);
    }
  }

  return false;
}

async function exportTwitter(id, platformId, filename, company, name) {
  if (!window.location.href.includes('x.com')) {

      customConsoleLog(id, 'Navigating to Twitter');
    window.location.assign('https://x.com/');
  }
  await wait(5);
  if (document.body.innerText.toLowerCase().includes('sign in to x')) {
    customConsoleLog(
      id,
      'YOU NEED TO SIGN IN (click the eye in the top right)!',
    );
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }
  customConsoleLog(id, 'Waiting for profile pictures');
  const profilePics = await waitForElement(
    id,
    'img.css-9pa8cd',
    'Your profile picture',
    true,
  );

  customConsoleLog(id, 'Got profile picture!');

  if (!profilePics) {
    customConsoleLog(
      id,
      'YOU NEED TO SIGN IN (click the eye in the top right)!',
    );
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }

  profilePics[1].click();
  await wait(2);

  const tweetArray = [];
  let noNewTweetsCount = 0;
  //const scrollArray = ['start', 'center', 'end', 'nearest'];

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
    const initialSize = tweetArray.length;

    for (const tweet of tweets) {
      tweet.scrollIntoView({
        behavior: 'instant',
        block: 'end',
      });

      if (tweet.querySelector('time')) {
        const jsonTweet = {
          text: tweet.innerText.replace(/\n/g, ' '),
          timestamp: tweet.querySelector('time').getAttribute('datetime'),
        };

        if (
          !tweetArray.some(
            (t) =>
              t.timestamp === jsonTweet.timestamp && t.text === jsonTweet.text,
          )
        ) {
          const tweetExists = await checkIfTweetExists(
            id,
            platformId,
            company,
            name,
            jsonTweet,
          );

          if (tweetExists) {
            customConsoleLog(id, 'Tweet already exists, skipping');
            ipcRenderer.send(
              'handle-update-complete',
              id,
              platformId,
              company,
              name,
            );
            return 'HANDLE_UPDATE_COMPLETE';
          } else {
            ipcRenderer.send(
              'handle-update',
              company,
              name,
              platformId,
              JSON.stringify(jsonTweet),
              id,
            );
            tweetArray.push(jsonTweet);
          }
        }
      }
    }

    const newTweetsAdded = tweetArray.length - initialSize;
    customConsoleLog(
      id,
      `Added ${newTweetsAdded} new unique tweets. Total: ${tweetArray.length}`,
    );

    if (newTweetsAdded === 0) {
      customConsoleLog(id, 'NO NEW TWEETS ADDED, TRYING AGAIN!');
      noNewTweetsCount++;
    } else {
      noNewTweetsCount = 0;
    }

    customConsoleLog(id, 'Waiting 2 seconds before getting more tweets');
    await wait(2);
  }

  customConsoleLog(id, `Exporting ${tweetArray.length} tweets`);

  ipcRenderer.send('handle-update-complete', id, platformId, company, name);
  return 'HANDLE_UPDATE_COMPLETE';
}

module.exports = exportTwitter;
