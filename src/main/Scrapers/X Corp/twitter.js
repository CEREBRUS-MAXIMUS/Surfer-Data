const { customConsoleLog, wait, waitForElement, bigStepper } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function getCurrentTweets(id, platformId, company, name) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const filePath = path.join(
    userData,
    'surfer_data',
    company,
    name,
    platformId,
    `${platformId}.json`,
  );
  console.log(id, `Checking if file exists at ${filePath}`);
  const fileExists = await fs.existsSync(filePath);
  if (fileExists) {
    console.log(id, `File exists, reading file`);
    const fileData = await fs.readFileSync(filePath, 'utf8');
    const fileJson = JSON.parse(fileData);
    console.log(id, `File data:`, fileJson);
    if (fileJson && fileJson.content) {
      console.log(id, `JSON contains ${fileJson.content.length} tweets`);
      return JSON.stringify(fileJson['content']);
    } else {
      console.log(id, `JSON structure is unexpected:`, fileJson);
      return [];
    }
  }
  return [];
}

async function exportTwitter(id, platformId, filename, company, name) {
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
    true,
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

  const tweetArray = [];
  let noNewTweetsCount = 0;
  //const scrollArray = ['start', 'center', 'end', 'nearest'];

  bigStepper(id, 'Getting tweets...');
  customConsoleLog(id, 'Starting tweet collection');
  const currentTweets = await getCurrentTweets(id, platformId, company, name);
  console.log(id, `Current tweets: ${currentTweets}`);
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
    tweets.forEach((tweet) => {
      tweet.scrollIntoView({
        behavior: 'instant',
        block: 'end',
      });

      if (tweet.querySelector('time')) {
        const jsonTweet = {
          text: tweet.innerText.replace(/\n/g, ' '),
          timestamp: tweet.querySelector('time').getAttribute('datetime'),
        };


          console.log(id, 'Tweet does not exist, adding to array: ', jsonTweet);
          tweetArray.push(jsonTweet);

      }
    });

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

  if (tweetArray.length === 0) {
    customConsoleLog(id, 'No tweets were collected');
    return;
  }

  customConsoleLog(id, `Exporting ${tweetArray.length} tweets`);
  bigStepper(id, 'Exporting data');
  return tweetArray;
}

module.exports = exportTwitter;