# Contributing Guidelines

Thank you for your interest in contributing to the Surfer project! We welcome contributions from the community to help improve and expand this personal data scraper.

## Setup Guide

Before you can start contributing, please follow these steps to set up the development environment:

1. Clone the repository:
   ```
   git clone https://github.com/CEREBRUS-MAXIMUS/Surfer-Data.git
   ```

2. Install the required dependencies:
   ```
   cd Surfer-Data
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

This will run the application in development mode, allowing you to test your changes and see the results in real-time.

## Contribution Guidelines

1. **Reporting Bugs**: If you encounter any bugs or issues, please open a new issue in the [GitHub repository](https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/issues/new?labels=bug&template=bug-report---.md). Provide a clear and detailed description of the problem, along with any relevant steps to reproduce the issue.

2. **Suggesting Features**: If you have an idea for a new feature or improvement, please open a new issue in the [GitHub repository](https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/issues/new?labels=enhancement&template=feature-request---.md). Describe the feature in detail, explain its benefits, and provide any additional context that might be helpful.

3. **Submitting Pull Requests**: If you would like to contribute code changes to the project, follow these steps:
   - Fork the repository
   - Create a new branch for your feature or bug fix
   - Make your changes
   - Test your changes thoroughly
   - Submit a pull request to the main repository, providing a clear description of your changes and the problem they solve

We appreciate all contributions, whether they are bug reports, feature suggestions, or code changes. By working together, we can make Surfer a better and more useful tool for everyone.

## Platform-specific Modules

The Surfer project is designed to be modular, with each platform-specific scraping functionality encapsulated in its own module (e.g., `github.js`, `linkedin.js`, `notion.js`). If you would like to add support for a new platform, please follow these guidelines:

1. Create a new directory within the `Companies` folder, named after the company (e.g., `Companies/Salesforce`).
2. Inside the new directory, create a new JavaScript file (e.g., `slack.js`) that exports a function to scrape data from the platform.
3. Update the `preloadWebview.js` file to integrate the new platform module and handle the data export.
4. Add all the necessary types for the platform including subruns in `platforms.ts`
5. Add a platform-specific README file (e.g., `slack.md`), providing information about the module's purpose, expected input/output, and any platform-specific considerations.

By following these guidelines, you can help maintain a consistent and organized project structure, making it easier for other contributors to understand and work with the codebase.

## Contact
If you have any questions or need further assistance, please feel free to reach out to the project maintainers:

[Surfer Discord Server](https://discord.gg/Tjg7pjcFNP) - [@SahilLalani0](https://x.com/SahilLalani0) - [@JackBlair87](https://x.com/JackBlair87)