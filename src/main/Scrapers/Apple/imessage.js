const { ipcRenderer } = require('electron');
const { customConsoleLog, bigStepper } = require('../../preloadFunctions');

async function exportiMessage(id, platformId, company, name) {
    customConsoleLog(id, 'Exporting iMessages');
    const messageData = await ipcRenderer.invoke('get-imessage-data');
    customConsoleLog(id, messageData);
}

module.exports = exportiMessage;
