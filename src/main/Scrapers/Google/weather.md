# Google Weather Scraper

This module is responsible for scraping weather data from Google search results.

## Functionality

The `exportWeather()` function in the `weather.js` file performs the following tasks:

1. Navigates to Google and searches for "my current weather".
2. Extracts current weather information (temperature, location, condition).
3. Extracts weather forecast for the next few days.
4. Stores the collected data in an object.
5. Returns the collected weather data.

## Implementation

The weather export functionality is implemented in the `weather.js` file and integrated into the main application through `preloadWebview.js`. Here's an overview of the implementation:

1. The `exportWeather()` function is defined in `weather.js` and exported as a module.
2. In `preloadWebview.js`, the `exportWeather` function is imported and called when the 'export-website' event is received for Google Weather.
3. The export process is initiated through an IPC message from the main process.
4. After the export is complete, the collected weather data is sent back to the main process using the 'handle-export' IPC message.

## Data Extraction

The module extracts the following information:

1. Current Weather:

   - Temperature
   - Location
   - Weather condition

2. Forecast (for each day):
   - Day
   - Maximum temperature
   - Minimum temperature
   - Weather condition

## Platform-specific Considerations

1. Element Selection: The module uses specific CSS selectors to target weather information elements, which may need updating if Google's HTML structure changes.
2. Location Accuracy: The "my current weather" search relies on Google's ability to determine the user's location, which may not always be accurate.
3. Units: The current implementation assumes temperatures are in Celsius. This may need to be adjusted based on the user's location or preferences.

## Future Improvements

1. **User Location Input**: Allow users to input a specific location for weather information.
2. **Unit Conversion**: Add the ability to switch between Celsius and Fahrenheit.
3. **Extended Forecast**: Implement functionality to extract a longer-term forecast if available.
4. **Error Handling**: Improve the module's robustness by adding more thorough error handling and recovery mechanisms.
5. **Additional Weather Data**: Extract more detailed weather information such as humidity, wind speed, and precipitation probability if available.
