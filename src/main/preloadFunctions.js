const { ipcRenderer } = require('electron')

function removeCSSAndScriptsFromHTML(htmlString) {
  // Create a copy of the input HTML string
  let modifiedHTML = htmlString.slice();

  // Remove <style>, <script>, <noscript>, <iframe>, and <code> tags and their contents
  modifiedHTML = modifiedHTML.replace(
    /<(style|script|noscript|iframe|code)[\s\S]*?<\/\1>/gi,
    '',
  );

  // Remove inline styles
  modifiedHTML = modifiedHTML.replace(/ style="[^"]*"/gi, '');

  // Remove class attributes
  modifiedHTML = modifiedHTML.replace(/ class="[^"]*"/gi, '');

  return modifiedHTML;
}

function customConsoleLog(...args) {
  // Convert arguments to strings to avoid cloning issues
  const stringArgs = args.map((arg) =>
    typeof arg === 'object' ? JSON.stringify(arg) : arg,
  );
  ipcRenderer.sendToHost('console-log', ...stringArgs);
};

function waitForElement(
  selector,
  elementName,
  multipleElements = false,
  timeout = 10000,
) {
  customConsoleLog(`Waiting for element: ${elementName}`);

  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = multipleElements
        ? document.querySelectorAll(selector)
        : document.querySelector(selector);
      if (element) {
        customConsoleLog(`Found element: ${elementName}`);
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        customConsoleLog(`Timeout waiting for element: ${elementName}`);
        resolve(null);
      } else {
        setTimeout(checkElement, 100);
      }
    };

    checkElement();
  });
}

async function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

function bigStepper(id) {
  ipcRenderer.sendToHost('big-stepper', id);
}


module.exports = { removeCSSAndScriptsFromHTML, customConsoleLog, waitForElement, wait, bigStepper }