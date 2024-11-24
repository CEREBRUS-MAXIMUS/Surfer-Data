import { app, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { getTotalFolderSize } from '../helpers/platforms';
import { mainWindow } from '../main';
import { PythonUtils } from './python';

interface Message {
  id: number;
  text: string;
  date: number;
  contact: string;
  is_from_me: number;
}

interface ContactRecord {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
}

const pythonUtils = new PythonUtils();

/**
 * Finds the path to the macOS AddressBook SQLite database.
 *
 * This function searches the "Sources" directory, which contains dynamic subfolders
 * (unique for each contact source), and returns the path to the first valid
 * AddressBook database file it finds. Since the subfolder are dynamic, we cannot hard code the path.
 *
 * TODO: MORE TESTING NEEDED
 */
const getContactsDbPath = (username: string) => {
  const sourcesDir = path.join(
    '/Users',
    username,
    'Library',
    'Application Support',
    'AddressBook',
    'Sources',
  );

  if (!fs.existsSync(sourcesDir)) {
    throw new Error(`Sources directory not found: ${sourcesDir}`);
  }

  const sourceFolders = fs.readdirSync(sourcesDir);

  // Iterate through all subfolders
  for (const folder of sourceFolders) {
    const dbPath = path.join(sourcesDir, folder, 'AddressBook-v22.abcddb');
    if (fs.existsSync(dbPath)) {
      return dbPath; // Return the first valid database file. Maybe edit later to aggregate/join all sources.
    }
  }

  throw new Error('No AddressBook database found in Sources.');
};

/**
 * Gets iMessage data from either Windows or macOS.
 * TODO: Refactor to use the same language for both platforms. Improves maintainability.
 */
export async function getImessageData(
  event: any,
  company: string,
  name: string,
  id: string,
) {
  const username = process.env.USERNAME || process.env.USER;
  if (!username) {
    console.error('No username found');
    return null;
  }

  //Use python scripting for Windows
  if (process.platform === 'win32') {
    const defaultPath = path.join(
      'C:',
      'Users',
      username,
      'Apple',
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

        if (!scriptOutput) {
          throw new Error('No script output received');
        }

        mainWindow?.webContents.send(
          'console-log',
          id,
          'iMessage export complete!',
        );

        const folderPath = scriptOutput.split('\n').pop()?.trim();
        if (!folderPath) {
          throw new Error('No folder path received');
        }

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
  }
  //Use native ts for macOS
  else if (process.platform === 'darwin') {
    const macMessageDbPath = path.join(
      '/Users',
      username,
      'Library',
      'Messages',
      'chat.db',
    );

    if (!fs.existsSync(macMessageDbPath)) {
      console.log('iMessage database not found!');
      return null;
    }

    try {
      // Create output directory
      const outputDir = path.join(
        app.getPath('userData'),
        'surfer_data',
        company,
        name,
        id,
      );
      fs.mkdirSync(outputDir, { recursive: true });

      // Copy database to prevent locked file issues
      const tempDbPath = path.join(outputDir, 'chat.db');
      fs.copyFileSync(macMessageDbPath, tempDbPath);

      // Connect to databases
      const db = new sqlite3.Database(tempDbPath);
      const query = promisify<string, Message[]>(db.all).bind(db);

      // Fetch messages
      const messages = await query(`
        SELECT 
          message.ROWID as id,
          message.text,
          message.date,
          handle.id as contact_id,
          message.is_from_me
        FROM message 
        LEFT JOIN handle ON message.handle_id = handle.ROWID
        ORDER BY message.date DESC
      `);

      // Connect to contacts database
      const contactsDbPath = getContactsDbPath(username);
      const contactsDb = new sqlite3.Database(contactsDbPath);
      const contactQuery = promisify<string, ContactRecord[]>(
        contactsDb.all,
      ).bind(contactsDb);

      // Fetch contacts with proper typing

      const contacts = await contactQuery(`
        SELECT 
          ZABCDRECORD.ZFIRSTNAME as first_name,
          ZABCDRECORD.ZLASTNAME as last_name,
          ZABCDPHONENUMBER.ZFULLNUMBER as phone_number,
          ZABCDEMAILADDRESS.ZADDRESS as email
        FROM ZABCDRECORD
        LEFT JOIN ZABCDPHONENUMBER ON ZABCDRECORD.Z_PK = ZABCDPHONENUMBER.ZOWNER
        LEFT JOIN ZABCDEMAILADDRESS ON ZABCDRECORD.Z_PK = ZABCDEMAILADDRESS.ZOWNER
        WHERE ZABCDRECORD.ZFIRSTNAME IS NOT NULL 
          OR ZABCDRECORD.ZLASTNAME IS NOT NULL
      `);

      // Create contact mapping using both email and phone
      const contactDict: { [key: string]: string } = {};
      contacts.forEach((contact: any) => {
        const fullName =
          contact.first_name && contact.last_name
            ? `${contact.first_name} ${contact.last_name}`
            : contact.first_name || contact.last_name;

        // Map phone numbers
        if (contact.phone_number) {
          // Clean the phone number to match iMessage format
          const cleanPhone = contact.phone_number.replace(/\D/g, '');
          // Map various formats to be sure safe
          contactDict[`+${cleanPhone}`] = fullName;
          contactDict[cleanPhone] = fullName;
          contactDict[`+1${cleanPhone}`] = fullName;
        }

        // Map email addresses as well
        if (contact.email) {
          contactDict[contact.email.toLowerCase()] = fullName;
        }
      });

      // Process messages with updated contact matching
      const messageList = messages.map((msg: any) => {
        let contactName = msg.contact_id; // This is now the handle ID (phone/email)

        // Try to match the contact
        if (contactName) {
          // For phone numbers, try different formats
          if (contactName.match(/^\+?[\d-]+$/)) {
            const cleanPhone = contactName.replace(/\D/g, '');
            contactName =
              contactDict[contactName] ||
              contactDict[`+${cleanPhone}`] ||
              contactDict[cleanPhone] ||
              contactDict[`+1${cleanPhone}`] ||
              contactName;
          } else {
            // For emails, try lowercase matching
            contactName = contactDict[contactName.toLowerCase()] || contactName;
          }
        }

        return {
          id: msg.id,
          text: msg.text,
          timestamp: new Date(msg.date / 1e6 + 978307200000).toISOString(),
          contact: contactName,
          is_from_me: msg.is_from_me === 1,
        };
      });

      const output = {
        company,
        name,
        runID: id,
        timestamp: parseInt(id.split('-').pop() || '0'),
        content: messageList,
      };

      // Save to file
      const outputPath = path.join(outputDir, 'imessage-001.json');
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

      // Clean up
      db.close();
      contactsDb.close();
      fs.unlinkSync(tempDbPath);

      mainWindow?.webContents.send(
        'export-complete',
        company,
        name,
        id,
        outputDir,
        getTotalFolderSize(outputDir),
      );

      return outputDir;
    } catch (error) {
      console.error('Error accessing Mac iMessage database:', error);
      return null;
    }
  } else {
    console.log('Unsupported platform:', process.platform);
    return null;
  }
}
