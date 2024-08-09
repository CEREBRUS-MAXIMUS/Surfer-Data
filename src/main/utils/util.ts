/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
const urlLib = require('url');
const fs = require('fs');
const mime = require('mime');
import { net } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1213;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function getFilesInFolder(folderPath: string) {
  const files: any[] = [];

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    console.log(entryPath);

    if (entry.isDirectory()) {
      files.push(...getFilesInFolder(entryPath));
    } else {
      const stats = fs.statSync(entryPath);
      const formattedDate =
        stats.birthtime.toLocaleDateString('en-US') +
        ' ' +
        stats.birthtime.toLocaleTimeString('en-US');

      files.push({
        name: entry.name,
        path: entryPath,
        size: stats.size,
        createdDate: formattedDate,
        type: mime.getType(entryPath),
      });
    }
  }

  return files;
}
