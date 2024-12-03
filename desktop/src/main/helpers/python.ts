const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
import path from 'path';
import fs from 'fs';
import { BrowserWindow, app, ipcMain } from 'electron';
import { dialog } from 'electron';
import { spawn, ChildProcess, fork } from 'child_process';

    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../../assets');

    const getAssetPath = (...paths: string[]): string => {
      return path.join(RESOURCES_PATH, ...paths);
};


export class PythonUtils {
  private SurferPythonPath: string | null = null;

  findPython() {
    console.log('Finding python3');
    console.log("app.getPath('module')", __dirname);

    // Go three folders up from __dirname to reach the project root
    let projectRoot = path.join(__dirname, '..', '..', '..');

    // Join with 'languages' folder
    let languageDir = path.join(projectRoot, 'languages');

    console.log('Looking for Python in:', languageDir);

    if (!fs.existsSync(languageDir)) {
      console.error('Languages directory not found:', languageDir);
      // throw new Error('Languages directory not found');
    }

    if (process.platform === 'win32') {
      languageDir = path.join(languageDir, 'Windows', 'python');
      console.log('Python path found', languageDir);
      this.SurferPythonPath = languageDir;
    } else if (process.platform === 'darwin') {
      languageDir = path.join(languageDir, 'Mac');

      const possibilities = [
        path.join(languageDir, 'python', 'bin', 'python3.11'),
        path.join(languageDir, 'python', 'bin', 'python3'),
        path.join(languageDir, 'python', 'bin', 'python'),
      ];
      console.log('Python path possibilities', possibilities);
      for (const pythonPath of possibilities) {
        if (fs.existsSync(pythonPath)) {
          this.SurferPythonPath = pythonPath;
          console.log('Python path found', this.SurferPythonPath);
          return;
        }
      }
      console.log('Could not find python3, checked', possibilities);
    } else {
      console.log('This is Linux, we do nothing for now!');
    }

    if (!this.SurferPythonPath) {
      console.error('Failed to find Python path');
      // throw new Error('Failed to find Python path');
    }
  }

  async installPythonModule(pipCommand: string) {
    console.log('Installing python module', pipCommand);
    const pythonPath = this.SurferPythonPath;
    console.log('Python path', pythonPath);
    if (process.platform === 'win32') {
      let commandArgs = pipCommand.split(' ');
      console.log(
        'command being sent',
        ['python.exe', '-m'].concat(commandArgs),
      );
      const pipInstallProcess = spawn(
        pythonPath,
        ['python.exe', '-m'].concat(commandArgs),
        {
          shell: true,
        },
      );

      pipInstallProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      pipInstallProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
    } else {
      const { stdout, stderr } = await execAsync(
        `${pythonPath} -m ${pipCommand}`,
      );
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
    }
  }

  async updatePipPython() {
    console.log('Updating pip');
    const pythonPath = this.SurferPythonPath;
    console.log('Python path update', pythonPath);

    if (process.platform === 'win32') {
      const pipUpgradeProcess = spawn(
        pythonPath,
        ['python.exe', '-m', 'pip', 'install', '--upgrade', 'pip'],
        {
          shell: true,
        },
      );

      pipUpgradeProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      pipUpgradeProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
    } else {
      const { stdout, stderr } = await execAsync(
        `${pythonPath} -m pip install --upgrade pip`,
      );

      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
    }
  }

  async runCommand(command: string) {
    const { stdout, stderr } = await execAsync(command);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
  }

  async runPythonScript(scriptPath: string, mainWindow: BrowserWindow) {
    const pythonPath = this.SurferPythonPath;

    const pythonProcess = spawn(pythonPath, [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      console.log('sending to renderer');
      console.log(data.toString());
      mainWindow.webContents.send('script-data', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      console.log('sending to renderer');
      console.log(data.toString());
      mainWindow.webContents.send('script-error', data.toString());
    });

    pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      mainWindow.webContents.send('script-completed');
    });
  }

  async executePythonScript(
    script: string,
    dataFolderPath: string,
    scriptName: string,
  ): Promise<ChildProcess> {
    console.log('Saving Script');
    console.log('Data Folder Path:', dataFolderPath); // Added logging

    let adjustedScriptName = scriptName;
    if (process.platform === 'win32') {
      adjustedScriptName = adjustedScriptName.replace(/[^a-zA-Z0-9_]/g, '_'); // Replace invalid characters with underscores
    }

    const chatFilePath = path.join(dataFolderPath, `${adjustedScriptName}.py`);
    console.log('Chat File Path:', chatFilePath); // Added logging

    //overwrite the file if it exists
    try {
      await fs.promises.writeFile(chatFilePath, script);
      console.log('Script saved to:', chatFilePath);
    } catch (error) {
      console.error('Error saving script:', error);
      throw new Error('Failed to save the script file.');
    }

    const options = {
      cwd: dataFolderPath,
      shell: true,
    };

    if (!this.SurferPythonPath) {
      throw new Error(
        'Python path is not set. Make sure to call findPython() before executing a script.',
      );
    }

    console.log('Using Python path:', this.SurferPythonPath);

    // Wrap paths in quotes to handle spaces
    const pythonPath = `"${this.SurferPythonPath}"`;
    const scriptPath = `"${chatFilePath}"`;

    if (process.platform === 'win32') {
      return spawn(`python.exe ${chatFilePath}`, options);
    } else {
      return spawn(pythonPath, [scriptPath], options);
    }
  }

  async hackBrowserScript(platform: string): Promise<ChildProcess> {
    const pythonPath = `"${this.SurferPythonPath}"`;

    let scriptPath: string;
    if (platform === 'edge') {
      scriptPath = getAssetPath('edge_windows.py');
    } else {
      scriptPath = getAssetPath('chrome_windows.py');
    }

    const requirementsPath = getAssetPath('requirements.txt');
    const requirements = fs.readFileSync(requirementsPath, 'utf-8').split('\n');

    console.log('Checking installed packages...');
    for (const req of requirements) {
      if (req.trim() !== '') {
        try {
          const { stdout } = await execAsync(`pip show ${req.trim()}`);
          console.log(`${req.trim()} is already installed.`);
        } catch (error) {
          console.log(`${req.trim()} is not installed. Installing...`);
          try {
            const { stdout, stderr } = await execAsync(
              `pip install ${req.trim()}`,
            );
            console.log(`Installed ${req.trim()} successfully.`);
          } catch (installError) {
            console.error(`Failed to install ${req.trim()}:`, installError);
          }
        }
      }
    }

    console.log('All requirements checked/installed.');

    if (process.platform === 'win32') {
      return spawn('python.exe', [scriptPath], { shell: true });
    } else {
      return spawn(pythonPath, [scriptPath], { shell: true });
    }
  }

  async iMessageScript(
    platform: string,
    folderPath: string,
    company: string,
    name: string,
    id: string,
  ) {



    //if (platform === 'win32') {
      const requirementsPath = getAssetPath('imessage_windows_reqs.txt');
      const requirements = fs
        .readFileSync(requirementsPath, 'utf-8')
        .split('\n');
      const imessagePath = path.join(
        app.getPath('userData'),
        'exported_data',
        company,
        name,
      );

      let packagesInstalled = false;
      for (const req of requirements) {
        if (req.trim() !== '' && !fs.existsSync(imessagePath)) {
          console.log('Installing', req.trim());
          try {
            const { stdout, stderr } = await execAsync(
              `python -m pip install ${req.trim()}`,
            );
            console.log(`Installed ${req.trim()} successfully.`);
            packagesInstalled = true;
          } catch (installError) {
            console.error(`Failed to install ${req.trim()}:`, installError);
          }
        }
      }

      if (packagesInstalled && !fs.existsSync(imessagePath)) {
        fs.mkdirSync(imessagePath, { recursive: true });
        console.log(`Created directory: ${imessagePath}`);
      }

      let isValidPassword = false;
      let pythonProcess: ChildProcess;

      while (!isValidPassword) {
        const password = await this.showPasswordPrompt();

        if (password === null) {
          throw new Error('Password input cancelled');
        }

        const scriptPath = getAssetPath('imessage_windows.py');

        try {
          const output = await new Promise<string>((resolve, reject) => {
            pythonProcess = spawn(
              'python.exe',
              [
                scriptPath,
                folderPath,
                company,
                name,
                password,
                app.getPath('userData'),
                id,
              ],
              { shell: true }
            );

            let output = '';

            pythonProcess.stdout.on('data', (data) => {
              const dataStr = data.toString();
              output += dataStr;
              console.log('Python script output:', dataStr);
            });

            pythonProcess.stderr.on('data', (data) => {
              console.error('Python script error:', data.toString());
            });

            pythonProcess.on('close', (code) => {
              console.log('Python script exited with code', code);
              if (code === 0) {
                resolve(output.trim());
              } else {
                reject(new Error(`Python script exited with code ${code}`));
              }
            });
          });

          if (output.includes('Backup decrypted successfully')) {
            isValidPassword = true;
            return output;
          } else if (output.includes('INVALID_PASSWORD')) {
            await dialog.showMessageBox({
              type: 'error',
              title: 'Invalid Password',
              message: 'The entered password is incorrect. Please try again.',
            });
          } else {
            throw new Error('Unexpected output from Python script');
          }
        } catch (error) {
          console.error('Error running Python script:', error);
          await dialog.showMessageBox({
            type: 'error',
            title: 'Invalid Password',
            message: `The entered password is incorrect. Please try again.`,
          });
        }
      }
    // } else if (platform === 'darwin') {
    //   const scriptPath = getAssetPath('imessage_mac.py');
    //   return spawn(pythonPath, [scriptPath, folderPath, company, name], {
    //     shell: true,
    //   });
    // } else {
    //   throw new Error('Platform not supported');
    // }
  }

  private showPasswordPrompt(): Promise<string | null> {
    return new Promise((resolve) => {
      const promptWindow = new BrowserWindow({
        width: 500,
        height: 300,
        show: false,
        alwaysOnTop: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      promptWindow.loadURL(
        getAssetPath('password-prompt.html'),
      );

      promptWindow.once('ready-to-show', () => {
        promptWindow.show();
      });

      ipcMain.once('submit-password', (event, password) => {
        resolve(password);
        promptWindow.close();
      });

      promptWindow.on('closed', () => {
        resolve(null);
      });
    });
  }

  private async installDependencies(dataFolderPath: string) {
    if (!this.SurferPythonPath) {
      throw new Error('Python path is not set. Cannot install dependencies.');
    }

    const pythonPath = `"${this.SurferPythonPath}"`;
    const pipCommand = `${pythonPath} -m pip`;

    const commands = [
      `${pipCommand} install --upgrade pip`,
      `${pipCommand} install -r "${path.join(dataFolderPath, 'requirements.txt')}"`,
    ];

    for (const command of commands) {
      console.log(`Executing: ${command}`);
      try {
        await execAsync(command, { shell: true });
      } catch (error) {
        console.error(`Error executing command: ${command}`, error);
        throw error;
      }
    }
  }

  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { shell: true });

      process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
    });
  }

  async installInitialDependencies() {
    if (!this.SurferPythonPath) {
      throw new Error('Python path is not set. Cannot install dependencies.');
    }

    const pythonPath = `"${this.SurferPythonPath}"`;
    const pipCommand = `${pythonPath} -m pip`;

    // const packages = [
    //   'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly', 'bokeh',
    //   'github',
    //   'PyQt5', 'selenium', 'requests', 'beautifulsoup4',
    //   'scrapy', 'nltk', 'spacy', 'textblob', 'pygame', 'arcade', 'pendulum',
    //   'celery', 'regex', 'pyyaml', 'toml', 'PyPDF2', 'pdfminer', 'pdfplumber',
    //   'pydub', 'librosa', 'numba', 'jupyter', 'pipenv', 'ipython',
    //   'cython', 'statsmodels', 'eli5', 'pattern', 'humanize', 'pmw',
    //   'sympy', 'pytesseract',  'pyserial', 'fpdf', 'openai'
    // ];

    const packages = [
      'numpy',
      'pandas',
      'matplotlib',
      'requests',
      'qrcode',
      'openai',
      'graphrag',
      'chromadb',
      // 'open-interpreter',
      // 'pydantic',
      // 'pydantic-settings',
      // 'pydantic-settings-config',
      // 'pydantic-settings-yaml',
      // 'scipy',
      // 'seaborn',
      // 'jupyter',
      // 'beautifulsoup4',
      // 'selenium',
      // 'nltk',
      // 'plotly',
      // 'ipython',
      // 'spacy',
      // 'openai',
      // 'github'
    ];

    const commands = [
      `${pipCommand} install --upgrade pip`,
      `${pipCommand} install ${packages.join(' ')}`,
    ];

    for (const command of commands) {
      console.log(`Executing: ${command}`);
      try {
        await execAsync(command, { shell: true });
        console.log('Command executed successfully');
      } catch (error) {
        console.error(`Error executing command: ${command}`, error);
        throw error;
      }
    }
  }

  async runPythonModule(
    moduleName: string,
    args: string[],
    mainWindow: BrowserWindow | null,
  ): Promise<string> {
    if (!this.SurferPythonPath) {
      throw new Error(
        'Python path is not set. Make sure to call findPython() before running a module.',
      );
    }

    const pythonPath = this.SurferPythonPath;

    // Quote arguments that contain spaces
    const quotedArgs = args.map((arg) =>
      arg.includes(' ') ? `"${arg}"` : arg,
    );

    console.log(
      `Executing: ${pythonPath} -m ${moduleName} ${quotedArgs.join(' ')}`,
    );

    return new Promise((resolve, reject) => {
      const process2 = spawn(pythonPath, ['-m', moduleName, ...quotedArgs], {
        shell: true,
        windowsVerbatimArguments: process.platform === 'win32', // This helps with Windows
      });

      let stdoutData = '';
      let stderrData = '';

      process2.stdout.on('data', (data) => {
        const output = data.toString().trim();
        stdoutData += output + '\n';
        console.log(`stdout: ${output}`);
        mainWindow?.webContents.send('console-output', output);
      });

      process2.stderr.on('data', (data) => {
        const error = data.toString().trim();
        stderrData += error + '\n';
        console.error(`stderr: ${error}`);
        mainWindow?.webContents.send('console-error', error);
      });

      process2.on('close', (code) => {
        if (code === 0) {
          mainWindow?.webContents.send(
            'console-completed',
            'Process completed successfully.',
          );
          resolve(stdoutData.trim());
        } else {
          const errorMessage = `Process exited with code ${code}\n${stderrData}`;
          mainWindow?.webContents.send('console-error', errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  }
  async runChromaCommand() {
    const userDataPath = app.getPath('userData');
    const vectorDBsPath = path.join(userDataPath, 'vectorDBs');

    if (!fs.existsSync(vectorDBsPath)) {
      fs.mkdirSync(vectorDBsPath);
      console.log('Created vectorDBs directory:', vectorDBsPath);
    }

    const chromaPath = this.SurferPythonPath.replace(/python3\.11$/, 'chroma');
    const chromaCommand = `"${chromaPath}" run --path "${vectorDBsPath}" --port 60432`;
    console.log('Running chroma command:', chromaCommand);

    try {
      const { stdout, stderr } = await execAsync(chromaCommand);
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
    } catch (error) {
      console.error('Error running chroma command:', error);
    }
  }
}
