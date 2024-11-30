const { customConsoleLog, waitForElement, wait } = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function checkNotionCredentials(company, name) {
  const userData = await ipcRenderer.invoke('get-user-data-path');
  const notionCredentialsPath = path.join(
    userData,
    'exported_data',
    company,
    name,
    'notionCredentials.json',
  );
  const fileExists = await fs.existsSync(notionCredentialsPath);
  if (fileExists) {
    const fileContent = fs.readFileSync(notionCredentialsPath, 'utf-8');
    return JSON.parse(fileContent);
  }
  return null;
};

async function exportNotion(id, platformId, filename, company, name) {
  try {
    let notionCredentials;
    if (!window.location.href.includes('notion.so')) {
      customConsoleLog(id, 'Navigating to Notion');
      window.location.assign('https://notion.so/');
      ipcRenderer.send('get-notion-credentials', company, name);
    }

    while (!notionCredentials) {
      await wait(0.5);
      notionCredentials = await checkNotionCredentials(company, name);
    }

    customConsoleLog(id, 'notionCredentials obtained!');
    
    // Start the export process
    const enqueueUrl = 'https://www.notion.so/api/v3/enqueueTask';
    const tasksUrl = 'https://www.notion.so/api/v3/getTasks';
    
    // Prepare the export request
    const exportData = {
      task: {
        eventName: 'exportSpace',
        request: {
          spaceId: notionCredentials.spaceId,
          exportOptions: {
            exportType: 'markdown',
            timeZone: notionCredentials.timezone,
            collectionViewExportType: 'currentView',
            flattenExportFiletree: false,
          },
          shouldExportComments: false
        }
      }
    };

    const response = await fetch(enqueueUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': notionCredentials.cookie
      },
      body: JSON.stringify(exportData)
    });

    if (!response.ok) {
      throw new Error(`Failed to enqueue task: ${response.status}`);
    }

    const { taskId } = await response.json();
    customConsoleLog(id, `Notion export started`);

    // Poll for export completion
    while (true) {
      try {
        const taskResponse = await fetch(tasksUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cookie': notionCredentials.cookie
          },
          body: JSON.stringify({ taskIds: [taskId] })
        });

        if (taskResponse.status === 429) {
          customConsoleLog(id, 'Rate limit reached, waiting 5 seconds before retrying...');
          await wait(5);
          continue;
        }

        if (!taskResponse.ok) {
          throw new Error(`Failed to check task status: ${taskResponse.status}`);
        }

        const taskData = await taskResponse.json();
        const taskResult = taskData.results?.[0];

        if (taskResult) {
          const { state, status } = taskResult;
          // if (!state || !status) {
          //   customConsoleLog(id, "This is taskData: ", taskData);
          //   customConsoleLog(id, "This is state and status: ", state, status);
          // }
          if (status && status.pagesExported) {
            customConsoleLog(id, `Export progress: ${status.pagesExported || 0} pages exported`);
          }

          if (state === 'success' && status.type === 'complete') {
            const exportUrl = status.exportURL;
            customConsoleLog(id, 'Export completed successfully!');
            window.location.assign(exportUrl);
            // You might want to download the file here or send the URL somewhere
            return "DOWNLOADING";
          }
        }

        await wait(4);
      } catch (error) {
        customConsoleLog(id, `Error checking task status: ${error.message}`);
        await wait(5);
        continue;
      }
    }
    
  } catch (error) {
    customConsoleLog(id, `Error during Notion export: ${error.message}`);
    ipcRenderer.sendToHost('console-error', { id, error: error.message });
  }
}

module.exports = exportNotion; 