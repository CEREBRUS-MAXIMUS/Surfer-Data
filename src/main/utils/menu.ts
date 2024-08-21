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
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Surfer',
      submenu: [
        {
          label: 'About Surfer',
          selector: 'orderFrontStandardAboutPanel:',
        },
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
        { type: 'separator' },
        { label: 'Settings', submenu: [] },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide Surfer',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit Surfer',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    //chat menu: Create New Chat, Regenerate Last Message, Delete Chat
    const subMenuChat: MenuItemConstructorOptions = {
      label: 'Chat',
      submenu: [
        {
          label: 'Create New Chat',
          accelerator: 'Command+D',
          click: () => {
            //this.mainWindow.webContents.toggleDevTools();
          },
        },
        {
          label: 'Regenerate Last Message',
          accelerator: 'Command+E',
          click: () => {
            //this.mainWindow.webContents.toggleDevTools();
          },
        },
        {
          label: 'Delete Chat',
          click: () => {
            //this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };

    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            shell.openExternal('https://surfsup.ai');
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
              'https://github.com/CEREBRUS-MAXIMUS/Surfer-Test-Autoupdate',
            );
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuEdit,
      subMenuChat,
      subMenuView,
      subMenuWindow,
      subMenuHelp,
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
        label: 'Surfer',
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
              shell.openExternal('https://surfsup.ai');
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
                'https://github.com/CEREBRUS-MAXIMUS/Surfer-Test-Autoupdate',
              );
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
