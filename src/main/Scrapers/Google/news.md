# X Corp News Scraper

This module scrapes news data from X Corp's search results page.

## Functions

### scrapeNews()

Extracts news items from the page, including:

- Title
- Source
- Time
- Link

### getNews()

Main function to initiate the news scraping process.

## Usage

Import and call `getNews()` to retrieve an array of news items.

## Dependencies

- `customConsoleLog`
- `wait`
- `waitForElement`
- `bigStepper`

These functions are imported from `trending.js`.

## Notes

- Ensure the page is loaded and the `.aUSklf` element is present before scraping.
- The scraper targets specific classes and elements. If the page structure changes, updates may be required.
