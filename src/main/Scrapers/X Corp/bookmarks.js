const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
  features,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function checkIfBookmarkExists(id, platformId, company, name, currentBookmark) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const filePath = path.join(
    userData,
    'surfer_data',
    company,
    name,
    platformId,
    `${platformId}.json`,
  );
  customConsoleLog(id, id, `Checking if file exists at ${filePath}`);
  const fileExists = await fs.existsSync(filePath);
  if (fileExists) {
    customConsoleLog(id, `File exists, reading file`);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim() === '') {
        customConsoleLog(id, 'File is empty');
        return false;
      }
      const bookmarks = JSON.parse(fileContent);
      if (bookmarks && bookmarks.content && Array.isArray(bookmarks.content)) {
        for (const bookmark of bookmarks.content) {
          if (
            bookmark.timestamp === currentBookmark.timestamp &&
            bookmark.text === currentBookmark.text
          ) {
            customConsoleLog(id, 'Bookmark already exists, skipping');
            return true;
          }
        }
      } else {
        customConsoleLog(id, 'Invalid or empty bookmarks structure');
      }
    } catch (error) {
      console.error(id, `Error reading or parsing file: ${error.message}`);
    }
  }

  return false;
}

async function checkBigData(company, name) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const bigDataPath = path.join(
    userData,
    'surfer_data',
    company,
    name,
    'bigData.json',
  );
  const fileExists = await fs.existsSync(bigDataPath);
  if (fileExists) {
    const fileContent = fs.readFileSync(bigDataPath, 'utf-8');
    return JSON.parse(fileContent);
  }
  return null;
};

async function exportBookmarks(id, platformId, filename, company, name) {
  let bigData;
  if (!window.location.href.includes('x.com')) {
    bigStepper(id, 'Navigating to Twitter');
    customConsoleLog(id, 'Navigating to Twitter');
    window.location.assign('https://x.com/i/bookmarks/all');
    ipcRenderer.send('get-big-data', company, name);
  }

  // Wait for bigData to be available
  while (!bigData) {
    await wait(0.5);
    bigData = await checkBigData(company, name);
  }

  customConsoleLog(id, 'bigData obtained!')

  // Run API requests to get bookmarks
  try {
    const bookmarks = await getBookmarks(id, bigData);
    customConsoleLog(id, `Retrieved ${bookmarks.length} bookmarks`);

    let bookmarkArray = [];
    let noNewBookmarksCount = 0;

    for (const bookmark of bookmarks) {


      if (!bookmarkArray.some(
        (t) => t.timestamp === bookmark.timestamp && t.text === bookmark.text
      )) {
        const bookmarkExists = await checkIfBookmarkExists(
          id,
          platformId,
          company,
          name,
          bookmark
        );

        if (bookmarkExists) {
          customConsoleLog(id, 'Bookmark already exists, skipping');
          noNewBookmarksCount++;
        } else {
          ipcRenderer.send(
            'handle-update',
            company,
            name,
            platformId,
            JSON.stringify(bookmark),
            id
          );
          bookmarkArray.push(bookmark);
          noNewBookmarksCount = 0;
        }
      } else {
        noNewBookmarksCount++;
      }

      if (noNewBookmarksCount >= 3) {
        customConsoleLog(id, 'No new bookmarks found in the last 3 iterations, stopping');
        break;
      }
    }

    customConsoleLog(id, `Exporting ${bookmarkArray.length} bookmarks`);
    bigStepper(id, 'Exporting data');
    ipcRenderer.send('handle-update-complete', id, platformId, company, name);
    return 'HANDLE_UPDATE_COMPLETE';

  } catch (error) {
    console.error(id, `Error fetching bookmarks: ${error.message}`);
    return 'ERROR';
  }
}

async function getBookmarks(id, bigData, cursor = "", totalImported = 0, allBookmarks = []) {
  const headers = new Headers();
  headers.append('Cookie', bigData.cookie);
  headers.append('X-Csrf-token', bigData.csrf);
  headers.append('Authorization', bigData.auth);
  const variables = {
    count: 100,
    cursor: cursor,
    includePromotedContent: false,
  };
  const API_URL = `https://x.com/i/api/graphql/${
    bigData.bookmarksApiId
  }/Bookmarks?features=${encodeURIComponent(
    JSON.stringify(features)
  )}&variables=${encodeURIComponent(JSON.stringify(variables))}`;

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: headers,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const entries =
      data.data?.bookmark_timeline_v2?.timeline?.instructions?.[0]
        ?.entries || [];

    const tweetEntries = entries.filter((entry) =>
      entry.entryId.startsWith('tweet-'),
    );

    const parsedTweets = tweetEntries.map(parseTweet);

    allBookmarks = allBookmarks.concat(parsedTweets);

    const newBookmarksCount = parsedTweets.length;
    totalImported += newBookmarksCount;

    customConsoleLog(id, 'New bookmarks in this batch:', newBookmarksCount);
    customConsoleLog(id, 'Current total imported:', totalImported);

    const nextCursor = getNextCursor(entries);
    console.log('nextCursor:', nextCursor);

    if (nextCursor && newBookmarksCount > 0) {
      console.log('TRYING TO GET MORE BOOKMARKS!!!')
      return await getBookmarks(id, bigData, nextCursor, totalImported, allBookmarks);
    }
    else {
      customConsoleLog(id, 'No new bookmarks found, returning all bookmarks');
      return allBookmarks;
    }

    //return data; // or return processed data
  } catch (error) {
    console.error(id, `Error fetching bookmarks: ${error.message}`);
    throw error; // Re-throw the error if you want to handle it in the calling function
  }
}

const parseTweet = (entry) => {
  const tweet =
    entry.content?.itemContent?.tweet_results?.result?.tweet ||
    entry.content?.itemContent?.tweet_results?.result;

  const media = tweet?.legacy?.entities?.media?.[0] || null;

  const getBestVideoVariant = (variants) => {
    if (!variants || variants.length === 0) return null;
    const mp4Variants = variants.filter((v) => v.content_type === 'video/mp4');
    return mp4Variants.reduce((best, current) => {
      if (!best || (current.bitrate && current.bitrate > best.bitrate)) {
        return current;
      }
      return best;
    }, null);
  };

  const getMediaInfo = (media) => {
    if (!media) return null;

    if (media.type === 'video' || media.type === 'animated_gif') {
      const videoInfo =
        tweet?.legacy?.extended_entities?.media?.[0]?.video_info;
      const bestVariant = getBestVideoVariant(videoInfo?.variants);
      return {
        type: media.type,
        source: bestVariant?.url || media.media_url_https,
      };
    }

    return {
      type: media.type,
      source: media.media_url_https,
    };
  };

  return {
    id: entry.entryId,
    text: tweet?.legacy?.full_text,
    timestamp: tweet?.legacy?.created_at,
    media: getMediaInfo(media),
    // favorite_count: tweet?.legacy?.favorite_count,
    // retweet_count: tweet?.legacy?.retweet_count,
    // reply_count: tweet?.legacy?.reply_count,
    // quote_count: tweet?.legacy?.quote_count,
    // lang: tweet?.legacy?.lang
  };
};

const getNextCursor = (entries) => {
  const cursorEntry = entries.find((entry) =>
    entry.entryId.startsWith('cursor-bottom-'),
  );
  return cursorEntry ? cursorEntry.content.value : null;
};


module.exports = exportBookmarks;
