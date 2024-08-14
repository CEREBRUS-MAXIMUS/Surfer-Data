# GitHub

This module provides functionality to export GitHub repositories for a user.

## Functionality

The module consists of two main functions:

1. `exportGithub()`: Initiates the export process by navigating to the user's repositories page.
2. `continueExportGithub()`: Scrapes repository information from the page and handles pagination.

## Implementation

The export process is triggered from `preloadWebview.js` when the 'export-website' event is received for GitHub. The process is split into two parts due to navigation requirements:

1. `exportGithub()` is called initially to navigate to the repositories page.
2. `continueExportGithub()` is then automatically executed when the page URL includes '?tab=repositories'.

## Platform-specific Considerations

- The module uses DOM manipulation and relies on specific selectors, which may need updates if GitHub's HTML structure changes.
- There's a built-in delay (using `setTimeout`) to account for page load times, which may need adjustment based on network conditions.

## Future Improvements

1. Error handling: Implement more robust error handling and recovery mechanisms.
2. Rate limiting: Add respect for GitHub's rate limits to prevent potential blocking.
3. Data enrichment: Fetch additional repository details like stars, forks, and last update time.