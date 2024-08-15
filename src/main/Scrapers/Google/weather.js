const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');

async function exportWeather(company, name, runID) {
  await wait(2);

  const weatherData = {
    current: {},
    forecast: [],
  };

  bigStepper(runID);

  // Extract current weather data
  const currentWeather = document.querySelector('#wob_wc');
  if (currentWeather) {
    weatherData.current = {
      temperature: currentWeather.querySelector('#wob_tm').textContent + '°C',
      condition: currentWeather.querySelector('#wob_dc').textContent,
      precipitation: currentWeather.querySelector('#wob_pp').textContent,
      humidity: currentWeather.querySelector('#wob_hm').textContent,
      wind: currentWeather.querySelector('#wob_ws').textContent,
    };
  }

  // Extract forecast data
  const forecastElements = document.querySelectorAll('.wob_df');
  forecastElements.forEach((element) => {
    const day = element.querySelector('.Z1VzSb').getAttribute('aria-label');
    const maxTemp = element.querySelector('.gNCp2e .wob_t').textContent + '°C';
    const minTemp = element.querySelector('.QrNVmd .wob_t').textContent + '°C';
    const condition = element.querySelector('img').getAttribute('alt');

    weatherData.forecast.push({
      day,
      maxTemp,
      minTemp,
      condition,
    });
  });

  customConsoleLog(
    'Weather data collected:',
    JSON.stringify(weatherData, null, 2),
  );

  bigStepper(runID);
  ipcRenderer.send('handle-export', company, name, weatherData, runID);

  return;
}

async function navigateAndSearch() {
  const searchInput = await waitForElement('input[name="q"]', 'Search input');
  searchInput.value = 'my current weather';
  searchInput.form.submit();
  await wait(2);
}

async function extractWeatherData(weatherData) {
  const temperatureElement = await waitForElement('#wob_tm', 'Temperature');
  const locationElement = await waitForElement('#wob_loc', 'Location');
  const conditionElement = await waitForElement('#wob_dc', 'Condition');

  weatherData.temperature = temperatureElement
    ? temperatureElement.textContent + '°C'
    : 'N/A';
  weatherData.location = locationElement ? locationElement.textContent : 'N/A';
  weatherData.condition = conditionElement
    ? conditionElement.textContent
    : 'N/A';

  // Extract forecast
  const forecastElements = await waitForElement(
    '.wob_df',
    'Forecast days',
    true,
  );
  weatherData.forecast = [];

  if (forecastElements && forecastElements.length > 0) {
    for (const element of forecastElements) {
      const day = element.querySelector('.wob_d').textContent;
      const maxTemp = element.querySelector('.wob_t').children[0].textContent;
      const minTemp = element.querySelector('.wob_t').children[2].textContent;
      const condition = element.querySelector('img').getAttribute('alt');

      weatherData.forecast.push({
        day,
        maxTemp: maxTemp + '°C',
        minTemp: minTemp + '°C',
        condition,
      });
    }
  }
}

module.exports = exportWeather;
