# ChatGPT

This module exports all conversation history from a user's ChatGPT account.

## Functionality

The `exportChatgpt()` function performs these tasks:
1. Checks if the user is connected to ChatGPT.
2. Navigates through the ChatGPT interface to reach the export dialog.
3. Initiates the export of all conversation history.

## Implementation

The ChatGPT export process is integrated into the main application via `preloadWebview.js`:
1. The `exportChatgpt()` function is imported from `chatgpt.js`.
2. It's called when the 'export-website' event is received for ChatGPT.
3. If the user isn't connected, a 'connect-website' message is sent back.
4. The export process is initiated through an IPC message from the main process.

## Platform-specific Considerations

1. DOM Manipulation: The module relies on specific element attributes and text content to navigate the ChatGPT interface.
2. Timing: Fixed timeouts are used to account for page load times.
3. Element Visibility: The function waits for specific elements to appear before interacting with them.

## Future Improvements

1. Error Handling: Implement more robust error handling for each step of the process.
2. Dynamic Waiting: Replace fixed timeouts with dynamic waiting for elements to appear.
3. Automatic Download: Implement automatic access to the user's email to download the exported file.
4. Progress Tracking: Implement a way to track and report the export progress.
