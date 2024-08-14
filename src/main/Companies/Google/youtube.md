# YouTube

This module is responsible for scraping video data from the YouTube home page.

## Functionality

The `exportYouTube()` function in the `youtube.js` file performs the following tasks:

1. Waits for the YouTube page to load.
2. Collects video information (title, channel name, and view count) from the home page.
3. Stores the collected data in an array.
4. Returns the collected video data.

## Implementation

The YouTube export functionality is implemented in the `youtube.js` file and integrated into the main application through `preloadWebview.js`. Here's an overview of the implementation:

1. The `exportYouTube()` function is defined in `youtube.js` and exported as a module.
2. In `preloadWebview.js`, the `exportYouTube` function is imported and called when the 'export-website' event is received for YouTube.
3. The export process is initiated through an IPC message from the main process.
4. After the export is complete, the collected video data is sent back to the main process using the 'handle-export' IPC message.

## Data Extraction

The module extracts the following information for each video:

1. Video Title: Extracted from the `yt-formatted-string#video-title` element.
2. Channel Name: Extracted from the `a.yt-simple-endpoint.style-scope.yt-formatted-string[href^="/@"]` element.
3. View Count: Extracted from the `span.inline-metadata-item` element.

## Platform-specific Considerations

1. Element Selection: The module uses specific CSS selectors to target video information elements, which may need updating if YouTube's HTML structure changes.
2. Home Page Focus: The current implementation only extracts data from the home page, not from user-specific playlists or subscriptions.
3. Limited Data: The module currently only extracts title, channel name, and view count. Additional metadata could be collected in the future.

## Future Improvements

1. **Expand Data Collection**: Include additional metadata such as video duration, upload date, and likes/dislikes count.
2. **User-specific Data**: Implement functionality to extract data from user's playlists, subscriptions, or watch history.
3. **Pagination Handling**: Add the ability to navigate through multiple pages of video results.
4. **Error Handling**: Improve the module's robustness by adding more thorough error handling and recovery mechanisms.
5. **Rate Limiting**: Implement rate limiting to avoid potential issues with YouTube's anti-scraping measures.
