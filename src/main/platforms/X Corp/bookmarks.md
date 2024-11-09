# X Corp (Twitter) Bookmarks

This module exports all bookmarks from a user's X Corp (formerly Twitter) account.

## Functionality

The `exportBookmarks()` function performs these tasks:
1. Navigates to the X Corp bookmarks page if not already there.
2. Retrieves necessary authentication data.
3. Fetches bookmarks using X Corp's API. 
4. Checks for duplicate bookmarks both in the current collection and in previously exported data.
5. Sends collected bookmark data for storage.

## Implementation

The bookmark export process is implemented as follows:
1. The function navigates to the X Corp bookmarks page if not already there.
2. It retrieves the necessary authentication data (bigData) for API requests.
3. The function calls `getBookmarks()` to fetch bookmarks from the API:
   - Makes API requests to retrieve bookmarks in batches.
   - Parses the API response to extract bookmark data.
   - Recursively fetches more bookmarks if available.
4. For each bookmark:
   - Checks for duplicates within the current collection and previously exported data.
   - Sends new bookmarks for storage.
   - Stops if no new bookmarks are found after multiple iterations.
5. The function sends a completion signal when all bookmarks are collected.

## Platform-specific Considerations

1. API Integration: The module now uses X Corp's API to fetch bookmarks, improving reliability and efficiency.
2. Authentication: The module requires specific authentication data (cookie, CSRF token, and authorization) for API requests.
3. Pagination: The module handles pagination through cursor-based API requests.
4. Duplicate Detection: The module checks for duplicates both in-memory and in previously exported files to avoid redundant data.
5. File System Interaction: The module interacts with the local file system to check for existing bookmarks and retrieve authentication data.
6. IPC Communication: The function uses Electron's IPC to communicate with the main process for various operations.

## Future Improvements

1. Error Handling: Implement more robust error handling for API request failures or unexpected response structures.
2. Rate Limiting: Implement rate limiting to avoid potential blocks from X Corp's servers.
3. User Preferences: Allow users to specify date ranges or other filters for bookmark collection.
4. Incremental Updates: Optimize the process to only fetch new bookmarks since the last export.
5. Performance Optimization: Investigate ways to speed up the collection process, possibly by parallelizing some operations.
6. Authentication Handling: Improve the process of obtaining and refreshing authentication data.
7. Media Handling: Enhance the parsing of media attachments to support a wider range of media types and formats.
