# GitHub

This module provides functionality to export GitHub repositories for a user.

## Functionality 

The module consists of two main functions:

1. `exportGithub()`: Initiates the export process by navigating to the user's repositories page and handling the entire export process.
2. `checkIfRepoExists()`: Checks if a repository has already been exported to avoid duplicates.

## Implementation

The export process is triggered when the 'export-website' event is received for GitHub. The process follows these steps:

1. Navigate to GitHub if not already there.
2. Check for user authentication and prompt for login if necessary.
3. Navigate to the user's repositories page.
4. Iterate through repository pages:
   - Collect repository information (name, URL, description).
   - Check if each repository has already been exported.
   - Send updates for new repositories.
5. Handle pagination to process all repository pages.
6. Send a completion signal when all repositories have been processed.

## Platform-specific Considerations

- The module uses DOM manipulation and relies on specific selectors, which may need updates if GitHub's HTML structure changes.
- There are built-in delays (using `wait()` function) to account for page load times, which may need adjustment based on network conditions.
- The script interacts with the Electron `ipcRenderer` for various operations, including data storage and UI updates.

## Future Improvements

1. Error handling: Implement more robust error handling and recovery mechanisms.
2. Rate limiting: Add respect for GitHub's rate limits to prevent potential blocking.
3. Data enrichment: Fetch additional repository details like stars, forks, and last update time.
4. Performance optimization: Consider using GitHub's API for data retrieval instead of web scraping, which could be faster and more reliable.
5. Pagination handling: Improve the pagination mechanism to handle very large numbers of repositories more efficiently.