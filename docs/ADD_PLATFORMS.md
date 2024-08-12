# Guide to Adding New Platforms

To add support for a new platform in Surfer, follow these steps:

1. **Create a new directory**: In the `Companies` folder, create a new directory named after the company (e.g., `Companies/Salesforce`).

2. **Create the platform file**: Inside the new directory, create a JavaScript file named after the platform (e.g., `slack.js`).

3. **Implement the scraping function**: In this file, implement the scraping function following the existing patterns in other platform modules.

4. **Update types**: Modify `platforms.ts` to include the necessary types for the new platform, including any subruns.

5. **Integrate the module**: Update `preloadWebview.js` to integrate the new platform module and handle data export.

6. **Add documentation**: Create a README file (e.g., `slack.md`) in the platform directory, explaining the module's purpose and usage.

7. **Test thoroughly**: Ensure your new platform module works correctly and doesn't interfere with existing functionality.

8. **Submit a pull request**: Once everything is working, submit a pull request with your changes for review.

Remember to follow the project's coding standards and patterns established in existing platform modules. If you need help or have questions, don't hesitate to reach out to the project maintainers.
