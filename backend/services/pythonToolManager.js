/**
 * Python Tool Manager
 * Conditionally installs and manages Python tools based on system privileges
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const PrivilegeDetector = require('./privilegeDetector');

const execAsync = promisify(exec);

class PythonToolManager {
    constructor() {
        this.privilegeDetector = new PrivilegeDetector();
        this.pythonPath = null;
        this.pipPath = null;
        this.installedPackages = new Set();
        this.isInitialized = false;
    }

    /**
     * Initialize Python environment
     * @param {boolean} forceInstall - Force Python installation even if not privileged
     * @returns {object} Initialization result
     */
    async initialize(forceInstall = false) {
        try {
            console.log('[PYTHON MANAGER] Initializing Python environment...');

            // Check current privilege status
            const privilegeStatus = await this.privilegeDetector.getPrivilegeStatus();
            
            if (!privilegeStatus.pythonInstalled && !privilegeStatus.canInstallPython && !forceInstall) {
                return {
                    success: false,
                    error: 'Python not installed and cannot be installed without admin privileges',
                    canInstall: false
                };
            }

            // Install Python if needed and possible
            if (!privilegeStatus.pythonInstalled && (privilegeStatus.canInstallPython || forceInstall)) {
                const installResult = await this.installPython(privilegeStatus);
                if (!installResult.success) {
                    return installResult;
                }
            }

            // Find Python installation
            const pythonResult = await this.findPythonInstallation();
            if (!pythonResult.success) {
                return pythonResult;
            }

            this.pythonPath = pythonResult.pythonPath;
            this.pipPath = pythonResult.pipPath;

            // Install required packages
            const packageResult = await this.installRequiredPackages();
            if (!packageResult.success) {
                return packageResult;
            }

            this.isInitialized = true;

            console.log('[PYTHON MANAGER] Python environment initialized successfully');
            
            return {
                success: true,
                pythonPath: this.pythonPath,
                pipPath: this.pipPath,
                installedPackages: Array.from(this.installedPackages),
                message: 'Python environment ready'
            };

        } catch (error) {
            console.error('[PYTHON MANAGER] Initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Install Python silently
     */
    async installPython(privilegeStatus) {
        try {
            console.log('[PYTHON MANAGER] Installing Python...');

            if (process.platform === 'win32') {
                return await this.installPythonWindows(privilegeStatus);
            } else if (process.platform === 'linux') {
                return await this.installPythonLinux(privilegeStatus);
            } else if (process.platform === 'darwin') {
                return await this.installPythonMacOS(privilegeStatus);
            } else {
                return {
                    success: false,
                    error: `Unsupported platform: ${process.platform}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Install Python on Windows
     */
    async installPythonWindows(privilegeStatus) {
        try {
            // Download Python installer
            const pythonUrl = 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe';
            const installerPath = path.join(process.env.TEMP, 'python-installer.exe');

            console.log('[PYTHON MANAGER] Downloading Python installer...');
            
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            // Download using PowerShell
            await execAsync(`powershell -Command "Invoke-WebRequest -Uri '${pythonUrl}' -OutFile '${installerPath}'"`);

            // Install silently
            console.log('[PYTHON MANAGER] Installing Python silently...');
            const installCommand = `"${installerPath}" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0`;
            
            await execAsync(installCommand);

            // Clean up installer
            await fs.promises.unlink(installerPath);

            // Wait for installation to complete
            await new Promise(resolve => setTimeout(resolve, 30000));

            return {
                success: true,
                message: 'Python installed successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: `Windows Python installation failed: ${error.message}`
            };
        }
    }

    /**
     * Install Python on Linux
     */
    async installPythonLinux(privilegeStatus) {
        try {
            console.log('[PYTHON MANAGER] Installing Python on Linux...');

            // Try different package managers
            const packageManagers = privilegeStatus.packageManagers;

            if (packageManagers.apt) {
                await execAsync('sudo apt update');
                await execAsync('sudo apt install -y python3 python3-pip');
            } else if (packageManagers.yum) {
                await execAsync('sudo yum install -y python3 python3-pip');
            } else {
                return {
                    success: false,
                    error: 'No supported package manager found'
                };
            }

            return {
                success: true,
                message: 'Python installed successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: `Linux Python installation failed: ${error.message}`
            };
        }
    }

    /**
     * Install Python on macOS
     */
    async installPythonMacOS(privilegeStatus) {
        try {
            console.log('[PYTHON MANAGER] Installing Python on macOS...');

            if (privilegeStatus.packageManagers.brew) {
                await execAsync('brew install python3');
            } else {
                // Download and install from python.org
                const pythonUrl = 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-macos11.pkg';
                const installerPath = '/tmp/python-installer.pkg';

                await execAsync(`curl -o "${installerPath}" "${pythonUrl}"`);
                await execAsync(`sudo installer -pkg "${installerPath}" -target /`);
                await fs.promises.unlink(installerPath);
            }

            return {
                success: true,
                message: 'Python installed successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: `macOS Python installation failed: ${error.message}`
            };
        }
    }

    /**
     * Find Python installation
     */
    async findPythonInstallation() {
        try {
            let pythonPath = null;
            let pipPath = null;

            // Try different Python commands
            const pythonCommands = ['python', 'python3', 'py'];
            
            for (const cmd of pythonCommands) {
                try {
                    const { stdout } = await execAsync(`${cmd} --version`);
                    if (stdout.includes('Python')) {
                        pythonPath = cmd;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            if (!pythonPath) {
                return {
                    success: false,
                    error: 'Python not found in PATH'
                };
            }

            // Find pip
            const pipCommands = ['pip', 'pip3', `${pythonPath} -m pip`];
            
            for (const cmd of pipCommands) {
                try {
                    const { stdout } = await execAsync(`${cmd} --version`);
                    if (stdout.includes('pip')) {
                        pipPath = cmd;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            if (!pipPath) {
                return {
                    success: false,
                    error: 'pip not found'
                };
            }

            return {
                success: true,
                pythonPath: pythonPath,
                pipPath: pipPath
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Install required Python packages
     */
    async installRequiredPackages() {
        try {
            console.log('[PYTHON MANAGER] Installing required packages...');

            const requiredPackages = [
                'requests',
                'selenium',
                'beautifulsoup4',
                'lxml',
                'playwright',
                'scrapy',
                'urllib3',
                'certifi'
            ];

            for (const packageName of requiredPackages) {
                try {
                    console.log(`[PYTHON MANAGER] Installing ${packageName}...`);
                    await execAsync(`${this.pipPath} install ${packageName} --quiet`);
                    this.installedPackages.add(packageName);
                } catch (error) {
                    console.log(`[PYTHON MANAGER] Failed to install ${packageName}: ${error.message}`);
                    // Continue with other packages
                }
            }

            // Install Playwright browsers
            try {
                console.log('[PYTHON MANAGER] Installing Playwright browsers...');
                await execAsync(`${this.pythonPath} -m playwright install chromium --quiet`);
            } catch (error) {
                console.log('[PYTHON MANAGER] Failed to install Playwright browsers:', error.message);
            }

            return {
                success: true,
                installedPackages: Array.from(this.installedPackages),
                message: `Installed ${this.installedPackages.size} packages`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute Python script
     * @param {string} script - Python script to execute
     * @param {Array} args - Command line arguments
     * @returns {object} Execution result
     */
    async executePythonScript(script, args = []) {
        try {
            if (!this.isInitialized) {
                const initResult = await this.initialize();
                if (!initResult.success) {
                    return initResult;
                }
            }

            // Write script to temporary file
            const scriptPath = path.join(process.env.TEMP, `python_script_${Date.now()}.py`);
            await fs.promises.writeFile(scriptPath, script);

            // Execute script
            const argsString = args.join(' ');
            const command = `"${this.pythonPath}" "${scriptPath}" ${argsString}`;
            
            console.log(`[PYTHON MANAGER] Executing Python script: ${scriptPath}`);
            
            const { stdout, stderr } = await execAsync(command);

            // Clean up script file
            await fs.promises.unlink(scriptPath);

            return {
                success: true,
                stdout: stdout,
                stderr: stderr,
                script: scriptPath
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                stdout: error.stdout,
                stderr: error.stderr
            };
        }
    }

    /**
     * Execute Python script with Selenium
     */
    async executeSeleniumScript(url, actions = []) {
        const script = `
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def main():
    try:
        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Initialize driver
        driver = webdriver.Chrome(options=chrome_options)
        
        # Navigate to URL
        driver.get('${url}')
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Execute actions
        ${actions.map(action => `
        try:
            ${action}
        except Exception as e:
            print(f"Action failed: {e}")
        `).join('')}
        
        # Get page content
        page_source = driver.page_source
        print("PAGE_SOURCE_START")
        print(page_source)
        print("PAGE_SOURCE_END")
        
        # Get download links
        download_links = []
        links = driver.find_elements(By.TAG_NAME, "a")
        for link in links:
            href = link.get_attribute("href")
            text = link.text.strip()
            if href and ('download' in href.lower() or 'download' in text.lower()):
                download_links.append({"url": href, "text": text})
        
        print("DOWNLOAD_LINKS_START")
        for link in download_links:
            print(f"LINK: {link['url']} | TEXT: {link['text']}")
        print("DOWNLOAD_LINKS_END")
        
        driver.quit()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

        return await this.executePythonScript(script);
    }

    /**
     * Execute Python script with requests/BeautifulSoup
     */
    async executeWebScrapingScript(url, selectors = []) {
        const script = `
import sys
import requests
from bs4 import BeautifulSoup
import json

def main():
    try:
        # Setup session
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Fetch page
        response = session.get('${url}', timeout=30)
        response.raise_for_status()
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract data based on selectors
        results = {}
        ${selectors.map((selector, index) => `
        try:
            elements_${index} = soup.select('${selector}')
            results['selector_${index}'] = [elem.get_text().strip() for elem in elements_${index}]
        except Exception as e:
            results['selector_${index}'] = f"Error: {e}"
        `).join('')}
        
        # Find download links
        download_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            text = link.get_text().strip()
            if 'download' in href.lower() or 'download' in text.lower():
                download_links.append({"url": href, "text": text})
        
        results['download_links'] = download_links
        
        # Output results
        print("SCRAPING_RESULTS_START")
        print(json.dumps(results, indent=2))
        print("SCRAPING_RESULTS_END")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

        return await this.executePythonScript(script);
    }

    /**
     * Get Python environment status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            pythonPath: this.pythonPath,
            pipPath: this.pipPath,
            installedPackages: Array.from(this.installedPackages),
            platform: process.platform
        };
    }

    /**
     * Clean up Python environment
     */
    async cleanup() {
        try {
            // Remove temporary files
            const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
            const files = await fs.promises.readdir(tempDir);
            
            for (const file of files) {
                if (file.startsWith('python_script_')) {
                    try {
                        await fs.promises.unlink(path.join(tempDir, file));
                    } catch (error) {
                        // Ignore cleanup errors
                    }
                }
            }

            console.log('[PYTHON MANAGER] Cleanup completed');
        } catch (error) {
            console.error('[PYTHON MANAGER] Cleanup failed:', error);
        }
    }
}

module.exports = PythonToolManager;
