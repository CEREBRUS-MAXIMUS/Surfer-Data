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

module.exports = { removeCSSAndScriptsFromHTML, customConsoleLog }