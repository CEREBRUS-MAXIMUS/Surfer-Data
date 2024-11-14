# Guide to Adding New Platforms

To add support for a new platform in Surfer, follow these steps:

1. **Create a new directory**: In the `platforms` folder, create a new directory named after the company (e.g., `platforms/Salesforce`).

2. **Create the platform file**: Inside the new directory, create a JavaScript file named after the platform (e.g., `slack.js`).

3. **Create a JSON file**: Create a JSON file named after the platform (e.g., `slack.json`) in the `src/main/platforms/[Company]` directory. This file should contain the following information:
   - `name`: The name of the platform
   - `description`: A brief description of what data the platform exports
   - `connectURL`: The URL for the platform's login page
   - `connectSelector`: A CSS selector for an element that indicates a successful login
   - `isUpdated` (optional): A boolean indicating if the platform's data is regularly updated
   - `exportFrequency` (optional): The frequency at which the platform's data is exported (e.g., "daily", "weekly", "monthly")

   Example JSON structure:
   ```json
   {
     "name": "Platform Name",
     "description": "Exports [specific data types].",
     "connectURL": "https://platform.com/login",
     "connectSelector": "CSS_SELECTOR_FOR_LOGGED_IN_STATE",
     "isUpdated": true,
     "exportFrequency": "daily"
   }
   ```

4. **Implement and Export the scraping function**: In this file, implement the scraping function following the existing patterns in other platform modules. Make sure to export the function using `module.exports`

5. **Add authentication check**: Implement a mechanism to verify if the user is connected to the website. This typically involves checking for the presence of specific elements that are only visible when logged in. If the user is not authenticated, send the 'connect-website' event to the renderer process using `ipcRenderer.send('connect-website', id)`.

6. **Add documentation**: Create a README file (e.g., `slack.md`) in the platform directory, explaining the module's purpose and usage.

7. **Test thoroughly**: Ensure your new platform module works correctly and doesn't interfere with existing functionality.

8. **Submit a pull request**: Once everything is working, submit a pull request with your changes for review.

Remember to follow the project's coding standards and patterns established in existing platform modules. If you need help or have questions, don't hesitate to reach out to the project maintainers.
