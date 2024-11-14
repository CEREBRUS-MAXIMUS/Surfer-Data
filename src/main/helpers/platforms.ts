import fs from 'fs';
import path from 'path';
import { mboxParser } from 'mbox-parser';
import yauzl from 'yauzl';
import { app } from 'electron'

export function checkConnectedPlatforms(platforms: any[]) {
  const userDataPath = app.getPath('userData');
  const connectedPlatforms : any = {};

  for (const platform of platforms) {
    const { company, name } = platform;
    const platformPath = path.join(userDataPath, 'surfer_data', company, name);
    connectedPlatforms[platform.id] = fs.existsSync(platformPath);
  }

  return connectedPlatforms;
}

export async function convertMboxToJson(
  mboxFilePath: string,
  jsonOutputPath: string,
  id: string,
  company: string,
  name: string,
  runID: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(mboxFilePath);

    const data = {
      company,
      name,
      runID,
      timestamp: Date.now(),
      content: [],
    };

    mboxParser(readStream)
      .then((messages) => {
        messages.forEach((message) => {
          const jsonMessage = {
            accountID: id,
            from: message.from?.text,
            to: message.to?.text || message.to,
            subject: message.subject,
            timestamp: message.date,
            body: message.text,
            added_to_db: new Date().toISOString(),
          };

          data.content.push(jsonMessage);
        });

        fs.writeFileSync(jsonOutputPath, JSON.stringify(data, null, 2));
        console.log('MBOX to JSON conversion completed');
        resolve();
      })
      .catch((error) => {
        console.error('Error parsing MBOX:', error);
        reject(error);
      });
  });
}

export const findMboxFile = (dir: string): string | null => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const result = findMboxFile(filePath);
      if (result) return result;
    } else if (file.toLowerCase().endsWith('.mbox')) {
      return filePath;
    }
  }
  return null;
};

export function extractZip(source: string, target: string) {
  return new Promise((resolve, reject) => {
    yauzl.open(source, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          const fullPath = path.join(target, entry.fileName);
          const directory = path.dirname(fullPath);

          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            try {
              fs.mkdirSync(fullPath, { recursive: true });
              zipfile.readEntry();
            } catch (err) {
              reject(err);
            }
          } else {
            // File entry
            try {
              fs.mkdirSync(directory, { recursive: true });
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) return reject(err);
                const writeStream = fs.createWriteStream(fullPath);
                readStream.on('end', () => {
                  writeStream.end();
                  zipfile.readEntry();
                });
                readStream.pipe(writeStream);
              });
            } catch (err) {
              reject(err);
            }
          }
        });

        zipfile.on('end', resolve);
        zipfile.on('error', reject);
      });
    });
  }

export function getTotalFolderSize(folderPath: string): number {
  let totalSize = 0;
  const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += getTotalFolderSize(filePath);
      }
    }

    return totalSize;
  }

