import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
  dialog,
} from 'electron';
import { autoUpdater } from 'electron-updater';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    return [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Command+O',
          },
          {
            label: '&Close',
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development' ||
          process.env.DEBUG_PROD === 'true'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Command+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  },
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                  },
                },
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                  },
                },
              ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Check for Updates',
            click: () => {
              autoUpdater
                .checkForUpdates()
                .then((updateCheckResult) => {
                  if (
                    updateCheckResult.updateInfo &&
                    updateCheckResult.updateInfo.version &&
                    updateCheckResult.updateInfo.version === app.getVersion()
                  ) {
                    dialog.showMessageBox(this.mainWindow, {
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
            },
          },
          {
            label: 'Learn More',
            click() {
              shell.openExternal('https://surferprotocol.org');
            },
          },
          {
            label: 'Join Community',
            click() {
              shell.openExternal('https://discord.gg/Tjg7pjcFNP');
            },
          },
          {
            label: 'Releases',
            click() {
              shell.openExternal(
                'https://github.com/Surfer-Org/Protocol/tree/main/desktop',
              );
            },
          },
        ],
      },
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O',
          },
          {
            label: '&Close',
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development' ||
          process.env.DEBUG_PROD === 'true'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  },
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen(),
                    );
                  },
                },
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen(),
                    );
                  },
                },
              ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Check for Updates',
            click: () => {
              autoUpdater
                .checkForUpdates()
                .then((updateCheckResult) => {
                  if (
                    updateCheckResult.updateInfo &&
                    updateCheckResult.updateInfo.version &&
                    updateCheckResult.updateInfo.version === app.getVersion()
                  ) {
                    dialog.showMessageBox(this.mainWindow, {
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
            },
          },
          {
            label: 'Learn More',
            click() {
              shell.openExternal('https://surferprotocol.org');
            },
          },
          {
            label: 'Join Community',
            click() {
              shell.openExternal('https://discord.gg/Tjg7pjcFNP');
            },
          },
          {
            label: 'Releases',
            click() {
              shell.openExternal(
                'https://github.com/Surfer-Org/Protocol/tree/main/desktop',
              );
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
