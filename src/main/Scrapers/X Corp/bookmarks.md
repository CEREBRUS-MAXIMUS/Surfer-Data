# X Corp (Twitter) Bookmarks

This module exports all bookmarks from a user's X Corp (formerly Twitter) account.

## Functionality

The `exportBookmarks()` function performs these tasks:
1. Navigates to the X Corp bookmarks page.
2. Checks if the user is logged in.
3. Iteratively scrolls through and collects bookmark data.
4. Checks for duplicate bookmarks both in the current collection and in previously exported data.
5. Sends collected bookmark data for storage. 

## Implementation

The bookmark export process is implemented as follows:
1. The function navigates to the X Corp bookmarks page if not already there.
2. It verifies if the user is logged in, prompting for sign-in if needed.
3. The function enters a loop to collect bookmarks:
   - Waits for bookmark elements to appear on the page.
   - Scrolls each bookmark into view.
   - Extracts text and timestamp data from each bookmark.
   - Checks for duplicates within the current collection and previously exported data.
   - Sends new bookmarks for storage.
   - Continues until no new bookmarks are found after multiple attempts.
4. The function sends a completion signal when all bookmarks are collected.

## Platform-specific Considerations

1. DOM Manipulation: The module relies on specific element attributes (e.g., `data-testid="cellInnerDiv"`) to identify and interact with bookmark elements.
2. Scroll Behavior: The function uses `scrollIntoView()` to load more bookmarks dynamically.
3. Duplicate Detection: The module checks for duplicates both in-memory and in previously exported files to avoid redundant data.
4. File System Interaction: The module interacts with the local file system to check for existing bookmarks.
5. IPC Communication: The function uses Electron's IPC to communicate with the main process for various operations.

## Future Improvements

1. Error Handling: Implement more robust error handling for network issues or unexpected page structures.
2. Pagination Support: If X Corp implements pagination for bookmarks, update the scraper to handle it.
3. Rate Limiting: Implement rate limiting to avoid potential blocks from X Corp's servers.
4. User Preferences: Allow users to specify date ranges or other filters for bookmark collection.
5. Incremental Updates: Optimize the process to only fetch new bookmarks since the last export.
6. Performance Optimization: Investigate ways to speed up the collection process, possibly by parallelizing some operations.
7. Authentication Handling: Improve the authentication check and login process for a smoother user experience.
