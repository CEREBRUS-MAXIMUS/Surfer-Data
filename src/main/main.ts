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
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './utils/util';
import { createClient } from '@supabase/supabase-js';



let appIcon: Tray | null = null;

require('dotenv').config();
const { download } = require('electron-dl');

import fs from 'fs';

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

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('get-version-number', (event) => {
  event.reply('version-number', app.getVersion());
});

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

const checkAndUpdateInstallation = async () => {
  const userDataPath = app.getPath('userData');
  const installedFilePath = path.join(userDataPath, 'installed.json');
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'local';

  // Break the function if environment isn't production
  if (environment !== 'production') {
    console.log('Skipping installation check and update in non-production environment');
    return;
  }

  try {
    if (!fs.existsSync(installedFilePath)) {
      // First-time installation
      fs.writeFileSync(installedFilePath, JSON.stringify({ installed: true, version: app.getVersion(), environment }));
      
      // Push installation data to Supabase
      const { data: installationData, error: installationError } = await supabase.from('installations').insert({
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        timestamp: new Date().toISOString(),
      });

      if (installationError) {
        console.error('Error pushing installation data to Supabase:', installationError);
      } else {
        console.log('Installation data pushed to Supabase');
      }
    } else {
      // Check if it's an update
      const installedData = JSON.parse(fs.readFileSync(installedFilePath, 'utf-8'));
      console.log('IN THE ELSE STATEMENT!')
      console.log('INSTALLED DATA: ', installedData);
      console.log('APP VERSION: ', app.getVersion());
      if (installedData.version !== app.getVersion()) {
        // Update the version and environment in the file
        fs.writeFileSync(installedFilePath, JSON.stringify({ installed: true, version: app.getVersion(), environment }));
        console.log('TRYNA PUSH TO SUPABASE!')
        // Push update data to Supabase
        const { data: updateData, error: updateError } = await supabase.from('app_updates').insert({
          old_version: installedData.version,
          new_version: app.getVersion(),
          platform: process.platform,
          arch: process.arch,
          timestamp: new Date().toISOString(),
        });

        if (updateError) {
          console.error('Error pushing update data to Supabase:', updateError);
        } else {
          console.log('Update data pushed to Supabase');
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndUpdateInstallation:', error);
  }
};

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
        )
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
        platformId = `notion-001-${Date.now()}`;
        idPath = path.join(platformPath, platformId);
      } else if (
        url.includes('proddatamgmtqueue.blob.core.windows.net/exportcontainer/')
      ) {
        companyPath = path.join(surferDataPath, 'OpenAI');
        platformPath = path.join(companyPath, 'ChatGPT');
        platformId = `chatgpt-001-${Date.now()}`;
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

      // Create or clear platform_name folder
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
          const exportSize = fs.statSync(filePath).size;

          if (url.includes('file.notion.so') && filePath.endsWith('.zip')) {
            // Handle Notion ZIP extraction
            const extractPath = path.join(idPath, 'extracted');
            
            try {
              await extractZip(filePath, extractPath);
              console.log('Outer ZIP extracted to:', extractPath);

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

              console.log('Notion ZIP fully extracted to:', extractPath);
              mainWindow?.webContents.send(
                'export-complete',
                path.basename(companyPath),
                path.basename(platformPath),
                platformId,
                extractPath,
                exportSize
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
              exportSize
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

ipcMain.on('handle-export', (event, platform_name, name, content, runID) => {
  console.log(
    'handling export for: ',
    platform_name,
    ', specific name: ',
    name,
    ', runID: ',
    runID,
  );

  const userData = app.getPath('userData');
  const surferDataPath = path.join(userData, 'surfer_data');
  const platformPath = path.join(surferDataPath, platform_name);
  const namePath = path.join(platformPath, name);
  const idPath = path.join(namePath, runID);

  // Create necessary folders
  [surferDataPath, platformPath, namePath, idPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const timestamp = Date.now();
  const fileName = `${name}_${timestamp}.json`;
  const filePath = path.join(idPath, fileName);

  // Prepare the data object
  const exportData = {
    platform_name,
    name,
    runID,
    timestamp,
    content: Array.isArray(content) ? content : [content],
  };

  // Write the JSON file
  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

  console.log(`Export saved to: ${filePath}`);
  //get the size of the export
  const exportSize = fs.statSync(filePath).size;

  mainWindow?.webContents.send(
    'export-complete',
    platform_name,
    name,
    runID,
    idPath,
    exportSize,
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

    if (app.getLoginItemSettings().openAtLogin === false) {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
        path: app.getPath('exe'),
      });
    }

    await checkAndUpdateInstallation();

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
    const artifactFiles = [];

    function readFilesRecursively(currentPath) {
      const items = fs.readdirSync(currentPath);
      items.forEach((item) => {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          readFilesRecursively(itemPath);
        } else {
          const content = fs.readFileSync(itemPath, 'utf-8');
          artifactFiles.push({ name: item, content });
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
