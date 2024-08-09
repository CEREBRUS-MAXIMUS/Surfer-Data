const {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  app,
} = require('electron');

const state = {
  workspaceID: '',
};

const electronHandler = {
  ipcRenderer: {
    send(channel, ...args) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel, func) {
      const subscription = (_event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel, func) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    removeAllListeners(channel) {
      ipcRenderer.removeAllListeners(channel);
    },
    removeListener(channel, listener) {
      ipcRenderer.removeListener(channel, listener);
    },
    off(channel, func) {
      const subscription = (_event, ...args) => func(...args);
      ipcRenderer.removeListener(channel, subscription);
    },
    invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args);
    },
    sendUserData(userData) {
      ipcRenderer.send('send-user-data', userData);
    },
    // Add methods for sessions data
    getSessions() {
      ipcRenderer.send('get-sessions');
    },
    onSessions(func) {
      ipcRenderer.once('sessions-data', (_event, data) => func(data));
    },
    onInitialData(func) {
      ipcRenderer.once('initial-data', (_event, data) => func(data));
    },
    getSessionID(func) {
      ipcRenderer.send('get-session-id');
    },
    handleCurrentDOMRepresentation(workspaceID, domObject) {
      console.log('handleCurrentDOMRepresentation');
      let request = {
        body: {
          workspaceID: workspaceID,
          currentDOMRepresentation: domObject,
        },
      };

      let data = {
        req: request,
      };

      // console.log('data', data);
      ipcRenderer.invoke('/currentDOMRepresentation', data);
    },
    handleCurrentTools(workspaceID, tools) {
      console.log('handleCurrentTools');
      let request = {
        body: {
          workspaceID: workspaceID,
          tools: tools,
        },
      };

      let data = {
        req: request,
      };

      console.log('data', data);
      ipcRenderer.invoke('/currentTools', data);
    },
    handlePermanentTools(workspaceID, tools) {
      console.log('handlePermanentTools');
      let request = {
        body: {
          workspaceID: workspaceID,
          tools: tools,
        },
      };

      let data = {
        req: request,
      };

      console.log('data', data);
      ipcRenderer.invoke('/permanentTools', data);
    },
    handleCurrentMarkdown(workspaceID, markdown) {
      console.log('handleCurrentMarkdown');
      let request = {
        body: {
          workspaceID: workspaceID,
          markdown: markdown,
        },
      };

      let data = {
        req: request,
      };

      console.log('data', data);
      ipcRenderer.invoke('/currentMarkdown', data);
    },
    onToolsUpdate(func) {
      ipcRenderer.on('toolsUpdate', (_event, data) => func(data));
    },
    onFullScreenChanged(callback) {
      console.log('onFullScreenChanged');
      console.log(callback);
      ipcRenderer.on('fullscreen-changed', (event, status) => callback(status));
    },
    onOpenUrl: (callback) => ipcRenderer.on('open-url', callback),
    // onWebviewNewWindow: (callback) => {
    //   ipcRenderer.on('webview-new-window', (e, webContentsId, details) => {
    //     console.log('webview-new-window', webContentsId, details);
    //     callback(webContentsId, details);
    //   });
    // },
    // Add a new method to send console commands
    sendConsoleCommand(command) {
      return ipcRenderer.invoke('execute-console-command', command);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

// Add a global function to execute console commands
contextBridge.exposeInMainWorld('executeConsoleCommand', (command) => {
  return electronHandler.ipcRenderer.sendConsoleCommand(command);
});

// Add the event listener for webview-new-window
ipcRenderer.on('webview-new-window', (e, webContentsId, details) => {
  console.log('webview-new-window', webContentsId, details);
  const url = details.url;
  const webview = document.getElementById('webview');
  if (webview) {
    console.log('webview', webview);
    const newWindowEvent = new CustomEvent('new-window', { detail: { url } });
    webview.dispatchEvent(newWindowEvent);
  }
});
