# Calendar

This module is responsible for scraping event data from a user's Google Calendar.

## Functionality

The `exportCalendar()` function in the `calendar.js` file performs the following tasks:

1. Navigates to the user's Google Calendar.
2. Identifies and collects event elements from the calendar view.
3. For each event:
   - Opens the event details modal.
   - Extracts detailed information about the event.
   - Closes the modal.
4. Stores the collected event data.
5. Handles duplicate events to avoid redundant data.
6. Updates the local storage with new event information.

## Implementation

The Calendar export functionality is implemented in the `calendar.js` file. Here's an overview of the implementation:

1. The `exportCalendar()` function is the main entry point.
2. It uses helper functions like `extractEventDetails()` to parse event information from the modal.
3. The process iterates through visible events on the calendar.
4. For each event, it opens the modal, extracts data, and closes the modal.
5. The module uses IPC messages to communicate with the main process for various operations.

## Platform-specific Considerations

1. Navigation: The module uses specific selectors to navigate the Google Calendar interface, which may need updating if the UI changes.
2. Modal Interaction: The module relies on opening and closing event modals, which may be affected by UI changes or loading times.
3. Event Content Extraction: The module extracts event content by targeting specific HTML elements, which may require updates if Calendar's structure changes.

## Future Improvements

1. **Handling Recurring Events**: Implement logic to properly handle and represent recurring events.
2. **Date Range Selection**: Allow users to specify a date range for event extraction.
3. **Calendar Selection**: Support extraction from multiple calendars if the user has access to more than one.
4. **Attachment Handling**: Improve the extraction and storage of event attachments.
5. **Performance Optimization**: Enhance the speed of data collection, especially for accounts with a large number of events.
6. **Sync Status Tracking**: Implement a mechanism to track the last successful sync to optimize incremental updates.
7. **Error Handling**: Add more robust error handling and recovery mechanisms, especially for network issues or UI changes.
8. **User Settings**: Implement options for users to customize the export process (e.g., specific calendars, event types).
