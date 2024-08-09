# Twitter

This module exports tweets from a user's Twitter account.

## Functionality

The `exportTwitter()` function:
1. Checks if the user is connected to Twitter.
2. Navigates to the user's profile.
3. Collects unique tweets by scrolling through the profile.
4. Returns an array of collected tweets.

## Implementation

Integration in `preloadWebview.js`:
1. `exportTwitter()` is imported from `twitter.js`.
2. Called when the 'export-website' event is received for Twitter.
3. If user isn't connected, a 'connect-website' message is sent back.
4. Collected tweets are sent to the main process via 'handle-export'.

## Platform-specific Considerations

1. DOM Manipulation: Relies on specific selectors to identify profile pictures and tweets.
2. Scrolling: Implements virtual scrolling to load more tweets.
3. Duplicate Prevention: Uses a Set to store unique tweets.

## Future Improvements

1. Reliability: The current method isn't always reliable and sometimes doesn't get all the posts.
2. Bookmarks: Add functionality to export user's bookmarked tweets.
4. Error Handling: Add more comprehensive error handling and recovery mechanisms.
5. Metadata: Capture additional tweet metadata (e.g., date, likes, retweets).
7. Incremental Updates: Implement a system to only fetch new tweets since the last export.
