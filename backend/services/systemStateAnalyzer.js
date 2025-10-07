/**
 * System State Analyzer
 * Analyzes target system capabilities and state before command generation
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemStateAnalyzer {
    constructor() {
        this.stateCache = new Map();
        this.cacheTTL = 60000; // 1 minute cache
    }

    /**
     * Analyze system state for command generation
     * @param {object} clientInfo - Client information
     * @param {string} userInput - User's command request
     * @returns {object} System state analysis
     */
    async analyzeSystemState(clientInfo, userInput) {
        try {
            console.log('[SYSTEM STATE] Analyzing system state...');
            
            const state = {
                platform: this.analyzePlatform(clientInfo),
                tools: await this.analyzeAvailableTools(),
                network: await this.analyzeNetworkState(),
                software: await this.analyzeSoftwareState(userInput),
                permissions: await this.analyzePermissions(),
                resources: await this.analyzeResources(),
                timestamp: new Date()
            };
            
            console.log('[SYSTEM STATE] Analysis complete');
            
            return state;
            
        } catch (error) {
            console.error('[SYSTEM STATE] Analysis failed:', error.message);
            return this.getDefaultState(clientInfo);
        }
    }

    /**
     * Analyze platform information
     */
    analyzePlatform(clientInfo) {
        const systemInfo = clientInfo.systemInfo || {};
        
        return {
            os: systemInfo.OSVersion || 'Windows',
            architecture: systemInfo.Is64BitOperatingSystem === 'True' ? '64-bit' : '32-bit',
            computerName: systemInfo.ComputerName || 'Unknown',
            userName: systemInfo.UserName || 'Unknown',
            processorCount: systemInfo.ProcessorCount || 'Unknown'
        };
    }

    /**
     * Analyze available tools
     */
    async analyzeAvailableTools() {
        const tools = {
            packageManagers: {
                winget: await this.checkTool('winget'),
                choco: await this.checkTool('choco'),
                scoop: await this.checkTool('scoop')
            },
            downloadTools: {
                curl: await this.checkTool('curl'),
                wget: await this.checkTool('wget'),
                powershell: await this.checkTool('powershell')
            },
            development: {
                git: await this.checkTool('git'),
                python: await this.checkTool('python'),
                node: await this.checkTool('node'),
                npm: await this.checkTool('npm')
            }
        };
        
        return tools;
    }

    /**
     * Check if a tool is available
     */
    async checkTool(toolName) {
        const cacheKey = `tool_${toolName}`;
        const cached = this.getCached(cacheKey);
        
        if (cached !== null) {
            return cached;
        }
        
        try {
            await execAsync(`where ${toolName}`, { timeout: 2000 });
            this.setCache(cacheKey, true);
            return true;
        } catch (error) {
            this.setCache(cacheKey, false);
            return false;
        }
    }

    /**
     * Analyze network state
     */
    async analyzeNetworkState() {
        const cacheKey = 'network_state';
        const cached = this.getCached(cacheKey);
        
        if (cached !== null) {
            return cached;
        }
        
        try {
            // Quick ping to check internet connectivity
            await execAsync('ping -n 1 8.8.8.8', { timeout: 3000 });
            
            const state = {
                connected: true,
                internetAccess: true
            };
            
            this.setCache(cacheKey, state);
            return state;
        } catch (error) {
            const state = {
                connected: false,
                internetAccess: false
            };
            
            this.setCache(cacheKey, state);
            return state;
        }
    }

    /**
     * Analyze software state based on user input
     */
    async analyzeSoftwareState(userInput) {
        const software = {
            requested: this.extractSoftwareName(userInput),
            installed: false,
            path: null
        };
        
        if (software.requested) {
            // Check if software is installed
            software.installed = await this.checkSoftwareInstalled(software.requested);
            
            if (software.installed) {
                software.path = await this.findSoftwarePath(software.requested);
            }
        }
        
        return software;
    }

    /**
     * Extract software name from user input
     */
    extractSoftwareName(userInput) {
        const input = userInput.toLowerCase();
        
        const softwarePatterns = [
            { pattern: /opera/i, name: 'opera' },
            { pattern: /chrome/i, name: 'chrome' },
            { pattern: /firefox/i, name: 'firefox' },
            { pattern: /brave/i, name: 'brave' },
            { pattern: /edge/i, name: 'edge' },
            { pattern: /vscode|visual studio code/i, name: 'vscode' },
            { pattern: /python/i, name: 'python' },
            { pattern: /node/i, name: 'node' },
            { pattern: /git/i, name: 'git' }
        ];
        
        for (const { pattern, name } of softwarePatterns) {
            if (pattern.test(input)) {
                return name;
            }
        }
        
        return null;
    }

    /**
     * Check if software is installed
     */
    async checkSoftwareInstalled(softwareName) {
        const cacheKey = `software_${softwareName}`;
        const cached = this.getCached(cacheKey);
        
        if (cached !== null) {
            return cached;
        }
        
        try {
            // Check common installation locations
            const executableNames = {
                'opera': 'opera.exe',
                'chrome': 'chrome.exe',
                'firefox': 'firefox.exe',
                'brave': 'brave.exe',
                'edge': 'msedge.exe',
                'vscode': 'code.exe',
                'python': 'python.exe',
                'node': 'node.exe',
                'git': 'git.exe'
            };
            
            const exeName = executableNames[softwareName];
            if (!exeName) {
                return false;
            }
            
            await execAsync(`where ${exeName}`, { timeout: 2000 });
            this.setCache(cacheKey, true);
            return true;
        } catch (error) {
            this.setCache(cacheKey, false);
            return false;
        }
    }

    /**
     * Find software installation path
     */
    async findSoftwarePath(softwareName) {
        try {
            const executableNames = {
                'opera': 'opera.exe',
                'chrome': 'chrome.exe',
                'firefox': 'firefox.exe',
                'brave': 'brave.exe',
                'edge': 'msedge.exe',
                'vscode': 'code.exe',
                'python': 'python.exe',
                'node': 'node.exe',
                'git': 'git.exe'
            };
            
            const exeName = executableNames[softwareName];
            if (!exeName) {
                return null;
            }
            
            const { stdout } = await execAsync(`where ${exeName}`, { timeout: 2000 });
            return stdout.trim().split('\n')[0]; // Return first match
        } catch (error) {
            return null;
        }
    }

    /**
     * Analyze permissions
     */
    async analyzePermissions() {
        const cacheKey = 'permissions';
        const cached = this.getCached(cacheKey);
        
        if (cached !== null) {
            return cached;
        }
        
        try {
            // Check if running as admin
            const { stdout } = await execAsync('net session', { timeout: 2000 });
            
            const permissions = {
                isAdmin: true,
                canInstall: true,
                canModifySystem: true
            };
            
            this.setCache(cacheKey, permissions);
            return permissions;
        } catch (error) {
            const permissions = {
                isAdmin: false,
                canInstall: false,
                canModifySystem: false
            };
            
            this.setCache(cacheKey, permissions);
            return permissions;
        }
    }

    /**
     * Analyze system resources
     */
    async analyzeResources() {
        return {
            downloadDirectory: process.env.TEMP || 'C:\\Temp',
            tempDirectory: process.env.TEMP || 'C:\\Temp',
            userProfile: process.env.USERPROFILE || 'C:\\Users\\Default'
        };
    }

    /**
     * Get cached value
     */
    getCached(key) {
        const cached = this.stateCache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > this.cacheTTL) {
            this.stateCache.delete(key);
            return null;
        }
        
        return cached.value;
    }

    /**
     * Set cache value
     */
    setCache(key, value) {
        this.stateCache.set(key, {
            value: value,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.stateCache.clear();
    }

    /**
     * Get default state (fallback)
     */
    getDefaultState(clientInfo) {
        return {
            platform: this.analyzePlatform(clientInfo),
            tools: {
                packageManagers: { winget: false, choco: false, scoop: false },
                downloadTools: { curl: false, wget: false, powershell: true },
                development: { git: false, python: false, node: false, npm: false }
            },
            network: { connected: true, internetAccess: true },
            software: { requested: null, installed: false, path: null },
            permissions: { isAdmin: false, canInstall: false, canModifySystem: false },
            resources: {
                downloadDirectory: 'C:\\Temp',
                tempDirectory: 'C:\\Temp',
                userProfile: 'C:\\Users\\Default'
            },
            timestamp: new Date()
        };
    }

    /**
     * Format state for prompt
     */
    formatStateForPrompt(state) {
        const tools = state.tools;
        const availablePackageManagers = Object.entries(tools.packageManagers)
            .filter(([_, available]) => available)
            .map(([name, _]) => name);
        
        const availableDownloadTools = Object.entries(tools.downloadTools)
            .filter(([_, available]) => available)
            .map(([name, _]) => name);
        
        return `
SYSTEM STATE ANALYSIS:
- Platform: ${state.platform.os} (${state.platform.architecture})
- Computer: ${state.platform.computerName}
- User: ${state.platform.userName}
- Internet: ${state.network.internetAccess ? 'CONNECTED' : 'DISCONNECTED'}
- Admin Rights: ${state.permissions.isAdmin ? 'YES' : 'NO'}

AVAILABLE TOOLS:
- Package Managers: ${availablePackageManagers.length > 0 ? availablePackageManagers.join(', ') : 'NONE'}
- Download Tools: ${availableDownloadTools.length > 0 ? availableDownloadTools.join(', ') : 'NONE'}

SOFTWARE STATUS:
${state.software.requested ? `- Requested Software: ${state.software.requested}` : ''}
${state.software.requested ? `- Already Installed: ${state.software.installed ? 'YES' : 'NO'}` : ''}
${state.software.path ? `- Installation Path: ${state.software.path}` : ''}

DIRECTORIES:
- Download Directory: ${state.resources.downloadDirectory}
- Temp Directory: ${state.resources.tempDirectory}
`;
    }
}

module.exports = SystemStateAnalyzer;
