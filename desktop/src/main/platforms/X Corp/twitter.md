# X Corp (Twitter)

This module exports tweets from a user's X Corp (formerly Twitter) account.

## Functionality

The `exportTwitter()` function performs these tasks:
1. Navigates to the X Corp homepage.
2. Checks if the user is logged in.
3. Clicks on the user's profile picture to access their profile.
4. Iteratively scrolls through and collects tweet data.
5. Checks for duplicate tweets both in the current collection and in previously exported data.
6. Sends collected tweet data for storage.

## Implementation

The tweet export process is implemented as follows:
1. The function navigates to the X Corp homepage if not already there.
2. It verifies if the user is logged in, prompting for sign-in if needed.
3. The function clicks on the user's profile picture to access their profile.
4. It enters a loop to collect tweets:
   - Waits for tweet elements to appear on the page.
   - Scrolls each tweet into view.
   - Extracts text and timestamp data from each tweet.
   - Checks for duplicates within the current collection and previously exported data.
   - Sends new tweets for storage.
   - Continues until no new tweets are found after multiple attempts.
5. The function sends a completion signal when all tweets are collected.

## Platform-specific Considerations

1. DOM Manipulation: The module relies on specific element attributes (e.g., `data-testid="cellInnerDiv"`, `css-9pa8cd` for profile pictures) to identify and interact with page elements.
2. Scroll Behavior: The function uses `scrollIntoView()` to load more tweets dynamically.
3. Duplicate Detection: The module checks for duplicates both in-memory and in previously exported files to avoid redundant data.
4. File System Interaction: The module interacts with the local file system to check for existing tweets.
5. IPC Communication: The function uses Electron's IPC to communicate with the main process for various operations.

## Future Improvements

1. Error Handling: Implement more robust error handling for network issues or unexpected page structures.
2. Rate Limiting: Implement rate limiting to avoid potential blocks from X Corp's servers.
3. User Preferences: Allow users to specify date ranges or other filters for tweet collection.
4. Incremental Updates: Optimize the process to only fetch new tweets since the last export.
5. Performance Optimization: Investigate ways to speed up the collection process, possibly by parallelizing some operations.
6. Authentication Handling: Improve the authentication check and login process for a smoother user experience.
7. Media Handling: Add functionality to capture and export media associated with tweets (images, videos, etc.).
8. Retweets and Replies: Implement options to include or exclude retweets and replies in the export.
