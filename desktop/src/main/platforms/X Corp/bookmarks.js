const {
  customConsoleLog,
  wait,
  features,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function checkIfBookmarkExists(id, platformId, company, name, currentBookmark) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const filePath = path.join(
    userData,
    'exported_data',
    company,
    name,
    platformId,
    `${platformId}.json`,
  );
  const fileExists = await fs.existsSync(filePath);
  if (fileExists) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim() === '') {
        customConsoleLog(id, 'File is empty'); // handle file being empty
        return false;
      }
      const savedBookmarks = JSON.parse(fileContent);
      if (savedBookmarks && savedBookmarks.content && Array.isArray(savedBookmarks.content)) {
        // Create a Set of unique identifiers for existing bookmarks
        const existingBookmarks = new Set(
          savedBookmarks.content.map(bookmark => `${bookmark.timestamp}-${bookmark.text}`)
        );
        
        // Check if current bookmark exists using the same identifier format
        const currentBookmarkKey = `${currentBookmark.timestamp}-${currentBookmark.text}`;
        if (existingBookmarks.has(currentBookmarkKey)) {
          return true;
        }
      } else {
        customConsoleLog(id, 'Invalid or empty bookmarks structure');
      }
    } catch (error) {
      customConsoleLog(id, `Error reading or parsing file: ${error.message}`);
    }
  }

  return false;
}

async function checkTwitterCredentials(company, name) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const twitterCredentialsPath = path.join(
    userData,
    'exported_data',
    company,
    name,
    'twitterCredentials.json',
  );
  const fileExists = await fs.existsSync(twitterCredentialsPath);
  if (fileExists) {
    const fileContent = fs.readFileSync(twitterCredentialsPath, 'utf-8');
    return JSON.parse(fileContent);
  }
  return null;
};

async function exportBookmarks(id, platformId, filename, company, name) {
  let twitterCredentials;
  if (!window.location.href.includes('x.com')) {
    customConsoleLog(id, 'Navigating to Twitter');
    window.location.assign('https://x.com/i/bookmarks/all');
    ipcRenderer.send('get-twitter-credentials', company, name);
  }

  while (!twitterCredentials) {
    await wait(0.5);
    twitterCredentials = await checkTwitterCredentials(company, name);
  }

  customConsoleLog(id, 'twitterCredentials obtained!')

  try {
    let cursor = "";
    let noNewBookmarksCount = 0;
    let shouldBreak = false;
    
    while (true) {
      const response = await fetchBookmarkBatch(id, twitterCredentials, cursor);

      const data = await response.json();

      const entries =
        data.data?.bookmark_timeline_v2?.timeline?.instructions?.[0]?.entries || [];
      const tweets = entries.filter((entry) => entry.entryId.startsWith('tweet-'));
      
      customConsoleLog(id, `Updating current bookmarks...`);
      // Process each tweet in the current batch
      for (const tweet of tweets) {
        const bookmark = parseTweet(tweet);
        
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
          if (noNewBookmarksCount >= 3) {
            customConsoleLog(id, 'No new bookmarks found in the last 3 iterations, stopping');
            shouldBreak = true;
            break;
          }

        } else {
          ipcRenderer.send(
            'handle-update',
            company,
            name,
            platformId,
            JSON.stringify(bookmark),
            id
          );
        }
      }

      

      cursor = getNextCursor(entries);

      if (shouldBreak || !cursor || tweets.length === 0) {
        customConsoleLog(id, 'No more bookmarks to fetch');
        break;
      }
        customConsoleLog(
              id,
              'Added ' + tweets.length + ' bookmarks, getting more.',
            );
    }

    ipcRenderer.send('handle-update-complete', id, platformId, company, name);
    return 'HANDLE_UPDATE_COMPLETE';

  } catch (error) {
    customConsoleLog(id, `Error fetching bookmarks: ${error.message}`);
  }
}

async function fetchBookmarkBatch(id, twitterCredentials, cursor = "") {
  const headers = new Headers();
  headers.append('Cookie', twitterCredentials.cookie);
  headers.append('X-Csrf-token', twitterCredentials.csrf);
  headers.append('Authorization', twitterCredentials.auth);
  
  const variables = {
    count: 100,
    cursor: cursor,
    includePromotedContent: false,
  };
  
  const API_URL = `https://x.com/i/api/graphql/${
    twitterCredentials.bookmarksApiId
  }/Bookmarks?features=${encodeURIComponent(
    JSON.stringify(twitterCredentials.features)
  )}&variables=${encodeURIComponent(JSON.stringify(variables))}`;

  return fetch(API_URL, {
    method: "GET",
    headers: headers,
    redirect: "follow",
  });

}

const parseTweet = (entry) => {
  const tweet =
    entry.content?.itemContent?.tweet_results?.result?.tweet ||
    entry.content?.itemContent?.tweet_results?.result;

  const user = tweet?.core?.user_results?.result?.legacy;
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

  // Convert Twitter timestamp to ISO format
  const convertToISO = (twitterTimestamp) => {
    if (!twitterTimestamp) return null;
    return new Date(twitterTimestamp).toISOString();
  };

  return {
    id: entry.entryId,
    text: tweet?.legacy?.full_text,
    timestamp: convertToISO(tweet?.legacy?.created_at),
    media: getMediaInfo(media),
    username: user?.screen_name,
    // displayName: user?.name,
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
