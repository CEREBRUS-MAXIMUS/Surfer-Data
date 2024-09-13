import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Menu,
  net,
  IpcMainInvokeEvent,
  Tray,
  powerMonitor,
} from 'electron';

import log from 'electron-log';
import { resolveHtmlPath } from './util';
import { dialog } from 'electron';
import { argv } from 'process';

import path, { parse } from 'path';

export function setupProtocol(mainWindow: BrowserWindow) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('surfer', process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient('surfer');
  }

  app.on('open-url', (event, url) => {
    //dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`);

    console.log('mainWindow', mainWindow);
    console.log('mainWindow.isMinimized()', mainWindow?.isMinimized());
    if (mainWindow?.isMinimized()) mainWindow.restore();
    mainWindow?.focus();

    console.log('open-url', url);
    //dialog.showErrorBox('Welcome Back', `${url}`);
    const token = url.replace('surfer://', '');
    /*dialog.showMessageBox({
      type: 'info',
      title: 'Welcome Back',
      message: `${token}`,
    });*/

    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    //send token to mainWindow
    mainWindow.webContents.send('token', token);
    /*dialog.showMessageBox({
      type: 'info',
      title: 'token sent',
      message: `${token}`,
    });*/
  });

  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    console.log('app.quit');
    app.quit();
  } else {
    console.log('app.on second-instance');
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();

        // Check for surfer:// protocol
        const deepLinkingUrl =
          process.platform === 'darwin'
            ? argv.find((arg) => arg.startsWith('surfer://'))
            : commandLine
                .find((arg) => arg.startsWith('surfer://'))
                ?.slice(0, -1);
        if (deepLinkingUrl) {
          const token = deepLinkingUrl.replace('surfer://', '');
          console.log('deepLinkingUrl', deepLinkingUrl);
          console.log('token', token);
          mainWindow.webContents.send('token', token);
        }

        // Check for http:// or https:// URLs
        const url = commandLine.find(
          (arg) => arg.startsWith('http://') || arg.startsWith('https://'),
        );
        if (url) {
          console.log('URL opened:', url);
          mainWindow.webContents.send('open-url', url);
        }

        // If you want to show a dialog for debugging, uncomment this:
        // dialog.showErrorBox('Welcome Back', `Deep link: ${deepLinkingUrl}, URL: ${url}`);
      }
    });
  }
}
