# Gmail

This module is responsible for scraping email data from a user's Gmail account.

## Functionality

The `exportGmail()` function in the `gmail.js` file performs the following tasks:

1. Checks if this is the first export or a subsequent one.
2. For the first export:
   - Initiates a Google Takeout process to download all emails.
   - Navigates to Gmail to wait for the Takeout email.
   - Downloads the Takeout data.
3. For subsequent exports:
   - Checks if the user is connected to their Gmail account.
   - Collects new email content and stores it in an array.
   - Navigates through emails and checks for duplicates.
   - Updates the local storage with new emails.

## Implementation

The Gmail export functionality is implemented in the `gmail.js` file. Here's an overview of the implementation:

1. The `exportGmail()` function is the main entry point.
2. It uses helper functions like `checkIfEmailExists()` to avoid duplicates.
3. For first-time exports, it uses Google Takeout.
4. For subsequent exports, it scrapes emails directly from the Gmail interface.
5. The process uses IPC messages to communicate with the main process for various operations.

## Platform-specific Considerations

1. Navigation: The module uses specific selectors to navigate the Gmail interface, which may need updating if the UI changes.
2. Google Takeout: The first export uses Google Takeout, which may have rate limits or change its interface.
3. Email Content Extraction: The module extracts email content by targeting specific HTML elements, which may require updates if Gmail's structure changes.

## Future Improvements

1. **Handling Multiple Email Threads**: Incorporate thread-level data for a more comprehensive view of the user's email history.
2. **Optimizing Incremental Data Collection**: Further refine the process of collecting only new emails to improve efficiency.
3. **Enhanced Error Handling**: Add more robust error handling and recovery mechanisms.
4. **User Settings**: Implement options for users to customize the export process (e.g., date ranges, specific folders).
5. **Performance Optimization**: Improve the speed of data collection, especially for accounts with large numbers of emails.