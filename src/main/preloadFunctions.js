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

module.exports = removeCSSAndScriptsFromHTML