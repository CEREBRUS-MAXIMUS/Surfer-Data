async function exportTwitter() {
  console.log('Starting exportTwitter function');
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log('Waiting initial 5 seconds');
  await wait(5000);

  console.log('Querying for profile pictures');
  const profilePics = document.querySelectorAll(
    'img[alt]:not([alt=""]):not([alt="Image"])',
  );
  console.log(`Found ${profilePics.length} profile pictures`);

  if (profilePics.length < 2) {
    console.log('User not connected: Less than 2 profile pictures found');
    return 'Not connected';
  }

  console.log('Clicking on the second profile picture');
  profilePics[1].scrollIntoView({ behavior: 'instant', block: 'center' });
  profilePics[1].click();
  console.log('Waiting 3 seconds after click');
  await wait(3000);

  const tweetSet = new Set();
  let lastProcessedTweet = null;
  let noNewTweetsCount = 0;
  const MAX_NO_NEW_TWEETS = 3;

  console.log('Starting tweet collection loop');
  while (noNewTweetsCount < MAX_NO_NEW_TWEETS) {
    console.log(`Current noNewTweetsCount: ${noNewTweetsCount}`);
    const tweets = document.querySelectorAll('[data-testid="tweetText"]');
    console.log(`Found ${tweets.length} tweets on the page`);

    if (tweets.length === 0) {
      console.log('No tweets found, waiting 2 seconds before retry');
      await wait(2000);
      continue;
    }

    const newTweets = Array.from(tweets).slice(
      Array.from(tweets).indexOf(lastProcessedTweet) + 1,
    );
    console.log(`Found ${newTweets.length} new tweets`);

    if (newTweets.length === 0) {
      console.log('No new tweets found, incrementing noNewTweetsCount');
      noNewTweetsCount++;
      await wait(2000);
      continue;
    }

    console.log('Processing new tweets');
    newTweets.forEach((tweet, index) => {
      const tweetText = tweet.innerText.replace(/\n/g, ' ');
      console.log(`Tweet ${index + 1}: ${tweetText.substring(0, 50)}...`);
      tweetSet.add(tweetText);
    });

    console.log(`Total unique tweets collected: ${tweetSet.size}`);

    lastProcessedTweet = tweets[tweets.length - 1];
    console.log('Scrolling to the last tweet');
    lastProcessedTweet.scrollIntoView({ behavior: 'instant', block: 'center' });

    console.log('Waiting 2 seconds before next iteration');
    await wait(2000);
    noNewTweetsCount = 0;
  }

  if (tweetSet.size === 0) {
    console.log('No tweets were collected');
    return 'No tweets found';
  }

  const tweetArray = Array.from(tweetSet);
  console.log(`Exporting ${tweetArray.length} unique tweets`);
  console.log('All unique tweets:', tweetArray);

  return tweetArray;
}

module.exports = exportTwitter;
