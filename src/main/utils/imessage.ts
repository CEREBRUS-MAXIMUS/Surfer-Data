import { getTotalFolderSize } from '../helpers/platforms';
import path from 'path';
import { PythonUtils } from './python';
import fs from 'fs';
import { dialog } from 'electron';
import { mainWindow } from '../main';
import { SystemZone } from 'luxon';
import { execFile } from 'child_process';
import { app } from 'electron';
import os from 'os';
import sqlite3 from 'sqlite3';

const pythonUtils = new PythonUtils();

export async function getImessageData(
  event: any,
  company: string,
  name: string,
  id: string,
) {
  if (process.platform === 'win32') {
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
  } else if (process.platform === 'darwin') {
    console.log('inside mac');
    const username = process.env.USERNAME || process.env.USER;
    const defaultPath = path.join(
      '/Users',
      username,
      'Library',
      'Messages',
      'chat.db', // Path to chat.db file on macOS
    );
    console.log(defaultPath);

    // needs full disk access to electron and vs code
    const hasAccess = fs.existsSync(defaultPath);
    if (!hasAccess) {
      console.log('Permission denied to access iMessage database file.');
      mainWindow?.webContents.send(
        'console-log',
        id,
        'Permission denied. Please grant Full Disk Access to the app.',
      );
      return null;
    }

    if (!fs.existsSync(defaultPath)) {
      console.log('NEED TO BACKUP YOUR IMESSAGE DATABASE FILE!');
      return null;
    }

    mainWindow?.webContents.send(
      'console-log',
      id,
      'Found iMessages Database file, now exporting iMessages (will take a few minutes)',
    );

    const folder_path = defaultPath;
    const company = 'Apple';
    const name = 'iMessage';
    const password = 'password';
    const app_data_path = path.join(app.getPath('userData'));

    // Check if the iMessage database exists

    if (!fs.existsSync(defaultPath)) {
      console.log('chat.db file does not exist!');
      return null;
    }
    try {
      const db = new sqlite3.Database(
        defaultPath,
        //sqlite3.OPEN_READONLY,
        (err) => {
          if (err) {
            console.error('Error opening database1:', err);
            return null;
          }
          console.log('Connected to the chat.db database.');
        },
      );
      /*
      db.serialize(() => {
        db.all('SELECT * FROM message', (err, rows) => {
          if (err) {
            console.error('Error fetching data:', err);
            return null;
          }
          console.log('Fetched data:', rows);
          // Process the fetched data as needed
        });
      });
*/
      /*const messageQuery = `
        SELECT
          message.ROWID,
          message.attributedBody,
          message.text,
          message.handle_id,
          message.date,
          handle.id,
          chat.chat_identifier,
          chat.display_name,
          message.is_from_me,
          message.date_read
        FROM
          message
        JOIN
          handle ON message.handle_id = handle.ROWID
        JOIN
          chat_message_join ON message.ROWID = chat_message_join.message_id
        JOIN
          chat ON chat_message_join.chat_id = chat.ROWID
        ORDER BY
          message.date DESC;
      `;*/
      const messageQuery = `SELECT * FROM message`;
      console.log('messageQuery3', messageQuery);

      // Execute the message query
      db.all(messageQuery, [], (err, messages) => {
        if (err) {
          console.error('Error fetching messages:', err.message);
          return;
        }

        // Execute the contacts query
        console.log('messages', messages);
      });

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        console.log('Closed the database connection.');
      });
    } catch (error) {
      console.error('Error accessing the database:', error);
      return null;
    }
  }
}
