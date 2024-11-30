const { ipcRenderer } = require('electron')

function customConsoleLog(id, ...args) {
  // Convert arguments to strings to avoid cloning issues
  const stringArgs = args.map((arg) =>
    typeof arg === 'object' ? JSON.stringify(arg) : arg,
  );
  ipcRenderer.sendToHost('console-log', id, ...stringArgs);
};

function waitForElement(
  id,
  selector,
  elementName,
  multipleElements = false,
  timeout = 10000,
) {

  if (!multipleElements){
    customConsoleLog(id, `Waiting for ${elementName}`);
  }

  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = multipleElements
        ? document.querySelectorAll(selector)
        : document.querySelector(selector);
      if (element) {
        if (!multipleElements){
          customConsoleLog(id, `Found ${elementName}`);
        }
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        customConsoleLog(id, `Timeout waiting for ${elementName}`);
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

async function waitForContentToStabilize() {
  return new Promise((resolve) => {
    let timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        observer.disconnect();
        console.log('Content has stabilized');
        resolve();
      }, 100); // Adjust this delay as needed
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Fallback in case the page never stabilizes
    setTimeout(() => {
      observer.disconnect();
      console.log('Timed out waiting for content to stabilize');
      resolve();
    }, 5000); // Adjust this timeout as needed
  });
}



module.exports = { customConsoleLog,waitForElement, wait, waitForContentToStabilize }