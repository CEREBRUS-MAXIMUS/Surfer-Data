const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function checkIfPostExists(id, platformId, company, name, currentPost) {
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
      const posts = JSON.parse(fileContent);
      console.log(id, 'Posts: ', posts);
      if (posts && posts.content && Array.isArray(posts.content)) {
        for (const post of posts.content) {
          if (
            post.timestamp === currentPost.timestamp &&
            post.text === currentPost.text
          ) {
            console.log(id, 'Post already exists, skipping');
            return true;
          }
        }
      } else {
        console.log(id, 'Invalid or empty posts structure');
      }
    } catch (error) {
      console.error(id, `Error reading or parsing file: ${error.message}`);
    }
  }

  return false;
}

async function exportFeed(id, platformId, filename, company, name) {
  if (!window.location.href.includes('x.com')) {
    bigStepper(id, 'Navigating to Twitter');
    customConsoleLog(id, 'Navigating to Twitter');
    window.location.assign('https://x.com/');
  }
  await wait(5);

  if (document.body.innerText.toLowerCase().includes('sign in to x')) {
    bigStepper(id, 'Export stopped, waiting for sign in');
    customConsoleLog(
      id,
      'YOU NEED TO SIGN IN (click the eye in the top right)!',
    );
    ipcRenderer.send('connect-website', id);
    return 'CONNECT_WEBSITE';
  }

  bigStepper(id, 'Getting feed posts...');
  customConsoleLog(id, 'Starting feed collection');

  const feedArray = [];
  let noNewPostsCount = 0;

  while (feedArray.length < 100 && noNewPostsCount < 3) {
    const posts = await waitForElement(
      id,
      'div[data-testid="cellInnerDiv"]',
      'Feed posts',
      true,
    );
    customConsoleLog(id, `Found ${posts.length} posts on the page`);

    if (posts.length === 0) {
      customConsoleLog(id, 'No posts found, waiting 2 seconds before retry');
      await wait(2);
      noNewPostsCount++;
      continue;
    }

    customConsoleLog(id, 'Processing new posts');
    const initialSize = feedArray.length;

    for (const post of posts) {
      if (feedArray.length >= 100) break;

      post.scrollIntoView({
        behavior: 'instant',
        block: 'end',
      });

      if (post.querySelector('time')) {
        const jsonPost = {
          text: post.innerText.replace(/\n/g, ' '),
          timestamp: post.querySelector('time').getAttribute('datetime'),
          author:
            post.querySelector('div[data-testid="User-Name"]')?.innerText ||
            'Unknown',
        };

        if (
          !feedArray.some(
            (p) =>
              p.timestamp === jsonPost.timestamp && p.text === jsonPost.text,
          )
        ) {
          const postExists = await checkIfPostExists(
            id,
            platformId,
            company,
            name,
            jsonPost,
          );

          if (postExists) {
            customConsoleLog(id, 'Post already exists, skipping');
            continue;
          } else {
            ipcRenderer.send(
              'handle-update',
              company,
              name,
              platformId,
              JSON.stringify(jsonPost),
              id,
            );
            feedArray.push(jsonPost);
          }
        }
      }
    }

    const newPostsAdded = feedArray.length - initialSize;
    customConsoleLog(
      id,
      `Added ${newPostsAdded} new unique posts. Total: ${feedArray.length}`,
    );

    if (newPostsAdded === 0) {
      customConsoleLog(id, 'NO NEW POSTS ADDED, TRYING AGAIN!');
      noNewPostsCount++;
    } else {
      noNewPostsCount = 0;
    }

    customConsoleLog(id, 'Waiting 2 seconds before getting more posts');
    await wait(2);
  }

  customConsoleLog(id, `Exporting ${feedArray.length} feed posts`);
  bigStepper(id, 'Exporting data');
  ipcRenderer.send('handle-update-complete', id, platformId, company, name);
  return 'HANDLE_UPDATE_COMPLETE';
}

module.exports = exportFeed;
