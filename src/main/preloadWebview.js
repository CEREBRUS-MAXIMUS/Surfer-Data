if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string,
  });
}

const { ipcRenderer } = require('electron');
const { customConsoleLog } = require('./preloadFunctions');


ipcRenderer.on('export-website', async (event, company, name, runID) => {
  const scraper = require(`./Scrapers/${company}/${name}.js`);
  const data = await scraper(runID, company, name);
  customConsoleLog(runID, 'Got data, need to export now');
});

// const fs = require('fs');
// const path = require('path');

// // Recursive function to get all JS files
// const getAllJsFiles = (dir) => {
//   const files = fs.readdirSync(dir, { withFileTypes: true });
//   return files
//     .flatMap((file) => {
//       const filePath = path.join(dir, file.name);
//       return file.isDirectory() ? getAllJsFiles(filePath) : filePath;
//     })
//     .filter((file) => file.endsWith('.js'));
// };

  // const isProduction = process.env.NODE_ENV === 'production';
  // const scrapersDir = isProduction
  //   ? path.join(__dirname)
  //   : path.join(__dirname, 'Scrapers');
  
  // console.log("Contents of scrapersDir:");
  // fs.readdirSync(scrapersDir).forEach(file => {
  //   console.log(file);
  // });
  // const allFiles = getAllJsFiles(scrapersDir);
  // console.log("allFiles", allFiles)
  // const lowerCaseName = name.toLowerCase();
  // const matchingFile = allFiles.find(
  //   (file) => path.basename(file).toLowerCase() === `${lowerCaseName}.js`,
  // );
  // customConsoleLog(runID, 'Matching file:', matchingFile);

  // if (!matchingFile) {
  //   customConsoleLog(
  //     runID,
  //     `Error: No matching scraper found for ${company}/${name}`,
  //   );
  //   return; // Exit early if no matching file is found
  // }

  // const relativePath = path.relative(scrapersDir, matchingFile);
  // const modulePath = `./${relativePath.replace(/\\/g, '/')}`;

  // //customConsoleLog(runID, 'Attempting to require module:', modulePath);
  //        const youtube2 = require(`./Scrapers/${company}/${name}`);
  //        customConsoleLog(runID, 'youtube2', JSON.stringify(youtube2)); 

  // try { 
  //   // const youtube1 = require(`./Scrapers/Google/youtube`)
  //   // customConsoleLog(runID, 'youtube1', JSON.stringify(youtube1));
  //       // const youtube2 = require(`./Scrapers/${company}/${name}`)
  //       // customConsoleLog(runID, 'youtube2', JSON.stringify(youtube2));
  //   const scraperModule = require(modulePath)

  //   customConsoleLog(runID, 'Scraper module loaded successfully');

  //   // Check if the module has a default export or a named export
  //   const exportFunction = scraperModule.default || scraperModule[name];

  //   if (typeof exportFunction === 'function') {
  //     await exportFunction(company, name, runID);
  //     customConsoleLog(runID, `Script executed for ${company}/${name}`);
  //   } else {
  //     throw new Error(`No valid export found in ${modulePath}`);
  //   }
  // } catch (error) {
  //   customConsoleLog(
  //     runID,
  //     `Error during execution of ${company}/${name}:`,
  //     error.message,
  //   );
  // }

// ipcRenderer.on('export-website', async (event, company, name, runID, exportPath) => {
//   customConsoleLog(runID, 'Exporting', name);

//   switch (name) {
//     case 'Notion':
//       await exportNotion(company, runID);
//       break;
//     case 'GitHub':
//       await exportGithub(company, name, runID);
//       break;
//     case 'LinkedIn':
//       await exportLinkedin(company, name, runID);
//       break;
//     case 'Twitter':
//       await exportTwitter(company, name, runID);
//       break;
//     case 'Gmail':
//       await exportGmail(company, name, runID);
//       break;
//     case 'YouTube':
//       await exportYouTube(company, name, runID);
//       break;
//     case 'ChatGPT':
//       await exportChatgpt(company, runID);
//       break;
//     case 'Weather':
//       await exportGoogleWeather(company, name, runID);
//       break;
//     case 'X Trending':
//       await exportXTrending(company, name, runID);
//       break;
//     case 'News':
//       await exportNews(company, name, runID);
//       break;
//   }

//   if (exportPath) {
//     ipcRenderer.send('export-complete', company, name, runID, exportPath);
//   }
// });

// (async () => {
//   if (window.location.href.includes('?tab=repositories')) {
//     await continueExportGithub();
//   }
// })();

// ipcRenderer.on('change-url-success', async (event, url, id) => {
//   if (id.includes('chatgpt-001')) {
//     await continueExportChatgpt(id);
//   }
// });
