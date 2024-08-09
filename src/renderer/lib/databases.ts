import Dexie, { Table } from 'dexie';
import { IHistory, IPassword, IUserFile } from '../types/interfaces';
import { v4 as uuidv4 } from 'uuid'; // Add this import

//
// Declare Databases
//

class HistoryDatabase extends Dexie {
  public history!: Table<IHistory, number>;

  public constructor() {
    super('HistoryDatabase');
    this.version(1).stores({
      history: '++id, URL, Title, HumanVisitCount, AIVisitCount, LastVisitTime, initiator, keywords, mostRecentMarkdown, mostRecentTools, mostRecentRawHTML, snapshots, favicon, ignoredByVectorDB, platformId'
    });
  }
}

class PasswordDatabase extends Dexie {
  public passwords!: Table<IPassword, number>;

  public constructor() {
    super('PasswordDatabase');
    this.version(1).stores({
      passwords: '++id,loginURL,userName,password,createDate',
    });
  }
}

// Define the UserFile database
class UserFileDatabase extends Dexie {
  public files!: Table<IUserFile, string>;

  public constructor() {
    super('UserFileDatabase');
    this.version(3).stores({ // Increment version number
      files: 'uniqueID, id, userId, path, dateCreated, dateModified, type, content, mimeType, size, lastIndexed'
    });
  }
}

export const historyDB = new HistoryDatabase();
export const passwordDB = new PasswordDatabase();
export const userFileDB = new UserFileDatabase();

// Updated function to import history
export async function importHistory(historyItems: IHistory[]) {
  try {
    const existingHistory = await historyDB.history.toArray();
    const historyMap = new Map(existingHistory.map(h => [h.URL, h]));

    const historyToAdd: IHistory[] = [];
    const historyToUpdate: IHistory[] = [];

    for (const newHistoryItem of historyItems) {
      const existingItem = historyMap.get(newHistoryItem.URL);

      // Determine if the item should be ignored by the vector database
      newHistoryItem.ignoredByVectorDB =
        newHistoryItem.URL.startsWith('chrome-extension://') ||
        newHistoryItem.URL.startsWith('file:///') ||
        newHistoryItem.URL.startsWith('http://localhost') ||
        newHistoryItem.URL.startsWith('http://127.0.0.1') ||
        newHistoryItem.URL.startsWith('https://accounts.google.com') ||
        newHistoryItem.URL.startsWith('https://www.google.com/search?q=') ||
        newHistoryItem.URL.startsWith('https://challenges.cloudflare.com') ||
        newHistoryItem.URL === 'https://twitter.com/Google';

      //Fetch favicon for the new history item if not ignored
      if (!newHistoryItem.ignoredByVectorDB && newHistoryItem.HumanVisitCount > 5) {
        const favicon = await fetchFavicon(newHistoryItem.URL);
        newHistoryItem.favicon = favicon || newHistoryItem.favicon;
      }

      if (!existingItem) {
        historyToAdd.push({...newHistoryItem});
      } else {
        const newDate = new Date(newHistoryItem.LastVisitTime);
        const existingDate = new Date(existingItem.LastVisitTime);

        if (newDate > existingDate) {
          historyToUpdate.push({
            ...newHistoryItem,
            id: existingItem.id,
            HumanVisitCount: existingItem.HumanVisitCount + newHistoryItem.HumanVisitCount,
            AIVisitCount: existingItem.AIVisitCount + newHistoryItem.AIVisitCount,
            keywords: existingItem.keywords,
            mostRecentRawHTML: newHistoryItem.mostRecentRawHTML,
            initiator: newHistoryItem.initiator,
            mostRecentMarkdown: newHistoryItem.mostRecentMarkdown,
            mostRecentTools: newHistoryItem.mostRecentTools,
            URL: newHistoryItem.URL,
            favicon: newHistoryItem.favicon || existingItem.favicon, // Update favicon if new one is fetched
            snapshots: {
              ...existingItem.snapshots,
              [newHistoryItem.LastVisitTime]: newHistoryItem.mostRecentMarkdown
            }
          });
        }
      }
    }

    if (historyToAdd.length > 0) {
      await historyDB.history.bulkAdd(historyToAdd);
    }

    if (historyToUpdate.length > 0) {
      await historyDB.history.bulkPut(historyToUpdate);
    }

    // Update vector database only with items that are not ignored
    let beforeCount = historyItems.length;
    const itemsToIndex = [...historyToAdd, ...historyToUpdate];
    let afterCount = itemsToIndex.length;
    console.log("CHROMA_REPORT: Before count", beforeCount);
    console.log("CHROMA_REPORT: After count", afterCount);
    console.log(`History imported successfully: ${historyToAdd.length} added, ${historyToUpdate.length} updated`);
    return historyToAdd.length + historyToUpdate.length;
  } catch (error) {
    console.error('Error importing history:', error);
    throw error;
  }
}

const faviconCache = new Map<string, string | null>();

async function fetchFavicon(url: string): Promise<string | null> {
  const domain = new URL(url).hostname;
  if (faviconCache.has(domain)) {
    return faviconCache.get(domain) || null;
  }

  try {
    const response = await fetch(`https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`);
    if (response.ok) {
      const faviconUrl = response.url;
      faviconCache.set(domain, faviconUrl);
      return faviconUrl;
    }
  } catch (error) {
    console.error('Error fetching favicon:', error);
  }

  faviconCache.set(domain, null);
  return null;
}

// Updated function to import passwords
export async function importPasswords(passwordItems: IPassword[]) {
  try {
    const existingPasswords = await passwordDB.passwords.toArray();
    const passwordMap = new Map(existingPasswords.map(p => [p.loginURL, p]));

    const passwordsToAdd: IPassword[] = [];
    const passwordsToUpdate: IPassword[] = [];

    for (const newPassword of passwordItems) {
      const existingPassword = passwordMap.get(newPassword.loginURL);

      if (!existingPassword) {
        passwordsToAdd.push(newPassword);
      } else {
        const newDate = new Date(newPassword.createDate);
        const existingDate = new Date(existingPassword.createDate);

        if (newDate > existingDate) {
          passwordsToUpdate.push({
            ...newPassword,
            id: existingPassword.id
          });
        }
      }
    }

    if (passwordsToAdd.length > 0) {
      await passwordDB.passwords.bulkAdd(passwordsToAdd);
    }

    if (passwordsToUpdate.length > 0) {
      await passwordDB.passwords.bulkPut(passwordsToUpdate);
    }

    console.log(`Passwords imported successfully: ${passwordsToAdd.length} added, ${passwordsToUpdate.length} updated`);
    return passwordsToAdd.length + passwordsToUpdate.length;
  } catch (error) {
    console.error('Error importing passwords:', error);
    throw error;
  }
}


// Add this new function to add a URL to the history
export async function addToHistory(historyItem: IHistory) {
  try {
    console.log('Adding to history:', historyItem);
    const existingItem = await historyDB.history.get(historyItem.URL);
    //console.log('existingItem', existingItem);

    let updatedItem: IHistory;

    if (existingItem) {
      // Update existing item
      updatedItem = {
        ...existingItem,
        AIVisitCount: existingItem.AIVisitCount + 1,
        LastVisitTime: historyItem.LastVisitTime,
        Title: historyItem.Title,
        mostRecentMarkdown: historyItem.mostRecentMarkdown,
        mostRecentTools: historyItem.mostRecentTools,
        initiator: historyItem.initiator,
        favicon: historyItem.favicon, // Add this line
        snapshots: {
          ...existingItem.snapshots,
          [historyItem.LastVisitTime]: historyItem.mostRecentMarkdown
        }
      };
      await historyDB.history.update(existingItem.id!, updatedItem);
    } else {
      // Add new item
      updatedItem = {
        ...historyItem,
        favicon: historyItem.favicon, // Add this line
        snapshots: {
          [historyItem.LastVisitTime]: historyItem.mostRecentMarkdown
        }
      };
      await historyDB.history.add(updatedItem);
    }

    console.log('URL added/updated in history:', historyItem.URL);
  } catch (error) {
    console.error('Error adding URL to history:', error);
  }
}

// New function to delete history item
export async function deleteHistoryItem(url: string) {
  try {
    await historyDB.history.where('URL').equals(url).delete();
    // TODO: Implement deletion from vector database if needed
    console.log('History item deleted:', url);
  } catch (error) {
    console.error('Error deleting history item:', error);
  }
}

export async function getTopFiftyHistoryItems() {
  const historyItems = await historyDB.history.orderBy('HumanVisitCount').reverse().limit(50).toArray();
  //console.log('historyItems', historyItems);
  return historyItems.map(item => ({
    ...item,
    URL: item.URL.toString()
  }));
}

export async function getFiveMostRecentHistoryItems() {
  const historyItems = await historyDB.history.orderBy('LastVisitTime').reverse().limit(5).toArray();
  return historyItems.map(item => ({
    ...item,
    URL: item.URL.toString(),
    title: item.Title,
    last_visit_time: item.LastVisitTime,
  }));
}

export async function searchHistoryByTitle(term: string, count: number, visitCountThreshold: number = 5) {
  try {
    const results = await historyDB.history
      .where('Title')
      .startsWithIgnoreCase(term)
      //filter this such that we only return items that have been visited by a human or AI more than 5 times
      .filter(item => !item.ignoredByVectorDB && (item.HumanVisitCount + item.AIVisitCount) > visitCountThreshold)
      .toArray();

    results.sort((a, b) => (b.HumanVisitCount + b.AIVisitCount) - (a.HumanVisitCount + a.AIVisitCount));

    return results.slice(0, count);
  } catch (error) {
    console.error('Error searching history by title:', error);
    return [];
  }
}

// Function to add a user file
export async function addUserFile(file: IUserFile) {
  try {
    const fileWithUniqueID = {
      ...file,
      uniqueID: file.uniqueID || uuidv4(), // Use existing uniqueID or generate a new one
    };
    await userFileDB.files.add(fileWithUniqueID);
    console.log('User file added successfully');
    return fileWithUniqueID.uniqueID;
  } catch (error) {
    console.error('Error adding user file:', error);
    throw error;
  }
}

// Function to add user files in bulk
export async function addUserFiles(files: IUserFile[]) {
  try {
    const filesWithUniqueID = files.map(file => ({
      ...file,
      uniqueID: file.uniqueID || uuidv4(), // Use existing uniqueID or generate a new one
    }));
    await userFileDB.files.bulkAdd(filesWithUniqueID);
    console.log('User files added successfully');
    return filesWithUniqueID.map(file => file.uniqueID);
  } catch (error) {
    console.error('Error adding user files:', error);
    throw error;
  }
}

// Function to search user files by query text
export async function searchUserFiles(queryText: string, count: number = 5) {
  try {
    const results = await userFileDB.files
      .filter(file => file.path.toLowerCase().includes(queryText.toLowerCase()))
      .limit(count)
      .toArray();

    results.sort((a, b) => b.dateModified - a.dateModified);

    console.log('Search results:', results);
    return results.map(result => ({
      ...result,
      uniqueID: result.uniqueID,
      mimeType: result.mimeType,
      size: result.size,
      content: result.content
    }));
  } catch (error) {
    console.error('Error searching user files:', error);
    return [];
  }
}


// Add these new functions at the end of the file

// Function to delete the History database
export async function deleteHistoryDatabase() {
  try {
    await historyDB.delete();
    console.log('History database deleted successfully');
  } catch (error) {
    console.error('Error deleting History database:', error);
    throw error;
  }
}

// Function to delete the Password database
export async function deletePasswordDatabase() {
  try {
    await passwordDB.delete();
    console.log('Password database deleted successfully');
  } catch (error) {
    console.error('Error deleting Password database:', error);
    throw error;
  }
}


// Function to delete the UserFile database
export async function deleteUserFileDatabase() {
  try {
    await userFileDB.delete();
    console.log('UserFile database deleted successfully');
  } catch (error) {
    console.error('Error deleting UserFile database:', error);
    throw error;
  }
}

// Function to delete all databases
export async function deleteAllDatabases() {
  try {
    await Promise.all([
      deleteHistoryDatabase(),
      deletePasswordDatabase(),
      deleteUserFileDatabase()
    ]);
    console.log('All databases deleted successfully');
  } catch (error) {
    console.error('Error deleting all databases:', error);
    throw error;
  }
}

export async function deleteRunsForPlatformFromDB(platformId: string) {
  try {
    await historyDB.history.where('platformId').equals(platformId).delete();
    console.log(`Runs for platform ${platformId} deleted from database`);
  } catch (error) {
    console.error('Error deleting runs for platform from database:', error);
    throw error;
  }
}

export async function deleteRunFromDB(runId: string) {
  try {
    const db = await openDB('dataExtractionDB', 1);
    await db.delete('runs', runId);
    console.log(`Run ${runId} deleted from database`);
  } catch (error) {
    console.error('Error deleting run from database:', error);
    throw error;
  }
}
