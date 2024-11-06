import { getTotalFolderSize } from './helpers';
import path from 'path';
import { PythonUtils } from './python';
import fs from 'fs';
import { dialog } from 'electron';
import { mainWindow } from '../main';

const pythonUtils = new PythonUtils();


export async function getImessageData(event: any, company: string, name: string, id: string) {
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
      mainWindow?.webContents.send(
        'console-log',
        id,
        'Got folder, now exporting iMessages (will take a few minutes)',
      );

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
          'iMessage export complete!',
        );
        // Assuming the last line of the output is the JSON file path
        const folderPath = scriptOutput.split('\n').pop()?.trim();
        console.log('JSON file path:', folderPath);
        mainWindow?.webContents.send(
          'export-complete',
          company,
          name,
          id,
          folderPath,
          getTotalFolderSize(folderPath),
        );
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
}

