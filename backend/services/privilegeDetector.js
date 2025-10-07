/**
 * Privilege Detection Service
 * Detects system privileges and capabilities for intelligent tool selection
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class PrivilegeDetector {
    constructor() {
        this.privilegeCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastCheck = null;
    }

    /**
     * Get comprehensive privilege status
     * @param {boolean} forceRefresh - Force refresh of cached data
     * @returns {object} Privilege status object
     */
    async getPrivilegeStatus(forceRefresh = false) {
        try {
            // Check cache first
            if (!forceRefresh && this.isCacheValid()) {
                return this.privilegeCache.get('status');
            }

            console.log('[PRIVILEGE DETECTOR] Detecting system privileges...');

            const status = {
                timestamp: new Date(),
                platform: process.platform,
                
                // Basic privilege checks
                isAdmin: await this.checkAdminPrivileges(),
                isElevated: await this.checkElevatedPrivileges(),
                uacEnabled: await this.checkUACStatus(),
                
                // Installation capabilities
                canInstallSilently: false,
                canModifySystem: false,
                canModifyRegistry: false,
                canModifyServices: false,
                
                // Tool availability
                pythonInstalled: await this.checkPythonInstallation(),
                pipInstalled: false,
                canInstallPython: false,
                nodeInstalled: await this.checkNodeInstallation(),
                gitInstalled: await this.checkGitInstallation(),
                
                // Package managers
                packageManagers: await this.detectPackageManagers(),
                
                // Security restrictions
                antivirusDetected: await this.detectAntivirus(),
                firewallEnabled: await this.checkFirewallStatus(),
                
                // File system permissions
                tempWriteAccess: await this.checkTempWriteAccess(),
                programFilesAccess: await this.checkProgramFilesAccess(),
                system32Access: await this.checkSystem32Access(),
                
                // Network capabilities
                internetAccess: await this.checkInternetAccess(),
                proxyConfigured: await this.checkProxyConfiguration(),
                
                // Additional capabilities
                canRunScripts: await this.checkScriptExecutionPolicy(),
                canInstallDrivers: false,
                canModifyHosts: await this.checkHostsFileAccess(),
                
                // Risk assessment
                riskLevel: 'medium',
                recommendations: []
            };

            // Calculate derived capabilities
            status.canInstallSilently = status.isAdmin && !status.uacEnabled;
            status.canModifySystem = status.isAdmin && status.system32Access;
            status.canModifyRegistry = status.isAdmin;
            status.canModifyServices = status.isAdmin;
            status.canInstallDrivers = status.isAdmin && status.system32Access;
            
            if (status.pythonInstalled) {
                status.pipInstalled = await this.checkPipInstallation();
            }
            
            status.canInstallPython = status.isAdmin && !status.pythonInstalled;

            // Calculate risk level
            status.riskLevel = this.calculateRiskLevel(status);

            // Generate recommendations
            status.recommendations = this.generateRecommendations(status);

            // Cache the result
            this.privilegeCache.set('status', status);
            this.lastCheck = new Date();

            console.log(`[PRIVILEGE DETECTOR] Privilege detection completed. Risk level: ${status.riskLevel}`);
            
            return status;
        } catch (error) {
            console.error('[PRIVILEGE DETECTOR] Error detecting privileges:', error);
            return this.getDefaultPrivilegeStatus();
        }
    }

    /**
     * Check if current user has admin privileges
     */
    async checkAdminPrivileges() {
        try {
            if (process.platform === 'win32') {
                // Check if running as administrator
                const { stdout } = await execAsync('net session 2>nul');
                return stdout.includes('There are no entries');
            } else if (process.platform === 'linux' || process.platform === 'darwin') {
                // Check if running as root
                return process.getuid() === 0;
            }
            return false;
        } catch (error) {
            // If net session fails, we're likely not admin
            return false;
        }
    }

    /**
     * Check if process is elevated
     */
    async checkElevatedPrivileges() {
        try {
            if (process.platform === 'win32') {
                // Try to access a system directory that requires elevation
                const testPath = 'C:\\Windows\\System32\\config\\system';
                await fs.promises.access(testPath, fs.constants.R_OK);
                return true;
            } else {
                return process.getuid() === 0;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Check UAC status on Windows
     */
    async checkUACStatus() {
        try {
            if (process.platform !== 'win32') {
                return false;
            }

            const { stdout } = await execAsync('reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System /v EnableLUA');
            return stdout.includes('0x1');
        } catch (error) {
            return true; // Assume UAC is enabled if we can't check
        }
    }

    /**
     * Check if Python is installed
     */
    async checkPythonInstallation() {
        try {
            const { stdout } = await execAsync('python --version');
            return stdout.includes('Python');
        } catch (error) {
            try {
                const { stdout } = await execAsync('python3 --version');
                return stdout.includes('Python');
            } catch (error2) {
                return false;
            }
        }
    }

    /**
     * Check if pip is installed
     */
    async checkPipInstallation() {
        try {
            const { stdout } = await execAsync('pip --version');
            return stdout.includes('pip');
        } catch (error) {
            try {
                const { stdout } = await execAsync('pip3 --version');
                return stdout.includes('pip');
            } catch (error2) {
                return false;
            }
        }
    }

    /**
     * Check if Node.js is installed
     */
    async checkNodeInstallation() {
        try {
            const { stdout } = await execAsync('node --version');
            return stdout.includes('v');
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if Git is installed
     */
    async checkGitInstallation() {
        try {
            const { stdout } = await execAsync('git --version');
            return stdout.includes('git version');
        } catch (error) {
            return false;
        }
    }

    /**
     * Detect available package managers
     */
    async detectPackageManagers() {
        const managers = {
            choco: false,
            winget: false,
            scoop: false,
            npm: false,
            pip: false,
            apt: false,
            yum: false,
            brew: false
        };

        try {
            // Windows package managers
            if (process.platform === 'win32') {
                try {
                    await execAsync('choco --version');
                    managers.choco = true;
                } catch (error) {}

                try {
                    await execAsync('winget --version');
                    managers.winget = true;
                } catch (error) {}

                try {
                    await execAsync('scoop --version');
                    managers.scoop = true;
                } catch (error) {}
            }

            // Cross-platform package managers
            try {
                await execAsync('npm --version');
                managers.npm = true;
            } catch (error) {}

            if (await this.checkPipInstallation()) {
                managers.pip = true;
            }

            // Linux package managers
            if (process.platform === 'linux') {
                try {
                    await execAsync('apt --version');
                    managers.apt = true;
                } catch (error) {}

                try {
                    await execAsync('yum --version');
                    managers.yum = true;
                } catch (error) {}
            }

            // macOS package manager
            if (process.platform === 'darwin') {
                try {
                    await execAsync('brew --version');
                    managers.brew = true;
                } catch (error) {}
            }

        } catch (error) {
            console.log('[PRIVILEGE DETECTOR] Error detecting package managers:', error.message);
        }

        return managers;
    }

    /**
     * Detect antivirus software
     */
    async detectAntivirus() {
        try {
            if (process.platform === 'win32') {
                // Check for common antivirus processes
                const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq avast*" /FO CSV');
                if (stdout.includes('avast')) return true;

                const { stdout: stdout2 } = await execAsync('tasklist /FI "IMAGENAME eq avg*" /FO CSV');
                if (stdout2.includes('avg')) return true;

                const { stdout: stdout3 } = await execAsync('tasklist /FI "IMAGENAME eq norton*" /FO CSV');
                if (stdout3.includes('norton')) return true;

                const { stdout: stdout4 } = await execAsync('tasklist /FI "IMAGENAME eq mcafee*" /FO CSV');
                if (stdout4.includes('mcafee')) return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check firewall status
     */
    async checkFirewallStatus() {
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('netsh advfirewall show allprofiles state');
                return stdout.includes('ON');
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check temp directory write access
     */
    async checkTempWriteAccess() {
        try {
            const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
            const testFile = path.join(tempDir, `test_${Date.now()}.tmp`);
            
            await fs.promises.writeFile(testFile, 'test');
            await fs.promises.unlink(testFile);
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check Program Files access
     */
    async checkProgramFilesAccess() {
        try {
            if (process.platform === 'win32') {
                const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
                await fs.promises.access(programFiles, fs.constants.R_OK);
                return true;
            }
            return true; // Assume access on non-Windows
        } catch (error) {
            return false;
        }
    }

    /**
     * Check System32 access
     */
    async checkSystem32Access() {
        try {
            if (process.platform === 'win32') {
                await fs.promises.access('C:\\Windows\\System32', fs.constants.R_OK);
                return true;
            }
            return true; // Assume access on non-Windows
        } catch (error) {
            return false;
        }
    }

    /**
     * Check internet access
     */
    async checkInternetAccess() {
        try {
            const { stdout } = await execAsync('ping -n 1 8.8.8.8');
            return stdout.includes('Reply from');
        } catch (error) {
            return false;
        }
    }

    /**
     * Check proxy configuration
     */
    async checkProxyConfiguration() {
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable');
                return stdout.includes('0x1');
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check PowerShell execution policy
     */
    async checkScriptExecutionPolicy() {
        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('powershell -Command "Get-ExecutionPolicy"');
                return !stdout.includes('Restricted');
            }
            return true; // Assume scripts can run on non-Windows
        } catch (error) {
            return false;
        }
    }

    /**
     * Check hosts file access
     */
    async checkHostsFileAccess() {
        try {
            if (process.platform === 'win32') {
                await fs.promises.access('C:\\Windows\\System32\\drivers\\etc\\hosts', fs.constants.R_OK);
                return true;
            } else {
                await fs.promises.access('/etc/hosts', fs.constants.R_OK);
                return true;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Calculate risk level based on privileges
     */
    calculateRiskLevel(status) {
        let riskScore = 0;

        // Higher privileges = higher risk
        if (status.isAdmin) riskScore += 3;
        if (status.canModifySystem) riskScore += 2;
        if (status.canModifyRegistry) riskScore += 2;
        if (status.canInstallDrivers) riskScore += 3;

        // Security restrictions reduce risk
        if (status.uacEnabled) riskScore -= 1;
        if (status.antivirusDetected) riskScore -= 1;
        if (status.firewallEnabled) riskScore -= 1;

        // Tool availability affects risk
        if (status.pythonInstalled) riskScore += 1;
        if (status.canInstallPython) riskScore += 2;

        if (riskScore >= 5) return 'high';
        if (riskScore >= 2) return 'medium';
        return 'low';
    }

    /**
     * Generate recommendations based on privilege status
     */
    generateRecommendations(status) {
        const recommendations = [];

        if (status.riskLevel === 'high') {
            recommendations.push('High privilege level detected. Use with caution.');
        }

        if (!status.pythonInstalled && status.canInstallPython) {
            recommendations.push('Python can be installed silently for advanced automation.');
        }

        if (status.canInstallSilently) {
            recommendations.push('Silent installations are possible.');
        }

        if (status.antivirusDetected) {
            recommendations.push('Antivirus detected. May interfere with downloads.');
        }

        if (status.firewallEnabled) {
            recommendations.push('Firewall is enabled. May block network operations.');
        }

        if (Object.values(status.packageManagers).some(Boolean)) {
            recommendations.push('Package managers available for software installation.');
        }

        return recommendations;
    }

    /**
     * Check if cache is still valid
     */
    isCacheValid() {
        if (!this.lastCheck) return false;
        return (Date.now() - this.lastCheck.getTime()) < this.cacheTimeout;
    }

    /**
     * Get default privilege status when detection fails
     */
    getDefaultPrivilegeStatus() {
        return {
            timestamp: new Date(),
            platform: process.platform,
            isAdmin: false,
            isElevated: false,
            uacEnabled: true,
            canInstallSilently: false,
            canModifySystem: false,
            canModifyRegistry: false,
            canModifyServices: false,
            pythonInstalled: false,
            pipInstalled: false,
            canInstallPython: false,
            nodeInstalled: true, // We're running Node.js
            gitInstalled: false,
            packageManagers: {},
            antivirusDetected: false,
            firewallEnabled: false,
            tempWriteAccess: true,
            programFilesAccess: false,
            system32Access: false,
            internetAccess: true,
            proxyConfigured: false,
            canRunScripts: true,
            canInstallDrivers: false,
            canModifyHosts: false,
            riskLevel: 'medium',
            recommendations: ['Privilege detection failed. Using conservative defaults.']
        };
    }

    /**
     * Get privilege summary for AI decision making
     */
    async getPrivilegeSummary() {
        const status = await this.getPrivilegeStatus();
        
        return {
            canInstallSoftware: status.canInstallSilently || Object.values(status.packageManagers).some(Boolean),
            canModifySystem: status.canModifySystem,
            canUsePython: status.pythonInstalled || status.canInstallPython,
            canUseAdvancedTools: status.isAdmin && !status.uacEnabled,
            riskLevel: status.riskLevel,
            recommendations: status.recommendations.slice(0, 3) // Top 3 recommendations
        };
    }
}

module.exports = PrivilegeDetector;
