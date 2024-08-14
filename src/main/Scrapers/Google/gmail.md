# Gmail

This module is responsible for scraping email data from a user's Gmail account.

## Functionality

The `exportGmail()` function in the `gmail.js` file performs the following tasks:

1. Checks if the user is connected to their Gmail account.
2. Collects the email content and stores it in an array.
3. Navigates to the next set of emails and repeats the collection process.
4. Returns the collected email content.

## Implementation

The Gmail export functionality is implemented in the `gmail.js` file and integrated into the main application through `preloadWebview.js`. Here's an overview of the implementation:

1. The `exportGmail()` function is defined in `gmail.js` and exported as a module.
2. In `preloadWebview.js`, the `exportGmail` function is imported and called when the 'export-website' event is received for Gmail.
3. The export process is initiated through an IPC message from the main process.
4. After the export is complete, the collected emails are sent back to the main process using the 'handle-export' IPC message.

## Platform-specific Considerations

1. Navigation: The module uses specific selectors to navigate the Gmail interface, which may need updating if the UI changes.
2. Email Content Extraction: The module extracts email content by targeting specific HTML elements, which may also require updates if Gmail's structure changes.
3. Improved Data Structure: The current implementation only gets the raw text, but data such as date/time, sender, etc. can be obtained as well.

## Future Improvements

1. **Handling Multiple Email Threads**: Incorporate thread-level data for a more comprehensive view of the user's email history.
2. **Incremental Data Collection**: Collect new emails incrementally to reduce the risk of hitting platform-specific restrictions.
3. **Error Handling**: Improve the module's robustness and reliability by adding more thorough error handling.