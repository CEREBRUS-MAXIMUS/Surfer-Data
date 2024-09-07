const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
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
      const bookmarks = JSON.parse(fileContent);
      console.log(id, 'Bookmarks: ', bookmarks);
      if (bookmarks && bookmarks.content && Array.isArray(bookmarks.content)) {
        for (const bookmark of bookmarks.content) {
          if (
            bookmark.timestamp === currentBookmark.timestamp &&
            bookmark.text === currentBookmark.text
          ) {
            console.log(id, 'Bookmark already exists, skipping');
            return true;
          }
        }
      } else {
        console.log(id, 'Invalid or empty bookmarks structure');
      }
    } catch (error) {
      console.error(id, `Error reading or parsing file: ${error.message}`);
    }
  }

  return false;
}

async function exportBookmarks(id, platformId, filename, company, name) {
  if (!window.location.href.includes('x.com')) {
    bigStepper(id, 'Navigating to Twitter');
    customConsoleLog(id, 'Navigating to Twitter');
    window.location.assign('https://x.com/i/bookmarks');
  }
  await wait(5);
  if (document.body.innerText.toLowerCase().includes('sign in to x')) {
    bigStepper(id, 'Export stopped, waiting for sign in');
    customConsoleLog(id, 'YOU NEED TO SIGN IN!');
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }

  const bookmarkArray = [];
  let noNewBookmarksCount = 0;

  bigStepper(id, 'Getting bookmarks...');
  customConsoleLog(id, 'Starting bookmark collection');

  while (noNewBookmarksCount < 3) {
    const bookmarks = await waitForElement(
      id,
      'div[data-testid="cellInnerDiv"]',
      'Bookmarks',
      true,
    );
    customConsoleLog(id, `Found ${bookmarks.length} bookmarks on the page`);

    if (bookmarks.length === 0) {
      customConsoleLog(id, 'No bookmarks found, waiting 2 seconds before retry');
      await wait(2);
      noNewBookmarksCount++;
      continue;
    }

    customConsoleLog(id, 'Processing new bookmarks');
    const initialSize = bookmarkArray.length;

    for (const bookmark of bookmarks) {
      bookmark.scrollIntoView({
        behavior: 'instant',
        block: 'end',
      });

      if (bookmark.querySelector('time')) {
        const jsonBookmark = {
          text: bookmark.innerText.replace(/\n/g, ' '),
          timestamp: bookmark.querySelector('time').getAttribute('datetime'),
        };

        if (
          !bookmarkArray.some(
            (t) =>
              t.timestamp === jsonBookmark.timestamp && t.text === jsonBookmark.text,
          )
        ) {
          const bookmarkExists = await checkIfBookmarkExists(
            id,
            platformId,
            company,
            name,
            jsonBookmark,
          );

          if (bookmarkExists) {
            customConsoleLog(id, 'Bookmark already exists, skipping');
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
              JSON.stringify(jsonBookmark),
              id,
            );
            bookmarkArray.push(jsonBookmark);
          }
        }
      }
    }

    const newBookmarksAdded = bookmarkArray.length - initialSize;
    customConsoleLog(
      id,
      `Added ${newBookmarksAdded} new unique bookmarks. Total: ${bookmarkArray.length}`,
    );

    if (newBookmarksAdded === 0) {
      customConsoleLog(id, 'NO NEW TWEETS ADDED, TRYING AGAIN!');
      noNewBookmarksCount++;
    } else {
      noNewBookmarksCount = 0;
    }

    customConsoleLog(id, 'Waiting 2 seconds before getting more bookmarks');
    await wait(2);
  }

  customConsoleLog(id, `Exporting ${bookmarkArray.length} bookmarks`);
  bigStepper(id, 'Exporting data');
  ipcRenderer.send('handle-update-complete', id, platformId, company, name);
  return 'HANDLE_UPDATE_COMPLETE';
}

module.exports = exportBookmarks;
