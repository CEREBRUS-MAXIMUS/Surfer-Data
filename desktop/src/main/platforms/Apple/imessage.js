const { ipcRenderer } = require('electron');
const { customConsoleLog  } = require('../../preloadFunctions');

async function exportiMessage(id, platformId, filename, company, name) {
  customConsoleLog(id, 'Exporting iMessages');
  const messageData = await ipcRenderer.invoke(
    'get-imessage-data',
    company,
    name, 
    id,
  );
  return 'NOTHING';
}

module.exports = exportiMessage;
