import * as dotenv from 'dotenv';
dotenv.config();
import {} from '../../';
import path from 'path';
import MenuBuilder from './utils/menu';
import yauzl from 'yauzl';
import { getFilesInFolder } from './utils/util';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  protocol,
  Menu,
  net,
  nativeImage,
  Tray,
  powerMonitor,
  dialog,
  session
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './utils/util';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { PythonUtils } from './utils/python';
import { mboxParser } from 'mbox-parser';


const pythonUtils = new PythonUtils();

let appIcon: Tray | null = null;

require('dotenv').config();
const { download } = require('electron-dl');

autoUpdater.autoDownload = false; // Prevent auto-download
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoRunAppAfterInstall = true;

let downloadingItems = new Map();

let config;
let supabase;
 
try {
  const configPath = path.join(__dirname, '../../config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    supabase = createClient(config.supabase_url, config.supabase_key);
  } else if (process.env.NODE_ENV === 'production') {
    config = require('../../config.json');
    supabase = createClient(config.supabase_url, config.supabase_key);
  }
} catch (error) {
  console.error('Error loading config:', error);
} 

ipcMain.on('connect-platform', (event, platform: any) => {
  const { company, name, connectURL, connectSelector, id } = platform;
  //console.log('CONNECTING TO PLATFORM: ', company, name, connectURL, connectSelector);
  const popupWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  popupWindow.loadURL(connectURL);
  popupWindow.show();

  popupWindow.webContents.on('did-finish-load', async () => {
    let elementFound = false;
    let errorCount = 0;
    while (!elementFound && errorCount < 3 && connectSelector) {
      try {
        const elementExists = await popupWindow.webContents.executeJavaScript(`
          (() => {
            const element = document.querySelector('${connectSelector.replace(/'/g, "\\'")}');
            return !!element;
          })();
        `);

        if (elementExists) {
          console.log('ELEMENT FOUND, closing popup');
          const platformPath = path.join(app.getPath('userData'), 'surfer_data', company, name);
          fs.mkdirSync(platformPath, { recursive: true });
          mainWindow?.webContents.send('element-found', id);
          elementFound = true;
          popupWindow.destroy();
          
        } else {
          console.log('ELEMENT NOT FOUND, STILL LOOKING!');
          mainWindow?.webContents.send('element-not-found', id);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        errorCount++;
        console.error('Error checking for element, debug:', error);
        popupWindow.destroy();
      }
    }
  });
});

ipcMain.on('get-big-data', async (event, company, name) => {
  const userData = app.getPath('userData');
  const bigDataPath = path.join(
    userData,
    'surfer_data',
    company,
    name,
    'bigData.json',
  );

  return new Promise((resolve) => {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.twitter.com/*', '*://*.x.com/*'] },
      (details: any, callback) => {
        if (details.url.includes('/Bookmarks?variables')) {
          console.log('getting big data!');
          const bookmarksUrlPattern =
            /https:\/\/x\.com\/i\/api\/graphql\/([^/]+)\/Bookmarks\?/;
          const match = details.url.match(bookmarksUrlPattern);

          let result = {
            bookmarksApiId: null as string | null,
            auth: null as string | null,
            cookie: null as string | null,
            csrf: null as string | null,
          };

          if (match) {
            result.bookmarksApiId = match[1];
          }

          result.auth = details.requestHeaders['authorization'] || null;
          result.cookie = details.requestHeaders['Cookie'] || null;
          result.csrf = details.requestHeaders['x-csrf-token'] || null;

          if (
            result.bookmarksApiId &&
            result.auth &&
            result.cookie &&
            result.csrf
          ) {
            console.log('returning result: ', result);

            // Create the directory if it doesn't exist
            fs.mkdirSync(path.dirname(bigDataPath), { recursive: true });

            // Write the bigData to the file
            fs.writeFileSync(bigDataPath, JSON.stringify(result, null, 2));

            event.sender.send('got-big-data', result);
          }
        }

        callback({ requestHeaders: details.requestHeaders });
      },
    );
  });
});

ipcMain.handle('check-connected-platforms', async (event, platforms) => {
  const userDataPath = app.getPath('userData');
  const connectedPlatforms = {};

  for (const platform of platforms) {
    const { company, name } = platform;
    const platformPath = path.join(userDataPath, 'surfer_data', company, name);
    connectedPlatforms[platform.id] = fs.existsSync(platformPath);
  }

  return connectedPlatforms;
});


ipcMain.handle('get-scrapers', async () => {
  let scrapersDir;
  if (app.isPackaged) {
    scrapersDir = path.join(__dirname);
  } else {
    scrapersDir = path.join(__dirname, 'Scrapers');
  }


  const getAllJsFiles = async (dir: string): Promise<string[]> => {
    const excludedFiles = [
      '248.js',
      'main.js',
      'preload.js',
      'preloadElectron.js',
      'preloadFunctions.js',
      'preloadWebview.js',
    ];

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        return entry.isDirectory() ? getAllJsFiles(res) : res;
      }),
    );
    return files
      .flat()
      .filter(
        (file) =>
          file.endsWith('.js') && !excludedFiles.includes(path.basename(file)),
      );
  };

  const getMetadataFile = async (company: string, name: string) => {
    const metadataFilePath = path.join(scrapersDir, company, `${name}.json`);
    if (fs.existsSync(metadataFilePath)) {
      return JSON.parse(fs.readFileSync(metadataFilePath, 'utf-8'));
    }
    return null;
  };

  try {
    if (!fs.existsSync(scrapersDir)) {
      console.error('Scrapers directory does not exist:', scrapersDir);
      return [];
    }

    const jsFiles = await getAllJsFiles(scrapersDir);
    const scrapers = await Promise.all(
      jsFiles.map(async (file) => {
        const relativePath = path.relative(scrapersDir, file);
        const name = path.basename(file, '.js');
        const companyMatch = relativePath.split(path.sep);
        const company = companyMatch.length > 1 ? companyMatch[0] : 'Scraper';
        const metadata = await getMetadataFile(company, name);
 
        return {
          id: metadata && metadata.id ? metadata.id : `${name}-001`,
          company: metadata && metadata.company ? metadata.company : company,
          name: metadata && metadata.name ? metadata.name : name,
          filename: name,
          description: metadata && metadata.description ? metadata.description : 'No description available',
          isUpdated: metadata && metadata.isUpdated ? metadata.isUpdated : false,
          logoURL: metadata && metadata.logoURL ? metadata.logoURL : name,
          needsConnection: metadata && metadata.needsConnection !== undefined ? metadata.needsConnection : true,
          connectURL: metadata && metadata.connectURL ? metadata.connectURL : null,
          connectSelector: metadata && metadata.connectSelector ? metadata.connectSelector : null,
        };
      }),
    );

    return scrapers;
  } catch (error) {
    console.error('Error reading scrapers directory:', error);
    return [];
  }
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
})
// Listen for user data sent from renderer
ipcMain.on('send-user-data', (event, userID) => {
  console.log('user id from renderer: ', userID);
});

ipcMain.on('get-platform', (event) => {
  event.reply('platform', process.platform);
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (_wawevent, webPreferences, _params) => {
    // Use __dirname to get the path of the current directory
    const preloadPath = path.join(__dirname, 'preloadWebview.js');
    webPreferences.preload = preloadPath;
  }); 
});

ipcMain.on('get-files-in-folder', (event, folderPath) => {
  const files = getFilesInFolder(folderPath);
  event.reply('files-in-folder', files);
});

ipcMain.on('get-version-number', (event) => {
  event.reply('version-number', app.getVersion());
});

ipcMain.handle('get-imessage-data', async (event, company: string, name: string, id: string) => {
  //if (process.platform === 'win32') {
    const username = process.env.USERNAME || process.env.USER;
    const defaultPath =
      process.platform === 'win32'
        ? path.join('C:', 'Users', username, 'Apple', 'MobileSync', 'Backup')
        : path.join(
            '/Users',
            username,
            'Library',
            'Application Support',
            'MobileSync',
            'Backup',
          );

    if (!fs.existsSync(defaultPath)) {
      console.log('NEED TO BACKUP YOUR IMESSAGE FOLDER!');
      return null;
    }

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select iMessages Folder',
      buttonLabel: 'Select',
      defaultPath: defaultPath,
    });

    if (result.filePaths.length > 0) {
      const selectedFolder = result.filePaths[0];
      mainWindow?.webContents.send('console-log', id, 'Got folder, now exporting iMessages (will take a few minutes)');

      try {
        const scriptOutput = await pythonUtils.iMessageScript(
          process.platform,
          selectedFolder,
          company,
          name,
          id,
        );
        mainWindow?.webContents.send(
          'console-log',
          id,
          'iMessage export complete!'
        );
        // Assuming the last line of the output is the JSON file path
        const folderPath = scriptOutput.split('\n').pop()?.trim();
        console.log('JSON file path:', folderPath);
        mainWindow?.webContents.send('export-complete', company, name, id, folderPath, getTotalFolderSize(folderPath));
        return folderPath;
      } catch (error) {
        console.error('Error running iMessage script:', error);
        return null;
      }
    }
  // } else if (process.platform === 'darwin') {
  //   console.log('Mac is being added soon!');
  //   return null;
  // } else {
  //   console.log('Unsupported platform:', process.platform);
  //   return null;
  // }
});

function getTotalFolderSize(folderPath: string): number {
  let totalSize = 0;
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      totalSize += getTotalFolderSize(filePath);
    }
  }

  return totalSize;
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

class AppUpdater {
  constructor() {
    console.log('Creating new App Updater');
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

let scrapingManager: ScrapingManager;
 

export const createWindow = async (visible: boolean = true) => {
  if (mainWindow) {
    return;
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: visible, 
    //set to max with on mac screen
    width: 1560,
    height: 1024,
    minWidth: 720,
    minHeight: 400,
    icon: getAssetPath('icon.png'),
    backgroundColor: '#000000',
    autoHideMenuBar: false,
    simpleFullscreen: true,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    trafficLightPosition: { x: 12, y: 19 },
    title: '',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: app.isPackaged ? true : false,
      webviewTag: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url); // Open URL in user's browser.
    return { action: 'deny' }; // Prevent the app from opening the URL.
  });

  //banish new windows
  // mainWindow.webContents.on('did-attach-webview', (_, contents) => { contents._events["-new-window"] = () => { return false; }; });

  //banish new tabss
  mainWindow.webContents.on('did-attach-webview', (event, wc) => {
    wc.setWindowOpenHandler((details) => {
      console.log('webview-new-window', wc.id, details);

      // THIS IS MAINLY FOR AUTH-RELATED STUFF. WE CAN INCORPORTATE HUMAN IN THE LOOP HERE FOR AUTH PURPOSES!
      if (
        details.url.includes('https://accounts.google.com') ||
        details.url.includes('about:blank') ||
        details.url.includes('file://') ||
        details.url.includes('https://www.notion.so/verifyNoPopupBlocker') ||
        details.url.includes('https://appleid.apple.com/auth/') ||
        details.url.includes(
          'https://proddatamgmtqueue.blob.core.windows.net/exportcontainer/',
        ) ||
        details.url.includes('file.notion.so')
      ) {
        console.log('ALLOWING THIS URL: ', details.url);
        return { action: 'allow' };
      }

      //mainWindow?.webContents.send('webview-new-window', wc.id, details);
      mainWindow?.webContents.send('url', details.url);
      console.log('opening in same tab: ', details.url);

      return { action: 'deny' };
    });
  });

  mainWindow.on('enter-full-screen', () => {
    console.log('ENTER FULL SCREEN');
    //if were on windows, say true all the time
    if (process.platform !== 'win32') {
      mainWindow?.webContents.send('fullscreen-changed', true);
    }
  });

  //on take screenshot
  mainWindow?.webContents.on('take-screenshot', (event, url, workspaceId) => {
    console.log('TAKE SCREENSHOT FROM MAIN');
    console.log('URL: ', url);
    console.log('WORKSPACE ID: ', workspaceId);

    //take screenshot of the page
    mainWindow?.webContents.capturePage().then((image) => {
      console.log('IMAGE: ', image);
      //save the image to the workspace folder
      // fs.writeFileSync(path.join(workspaceFolderPath, workspaceId, 'screenshot.png'), image);
    });
  });

  mainWindow.on('leave-full-screen', () => {
    console.log('LEAVE FULL SCREEN');
    if (process.platform !== 'win32') {
      mainWindow?.webContents.send('fullscreen-changed', false);
    }
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send('open-url', url);
    }
  });

  ipcMain.on('close-url', (event) => {
    mainWindow.removeBrowserView(mainWindow.getBrowserView());
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  ipcMain.on('show-dev-tools', (event) => {
    try {
      console.log('OPENING DEVTOOLS!');
      mainWindow?.webContents.openDevTools();
    } catch (error) {
      console.error('Error opening dev tools:', error);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  new AppUpdater();

  ipcMain.on('update-artifact', (event, data) => {
    // Send the data to the renderer process
    mainWindow.webContents.send('update-web-artifact', data);
  });

  function extractZip(source, target) {
    return new Promise((resolve, reject) => {
      yauzl.open(source, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          const fullPath = path.join(target, entry.fileName);
          const directory = path.dirname(fullPath);

          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            try {
              fs.mkdirSync(fullPath, { recursive: true });
              zipfile.readEntry();
            } catch (err) {
              reject(err);
            }
          } else {
            // File entry
            try {
              fs.mkdirSync(directory, { recursive: true });
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) return reject(err);
                const writeStream = fs.createWriteStream(fullPath);
                readStream.on('end', () => {
                  writeStream.end();
                  zipfile.readEntry();
                });
                readStream.pipe(writeStream);
              });
            } catch (err) {
              reject(err);
            }
          }
        });

        zipfile.on('end', resolve);
        zipfile.on('error', reject);
      });
    });
  }

async function parseConversationsJSON(extractPath: string) {
  const conversationsFilePath = path.join(extractPath, 'conversations.json');
  const parsedConversationsFilePath = path.join(
    extractPath,
    'basic_conversations.json',
  );
  console.log('Parsing conversations.json...');

  let formattedConversations = [];

  if (fs.existsSync(conversationsFilePath)) {
    const conversationsData = fs.readFileSync(conversationsFilePath, 'utf8');
    const parsedData = JSON.parse(conversationsData);

    formattedConversations = parsedData.map((conversation: any) => {
      const messages = Object.values(conversation.mapping)
        .filter(
          (node: any) => node.message && node.message.author.role !== 'system',
        )
        .sort((a: any, b: any) => {
          const timeA = a.message.create_time || 0;
          const timeB = b.message.create_time || 0;
          return timeA - timeB;
        })
        .map((node: any) => ({
          message: node.message.content.parts.join('\n'),
          role: node.message.author.role === 'assistant' ? 'AI' : 'human',
        }))
        .filter(msg => msg.message.trim() !== ''); // Filter out blank or whitespace-only messages

      return {
        title: conversation.title,
        timestamp: conversation.create_time,
        conversation: messages,
      };
    });

    console.log('Conversations parsed successfully');
  } else {
    console.warn('Conversations.json file not found in:', extractPath);
  }

  // Write the formatted conversations to parsed_conversations.json
  try {
    fs.writeFileSync(
      parsedConversationsFilePath,
      JSON.stringify(formattedConversations, null, 2),
    );
    console.log('Parsed conversations written to parsed_conversations.json');
  } catch (error) {
    console.error('Error writing to parsed_conversations.json:', error);
  }

  return formattedConversations;
}

async function convertMboxToJson(
  mboxFilePath: string,
  jsonOutputPath: string,
  id: string,
  company: string,
  name: string,
  runID: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(mboxFilePath);

    const data = {
      company,
      name,
      runID,
      timestamp: Date.now(),
      content: [],
    };

    mboxParser(readStream)
      .then((messages) => {
        messages.forEach((message) => {
          const jsonMessage = {
            accountID: id,
            from: message.from?.text,
            to: message.to?.text || message.to,
            subject: message.subject,
            timestamp: message.date,
            body: message.text,
            added_to_db: new Date().toISOString(),
          };

          data.content.push(jsonMessage);
        });

        fs.writeFileSync(jsonOutputPath, JSON.stringify(data, null, 2));
        console.log('MBOX to JSON conversion completed');
        resolve();
      })
      .catch((error) => {
        console.error('Error parsing MBOX:', error);
        reject(error);
      });
  });
}

  let lastDownloadUrl = '';
  let lastDownloadTime = 0;

  mainWindow.webContents.session.on(
    'will-download',
    (event, item, webContents) => {
      const url = item.getURL();
      const fileName = item.getFilename();
      const fileSize = item.getTotalBytes();

      const now = Date.now();
      if (url === lastDownloadUrl && now - lastDownloadTime < 1000) {
        console.log('Ignoring duplicate download request');
        return;
      }

      lastDownloadUrl = url;
      lastDownloadTime = now;

      console.log('Intercepted download:', { url, fileName, fileSize });

      const userData = app.getPath('userData');
      const surferDataPath = path.join(userData, 'surfer_data');
      let companyPath: string;
      let platformPath: string;
      let idPath: string;

      let platformId;

      if (url.includes('file.notion.so')) {
        companyPath = path.join(surferDataPath, 'Notion');
        platformPath = path.join(companyPath, 'Notion');
        platformId = `notion-001`;
        idPath = path.join(platformPath, `${platformId}-${Date.now()}`);
      } else if (
        url.includes('proddatamgmtqueue.blob.core.windows.net/exportcontainer/')
      ) {
        companyPath = path.join(surferDataPath, 'OpenAI');
        platformPath = path.join(companyPath, 'ChatGPT');
        platformId = `chatgpt-001-${Date.now()}`;
        idPath = path.join(platformPath, `${platformId}-${Date.now()}`);
      } else if (url.includes('takeout-download.usercontent.google.com')) {
        companyPath = path.join(surferDataPath, 'Google');
        platformPath = path.join(companyPath, 'Gmail');
        platformId = `gmail-001`;
        idPath = path.join(platformPath, platformId);
      } else {
        console.error('Unknown download URL, needs to be handled:', url);
        return;
      }

      // Create surfer_data folder if it doesn't exist
      if (!fs.existsSync(surferDataPath)) {
        fs.mkdirSync(surferDataPath);
      }

      // Create company folder if it doesn't exist
      if (!fs.existsSync(companyPath)) {
        fs.mkdirSync(companyPath);
      }

      // Create or clear company folder
      if (!fs.existsSync(platformPath)) {
        fs.mkdirSync(platformPath);
      }

      if (!fs.existsSync(idPath)) {
        fs.mkdirSync(idPath);
      }

      event.preventDefault();

      console.log('Starting download:', url);

      download(mainWindow, url, {
        directory: idPath,
        filename: fileName,
        onStarted: (downloadItem: Electron.DownloadItem) => {
          console.log('Download started:', url);
          downloadItem.on('done', (event: Electron.Event, state: string) => {
            if (state === 'completed') {
              console.log('Download completed successfully:', url);
            } else if (state === 'cancelled') {
              console.log('Download was cancelled:', url);
            }
          });
        },
        onProgress: (percent: number) => {
          console.log(`Download progress for ${url}: ${percent}%`);
          mainWindow?.webContents.send('download-progress', {
            fileName,
            percent,
          });
        },
        saveAs: false,
      })
        .then(async (dl: Electron.DownloadItem) => {
          console.log('Download completed:', dl.getSavePath());
          const filePath = dl.getSavePath();
          if (filePath.toLowerCase().endsWith('.zip')) {

            const extractPath = path.join(idPath, 'extracted');
            
            try {
              await extractZip(filePath, extractPath);
              console.log('Outer ZIP extracted to:', extractPath);

              // parsing conversations.json  

              if (extractPath.includes('ChatGPT')) {
                await parseConversationsJSON(extractPath)
              }
              // Find the inner ZIP file
              const innerZipFile = fs.readdirSync(extractPath).find(file => file.endsWith('.zip'));
              
              if (innerZipFile) {
                const innerZipPath = path.join(extractPath, innerZipFile);
                await extractZip(innerZipPath, extractPath);
                console.log('Inner ZIP extracted to:', extractPath);
                
                // Delete the inner ZIP file after extraction
                fs.unlinkSync(innerZipPath);
              }

              // Delete the original ZIP file
              fs.unlinkSync(filePath);

              console.log('Zip fully extracted to:', extractPath);

              if (url.includes('takeout-download.usercontent.google.com')) {
                // Function to recursively find the MBOX file
                const findMboxFile = (dir) => {
                  const files = fs.readdirSync(dir);
                  for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                      const result = findMboxFile(filePath);
                      if (result) return result;
                    } else if (file.toLowerCase().endsWith('.mbox')) {
                      return filePath;
                    }
                  }
                  return null;
                };

                const mboxFilePath = findMboxFile(extractPath);
if (mboxFilePath) {
  const jsonOutputPath = path.join(extractPath, `${platformId}.json`);

  try {
    console.log('Converting MBOX to JSON:', mboxFilePath);
    const accountID = new URL(url).searchParams.get('authuser') || '0';
    await convertMboxToJson(
      mboxFilePath,
      jsonOutputPath,
      accountID,
      'Google',
      'Gmail',
      platformId,
    );
    console.log('MBOX converted to JSON:', jsonOutputPath);

    mainWindow?.webContents.send(
      'export-complete',
      'Google',
      'Gmail',
      platformId,
      extractPath,
      getTotalFolderSize(extractPath),
    );
  } catch (error) {
    console.error('Error converting MBOX to JSON:', error);
    mainWindow?.webContents.send('download-error', {
      fileName,
      error: 'Error converting MBOX to JSON: ' + error.message,
    });
  }
} else {
  console.log('No MBOX file found in the extracted content.');
}
              }

              mainWindow?.webContents.send(
                'export-complete',
                path.basename(companyPath),
                path.basename(platformPath),
                platformId,
                extractPath,
                getTotalFolderSize(extractPath)
              );
            } catch (error) {
              console.error('Error extracting ZIP:', error);
              mainWindow?.webContents.send('download-error', {
                fileName,
                error: 'Error extracting ZIP: ' + error.message,
              });
            }
          } else {
            console.log('Non-zip file. No extraction needed.');
            mainWindow?.webContents.send(
              'export-complete',
              path.basename(companyPath),
              path.basename(platformPath),
              platformId,
              idPath,
              getTotalFolderSize(idPath)
            );
          }
        })
        .catch((error: Error) => {
          console.error('Download failed:', error);
          console.error('Error stack:', error.stack);
          mainWindow?.webContents.send('download-error', {
            fileName,
            error: error.message,
          });
        });
    },
  );
};

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('set-default-browser', async () => {
  if (
    !(
      app.isDefaultProtocolClient('http') &&
      app.isDefaultProtocolClient('https')
    )
  ) {
    app.setAsDefaultProtocolClient('http');
    app.setAsDefaultProtocolClient('https');
  }
});

ipcMain.on('close-url', (event) => {
  mainWindow?.removeBrowserView(mainWindow?.getBrowserView());
});

ipcMain.on('check-for-updates', () => {
              autoUpdater
                .checkForUpdates()
                .then((updateCheckResult) => {
                  if (
                    updateCheckResult.updateInfo &&
                    updateCheckResult.updateInfo.version &&
                    updateCheckResult.updateInfo.version === app.getVersion()
                  ) {
                    dialog.showMessageBox(mainWindow, {
                      type: 'info',
                      title: 'No Updates',
                      buttons: ['OK'],
                      message: 'You are already on the latest version.',
                    });
                  }
                })
                .catch((err) => {
                  dialog.showErrorBox(
                    'Update Error',
                    'Failed to check for updates: ' + err.toString(),
                  );
                });
});

ipcMain.on('handle-update', (event, company, name, platformId, data, runID, customFilePath = null) => {
  console.log(
    'handling update for: ',
    company,
    ', specific name: ',
    name,
    ', runID: ',
    runID,
  );

  const userData = app.getPath('userData');
  const filePath = customFilePath ? customFilePath : path.join(
    userData,
    'surfer_data',
    company,
    name,
    platformId,
    `${platformId}.json`
  );

  console.log('filePath: ', filePath);

  // Read existing data if available
let existingData;
if (fs.existsSync(filePath)) {
  try {
    existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Check if the existing data has the correct structure
    if (
      !existingData.company ||
      !existingData.name ||
      !existingData.runID ||
      !existingData.timestamp ||
      !Array.isArray(existingData.content)
    ) {
      throw new Error('Invalid data structure');
    }
  } catch (error) {
    console.error('Error reading or parsing existing file:', error);
    // If there's an error or invalid structure, we'll create a new structure
    existingData = null;
  }
}

if (!existingData) {
  // Create the necessary directories if they don't exist
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  // Initialize the file with the basic structure
  existingData = {
    company,
    name,
    runID,
    timestamp: Date.now(),
    content: [],
  };
  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
}

  let parsedData = JSON.parse(data);

  // Add the added_to_db key
  parsedData.added_to_db = new Date().toISOString();

  // Append the updated email content to the existing data
  existingData.content.push(parsedData);

  // Write the updated data
  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

  console.log(`Data appended to: ${filePath}`);
});
 
ipcMain.on('handle-update-complete', (event, runID, platformId, company, name, customFilePath = null) => {
  const filePath = customFilePath ? customFilePath : path.join(app.getPath('userData'), 'surfer_data', company, name, platformId, `${platformId}.json`)
  console.log('this filepath: ', filePath)
  const folderPath = path.join(
    app.getPath('userData'),
    'surfer_data',
    company,
    name,
    platformId,
  );

  // if (!fs.existsSync(filePath)) 

  if (fs.existsSync(filePath)) {
  mainWindow?.webContents.send(
    'export-complete',
    company,
    name,
    runID,
    folderPath,
    getTotalFolderSize(folderPath),
  );
  }
})


ipcMain.on('handle-export', (event, runID, platformId, filename, company, name, content, isUpdated) => {
  console.log(
    'handling export for: ',
    company,
    ', specific name: ',
    name,
    ', runID: ',
    runID,
  );

  const userData = app.getPath('userData');
  const surferDataPath = path.join(userData, 'surfer_data');
  const platformPath = path.join(surferDataPath, company);
  const namePath = path.join(platformPath, name);
  const idPath = path.join(namePath, runID);
  

  // Create necessary folders
  [surferDataPath, platformPath, namePath, idPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const timestamp = Date.now();
  let fileName;

    fileName = `${platformId}.json`;


    fileName = `${platformId}_${timestamp}.json`;

  const filePath = path.join(idPath, fileName);

  // Prepare the data object
  const exportData = {
    company,
    name,
    runID,
    timestamp,
    content: Array.isArray(content) ? content : [content],
  };

  // Write the JSON file
  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

  console.log(`Export saved to: ${filePath}`);
  //get the size of the export

  mainWindow?.webContents.send(
    'export-complete',
    company,
    name,
    runID,
    idPath,
    getTotalFolderSize(idPath),
  );
});

ipcMain.on('connect-website', (event, company) => {
  mainWindow?.webContents.send('connect-website', company);
});

autoUpdater.on('update-available', (info) => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Would you like to download it now?`,
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1,
    })
    .then((result) => {
      if (result.response === 0) {
        // User clicked 'Yes'
        mainWindow?.webContents.send('update-download-progress', 0);        
        autoUpdater.downloadUpdate();
      }
    });
});

autoUpdater.on('download-progress', (progressObj) => {
  let message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(message);
  // Optionally, send this to the renderer to show a progress bar
  mainWindow?.webContents.send('update-download-progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message:
        'Update downloaded. The application will restart to install the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })
    .then((result) => {
      if (result.response === 0) {
        mainWindow?.webContents.send('update-download-progress', 100);      
        autoUpdater.quitAndInstall();
      }

      else {
        mainWindow?.webContents.send('update-download-progress', null);
      }
    });
});

autoUpdater.on('error', (info) => {
  console.log('AUTOUPDATER');
  console.log(info);
  dialog.showMessageBox({
    type: 'info', // Can be "none", "info", "error", "question" or "warning"
    title: 'Surfer', // Title of the alert window
    message: String(info), // The content of the alert
    buttons: ['OK'], // Defines a single OK button
  });
  // curWindow.showMessage(info);
});

ipcMain.on('auth-token-from-webview', (event, token) => {
  console.log('Token received in main process:', token);
  // Send the token to the renderer process (Onboarding component)
  mainWindow?.webContents.send('auth-token-for-renderer', token);
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

app.on('window-all-closed', () => {
  // Terminate the llamafile server if it's running

  // killNitroServer();

  try {
    downloadingItems.forEach((item, key) => {
      if (item) {
        item.cancel();
        downloadingItems.delete(key); // Remove the item from the map
      }
    });
  } catch (error) {
    console.log('DOWNLOAD CANCEL ERROR: ', error);
  }

  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const createRequiredFolders = () => {
  const userDataPath = app.getPath('userData');
  const browserDataPath = path.join(userDataPath, 'browser-data');
  const workspacesPath = path.join(userDataPath, 'workspaces');

  const foldersToCreate = [browserDataPath, workspacesPath];

  foldersToCreate.forEach((folderPath) => {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: ${folderPath}`);
    }
  });
};

app
  .whenReady()
  .then(async () => {
    app.setAccessibilitySupportEnabled(true);

    createWindow();

    createRequiredFolders();

    autoUpdater.checkForUpdates();



    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });

    powerMonitor.on('resume', () => {
      console.log('System resumed from sleep, checking for missed jobs.');
    });

    protocol.handle('media', (req) => {
      let pathToMedia = new URL(req.url).pathname;

      // Remove leading slash on Windows
      if (process.platform === 'win32') {
        pathToMedia = pathToMedia.replace(/^\//, '');
      }

      // Decode the URI component to handle spaces and special characters
      pathToMedia = decodeURIComponent(pathToMedia);

      return net.fetch(`file://${pathToMedia}`);
    });

    try {
      let iconPath = !isDebug
        ? path.join(__dirname, 'assets/icon.png')
        : path.join(__dirname, '../../assets/icon.png');
      let icon = nativeImage.createFromPath(iconPath);

      icon = icon.resize({
        height: 16,
        width: 16,
      });
      appIcon = new Tray(icon);
    } catch (error) {
      console.error('Error creating icon: ', error);
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Window',
        type: 'normal',
        click: () => {
          createWindow();
        },
      },
      {
        label: 'Quit',
        type: 'normal',
        click: () => {
          app.quit();
        },
      },
    ]);

    // Make a change to the context menu
    contextMenu.items[1].checked = false;

    // Call this again for Linux because we modified the context menu
    if (appIcon) {
      appIcon.setContextMenu(contextMenu);
    }
  })
  .catch(console.log);

app.on('will-finish-launching', () => {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send('open-url', url);
    }
  });
});

ipcMain.on('open-folder', (event, folderPath) => {
  if (folderPath) {
    shell
      .openPath(folderPath)
      .then((error) => {
        if (error) {
          console.error('Error opening folder:', error);
          // Optionally, you can send an error message back to the renderer process
          event.reply('open-folder-error', error);
        }
      })
      .catch((error) => {
        console.error('Error opening folder:', error);
        // Optionally, you can send an error message back to the renderer process
        event.reply('open-folder-error', error.message);
      });
  } else {
    console.error('Invalid folder path');
    // Optionally, you can send an error message back to the renderer process
    event.reply('open-folder-error', 'Invalid folder path');
  }
});

ipcMain.on('get-artifact-files', (event, exportPath) => {
  try {
    console.log('Reading artifact files from:', exportPath);
    const artifactFiles: { name: string; content: string }[] = [];

    function readFilesRecursively(currentPath: string) {
      const items = fs.readdirSync(currentPath);
      items.forEach((item) => {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          readFilesRecursively(itemPath);
        } else {
          const fileExtension = path.extname(item).toLowerCase();
          if (['.json', '.txt', '.md'].includes(fileExtension)) {
            const content = fs.readFileSync(itemPath, 'utf-8');
            artifactFiles.push({ name: item, content });
          }
        }
      });
    }

    readFilesRecursively(exportPath);

    console.log('Artifact files length:', artifactFiles.length);
    event.reply('artifact-files', artifactFiles);
  } catch (error) {
    console.error('Error reading artifact files:', error);
    event.reply('artifact-files', []); // Always send an array, even if empty
  }
});

ipcMain.on('open-platform-export-folder', (event, company, name) => {
  console.log('open-platform-export-folder', company, name);
  const exportFolderPath = path.join(app.getPath('userData'), 'surfer_data', company, name);
  console.log('exportFolderPath', exportFolderPath);
  shell.openPath(exportFolderPath);
});

// app.on('before-quit', (event) => {
//   event.preventDefault(); // Prevent the app from quitting immediately
//   mainWindow?.webContents.send('stop-all-jobs');
// });

// // ... rest of the existing code ...

// ipcMain.on('jobs-stopped', () => {
//   app.exit(0); // Now we can safely exit the app
// });
