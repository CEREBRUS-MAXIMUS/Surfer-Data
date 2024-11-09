# Helper Functions Documentation

Surfer uses various helper functions to streamline the scraping process. Here's an overview of key helpers defined in `preloadFunctions.js`:

1. `customConsoleLog(...args)`: 
   - Sends console log messages to the renderer process via IPC.
   - Converts objects to strings to avoid cloning issues.

2. `waitForElement(id, selector, elementName, multipleElements = false, timeout = 10000)`:
   - Waits for an element to appear in the DOM.
   - Parameters:
     - `id`: ID of the run.
     - `selector`: CSS selector for the element.
     - `elementName`: Name of the element for logging.
     - `multipleElements`: Set to true if waiting for multiple elements.
     - `timeout`: Maximum wait time in milliseconds.
   - Returns a Promise that resolves with the element(s) or null if timed out.

3. `wait(seconds)`:
   - Creates a delay for the specified number of seconds.
   - Returns a Promise that resolves after the delay.

These helper functions are designed to assist with common tasks in the scraping process, such as waiting for elements to load, cleaning HTML, and managing asynchronous operations. Use them in your platform-specific modules to maintain consistency and improve code readability.
