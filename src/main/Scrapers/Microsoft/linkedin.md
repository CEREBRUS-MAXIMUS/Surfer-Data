# LinkedIn

This module provides functionality to export a user's LinkedIn profile data.

## Functionality

The module consists of one main function:

1. `exportLinkedin()`: Navigates to the user's profile page and exports the entire HTML content of the page.

## Implementation

The LinkedIn export process is integrated into the main application through `preloadWebview.js`:

1. The `exportLinkedin()` function is defined in `linkedin.js` and exported as a module.
2. In `preloadWebview.js`, the function is imported and called when the 'export-website' event is received for LinkedIn.
3. The export process is initiated through an IPC message from the main process.
4. After the export is complete, the collected profile data is processed:
   - If the user is not connected, a 'connect-website' message is sent back.
   - If connected, the HTML is cleaned (CSS and scripts removed) and converted to Markdown.
5. The processed data is sent back to the main process using the 'handle-export' IPC message.

## Platform-specific Considerations

1. DOM Manipulation: The module relies on specific class names (e.g., 'ember-view block') to find and click the profile button. These selectors may need updates if LinkedIn's HTML structure changes.
2. Timing: The module uses fixed timeouts (7000ms and 2000ms) to account for page load times. These may need adjustment based on network conditions or changes to LinkedIn's page load behavior.
3. Full Page Export: The current implementation exports the entire `document.body.outerHTML`, which may include unnecessary data and could be optimized.

## Future Improvements

1. Selective Data Extraction: Instead of exporting the entire page HTML, implement targeted scraping of specific profile sections (e.g., experience, education, skills).
2. Error Handling: Add more robust error handling to manage potential issues during the export process.
5. Data Structuring: Parse the exported HTML to create a structured JSON object of the user's profile data for easier processing and storage.
6. Progressive Loading: Handle LinkedIn's progressive loading behavior to ensure all profile data is captured, especially for profiles with extensive content.
