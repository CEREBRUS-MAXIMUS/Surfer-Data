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
    off(channel, func) {
      const subscription = (_event, ...args) => func(...args);
      ipcRenderer.removeListener(channel, subscription);
    },
    invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

module.exports = electronHandler