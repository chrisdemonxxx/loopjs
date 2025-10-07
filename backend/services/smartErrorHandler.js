/**
 * AI-Powered Smart Error Handler
 * Analyzes errors and automatically retries with optimized commands
 */
class SmartErrorHandler {
    constructor() {
        this.errorPatterns = new Map();
        this.retryStrategies = new Map();
        this.successPatterns = new Map();
        this.initializeErrorPatterns();
    }

    /**
     * Initialize common error patterns and their solutions
     */
    initializeErrorPatterns() {
        // WMIC-related errors
        this.errorPatterns.set('WMIC_NOT_FOUND', {
            pattern: /wmic.*not.*recognized|wmic.*not.*found|'wmic' is not recognized/i,
            solution: 'convert_to_powershell',
            priority: 1
        });

        // PowerShell execution policy errors
        this.errorPatterns.set('POWERSHELL_POLICY', {
            pattern: /execution.*policy|executionpolicy|cannot.*load.*module/i,
            solution: 'bypass_execution_policy',
            priority: 2
        });

        // Permission denied errors
        this.errorPatterns.set('PERMISSION_DENIED', {
            pattern: /access.*denied|permission.*denied|unauthorized/i,
            solution: 'try_alternative_path',
            priority: 3
        });

        // File not found errors
        this.errorPatterns.set('FILE_NOT_FOUND', {
            pattern: /file.*not.*found|cannot.*find.*file|path.*not.*found/i,
            solution: 'search_common_locations',
            priority: 4
        });

        // Network timeout errors
        this.errorPatterns.set('NETWORK_TIMEOUT', {
            pattern: /timeout|timed.*out|connection.*timeout/i,
            solution: 'increase_timeout',
            priority: 5
        });

        // Download errors
        this.errorPatterns.set('DOWNLOAD_ERROR', {
            pattern: /download.*failed|invoke-webrequest.*failed|http.*error/i,
            solution: 'retry_with_different_method',
            priority: 6
        });

        // Process execution errors
        this.errorPatterns.set('PROCESS_ERROR', {
            pattern: /process.*failed|cannot.*start.*process|execution.*failed/i,
            solution: 'try_alternative_execution',
            priority: 7
        });
    }

    /**
     * Main error handling entry point
     * @param {Error} error - The error that occurred
     * @param {Object} originalCommand - The original command that failed
     * @param {Object} clientInfo - Target client information
     * @param {number} retryCount - Current retry count
     * @returns {Object} - Retry command or null if no retry possible
     */
    async handleError(error, originalCommand, clientInfo, retryCount = 0) {
        try {
            console.log(`[AI ERROR HANDLER] Handling error (retry ${retryCount}):`, error.message);
            
            // Analyze error pattern
            const errorAnalysis = await this.analyzeError(error.message);
            
            if (!errorAnalysis) {
                console.log('[AI ERROR HANDLER] No matching error pattern found');
                return null;
            }

            // Generate fix based on error pattern
            const fix = await this.generateFix(originalCommand, errorAnalysis, clientInfo, retryCount);
            
            if (!fix) {
                console.log('[AI ERROR HANDLER] No fix available for this error');
                return null;
            }

            // Store error pattern for learning
            this.learnFromError(errorAnalysis, originalCommand, clientInfo);

            return {
                ...fix,
                retryCount: retryCount + 1,
                errorReason: errorAnalysis.type,
                fixApplied: errorAnalysis.solution
            };

        } catch (handlerError) {
            console.error('[AI ERROR HANDLER] Error in error handler:', handlerError);
            return null;
        }
    }

    /**
     * Analyze error message to identify pattern
     */
    async analyzeError(errorMessage) {
        for (const [errorType, config] of this.errorPatterns.entries()) {
            if (config.pattern.test(errorMessage)) {
                return {
                    type: errorType,
                    solution: config.solution,
                    priority: config.priority,
                    matchedPattern: config.pattern.source
                };
            }
        }
        return null;
    }

    /**
     * Generate fix based on error analysis
     */
    async generateFix(originalCommand, errorAnalysis, clientInfo, retryCount) {
        const { solution } = errorAnalysis;

        switch (solution) {
            case 'convert_to_powershell':
                return await this.convertToPowerShell(originalCommand, clientInfo);
            
            case 'bypass_execution_policy':
                return await this.bypassExecutionPolicy(originalCommand, clientInfo);
            
            case 'try_alternative_path':
                return await this.tryAlternativePath(originalCommand, clientInfo);
            
            case 'search_common_locations':
                return await this.searchCommonLocations(originalCommand, clientInfo);
            
            case 'increase_timeout':
                return await this.increaseTimeout(originalCommand, clientInfo);
            
            case 'retry_with_different_method':
                return await this.retryWithDifferentMethod(originalCommand, clientInfo);
            
            case 'try_alternative_execution':
                return await this.tryAlternativeExecution(originalCommand, clientInfo);
            
            default:
                return await this.genericRetry(originalCommand, clientInfo);
        }
    }

    /**
     * Convert WMIC commands to PowerShell equivalents
     */
    async convertToPowerShell(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Converting WMIC to PowerShell');
        
        const wmicConversions = {
            'wmic computersystem get name': 'Get-WmiObject -Class Win32_ComputerSystem | Select-Object Name',
            'wmic cpu get name': 'Get-WmiObject -Class Win32_Processor | Select-Object Name',
            'wmic memorychip get capacity': 'Get-WmiObject -Class Win32_PhysicalMemory | Select-Object Capacity',
            'wmic logicaldisk get size,freespace': 'Get-WmiObject -Class Win32_LogicalDisk | Select-Object Size,FreeSpace',
            'wmic process get name,processid': 'Get-Process | Select-Object Name,Id',
            'wmic service get name,state': 'Get-Service | Select-Object Name,Status',
            'wmic useraccount get name': 'Get-WmiObject -Class Win32_UserAccount | Select-Object Name',
            'wmic bios get manufacturer,version': 'Get-WmiObject -Class Win32_BIOS | Select-Object Manufacturer,Version'
        };

        let command = originalCommand.command;
        
        // Try exact matches first
        for (const [wmicCmd, psCmd] of Object.entries(wmicConversions)) {
            if (command.toLowerCase().includes(wmicCmd.toLowerCase())) {
                command = command.replace(new RegExp(wmicCmd, 'gi'), psCmd);
                break;
            }
        }

        // Generic WMIC to PowerShell conversion
        if (command.includes('wmic')) {
            command = command.replace(/wmic\s+(\w+)\s+get\s+(.+)/gi, function(match, wmicClass, fields) {
                const psClass = `Win32_${wmicClass.charAt(0).toUpperCase() + wmicClass.slice(1)}`;
                const psFields = fields.split(',').map(f => f.trim()).join(',');
                return `Get-WmiObject -Class ${psClass} | Select-Object ${psFields}`;
            });
        }

        return {
            ...originalCommand,
            command: `Write-Host '=== CONVERTED FROM WMIC TO POWERSHELL ==='; ${command}`,
            type: 'powershell',
            fixApplied: 'wmic_to_powershell'
        };
    }

    /**
     * Bypass PowerShell execution policy
     */
    async bypassExecutionPolicy(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Bypassing PowerShell execution policy');
        
        return {
            ...originalCommand,
            command: `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; ${originalCommand.command}`,
            fixApplied: 'bypass_execution_policy'
        };
    }

    /**
     * Try alternative paths for file operations
     */
    async tryAlternativePath(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Trying alternative paths');
        
        const commonPaths = [
            'C:\\Windows\\System32\\',
            'C:\\Program Files\\',
            'C:\\Program Files (x86)\\',
            'C:\\Users\\Public\\',
            'C:\\temp\\',
            'C:\\Windows\\Temp\\'
        ];

        let command = originalCommand.command;
        
        // Extract file path from command
        const pathMatch = command.match(/([A-Za-z]:\\[^'"\s]+)/);
        if (pathMatch) {
            const originalPath = pathMatch[1];
            const fileName = originalPath.split('\\').pop();
            
            // Try common locations
            const alternativePaths = commonPaths.map(path => `${path}${fileName}`);
            const pathChecks = alternativePaths.map(path => 
                `if (Test-Path '${path}') { Write-Host 'Found at: ${path}'; '${path}' }`
            ).join(' else ');
            
            command = command.replace(originalPath, `(${pathChecks})`);
        }

        return {
            ...originalCommand,
            command: `Write-Host '=== TRYING ALTERNATIVE PATHS ==='; ${command}`,
            fixApplied: 'alternative_paths'
        };
    }

    /**
     * Search common locations for files
     */
    async searchCommonLocations(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Searching common locations');
        
        const searchCommand = `
            Write-Host '=== SEARCHING COMMON LOCATIONS ===';
            $searchPaths = @('C:\\Windows\\System32\\', 'C:\\Program Files\\', 'C:\\Program Files (x86)\\', 'C:\\Users\\Public\\', 'C:\\temp\\');
            $fileName = '${originalCommand.command.match(/([^\\/]+)$/)?.[1] || 'file'}';
            foreach ($path in $searchPaths) {
                $found = Get-ChildItem $path -Filter $fileName -ErrorAction SilentlyContinue;
                if ($found) {
                    Write-Host "Found: $($found.FullName)";
                    $found.FullName;
                    break;
                }
            }
        `;

        return {
            ...originalCommand,
            command: searchCommand,
            fixApplied: 'search_common_locations'
        };
    }

    /**
     * Increase timeout for long-running commands
     */
    async increaseTimeout(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Increasing timeout');
        
        const newTimeout = Math.min((originalCommand.timeout || 30) * 2, 600); // Max 10 minutes
        
        return {
            ...originalCommand,
            timeout: newTimeout,
            command: `Write-Host '=== INCREASED TIMEOUT TO ${newTimeout}s ==='; ${originalCommand.command}`,
            fixApplied: 'increased_timeout'
        };
    }

    /**
     * Retry with different download method
     */
    async retryWithDifferentMethod(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Retrying with different download method');
        
        let command = originalCommand.command;
        
        // Replace Invoke-WebRequest with alternative methods
        if (command.includes('Invoke-WebRequest')) {
            // Try with different parameters
            command = command.replace(
                'Invoke-WebRequest',
                'Invoke-WebRequest -UseBasicParsing -UserAgent "Mozilla/5.0" -TimeoutSec 300'
            );
        }

        return {
            ...originalCommand,
            command: `Write-Host '=== RETRYING WITH DIFFERENT METHOD ==='; ${command}`,
            fixApplied: 'different_download_method'
        };
    }

    /**
     * Try alternative execution method
     */
    async tryAlternativeExecution(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Trying alternative execution method');
        
        let command = originalCommand.command;
        
        // Try cmd.exe instead of PowerShell
        if (command.includes('Start-Process')) {
            command = command.replace(
                'Start-Process',
                'cmd.exe /c'
            );
        }

        return {
            ...originalCommand,
            command: `Write-Host '=== TRYING ALTERNATIVE EXECUTION ==='; ${command}`,
            type: 'cmd',
            fixApplied: 'alternative_execution'
        };
    }

    /**
     * Generic retry with basic modifications
     */
    async genericRetry(originalCommand, clientInfo) {
        console.log('[AI ERROR HANDLER] Generic retry');
        
        return {
            ...originalCommand,
            command: `Write-Host '=== GENERIC RETRY ==='; ${originalCommand.command}`,
            timeout: (originalCommand.timeout || 30) + 30,
            fixApplied: 'generic_retry'
        };
    }

    /**
     * Learn from errors for future improvements
     */
    learnFromError(errorAnalysis, originalCommand, clientInfo) {
        const key = `${clientInfo.uuid}_${errorAnalysis.type}`;
        
        if (!this.errorPatterns.has(key)) {
            this.errorPatterns.set(key, {
                count: 1,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                clientInfo: clientInfo
            });
        } else {
            const existing = this.errorPatterns.get(key);
            existing.count++;
            existing.lastSeen = new Date().toISOString();
            this.errorPatterns.set(key, existing);
        }
    }

    /**
     * Get error statistics for analytics
     */
    getErrorStatistics() {
        const stats = {
            totalErrors: 0,
            errorTypes: {},
            topErrors: [],
            clientErrors: {}
        };

        for (const [key, data] of this.errorPatterns.entries()) {
            stats.totalErrors += data.count;
            
            const errorType = key.split('_')[0];
            stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + data.count;
            
            if (data.clientInfo) {
                const clientId = data.clientInfo.uuid;
                stats.clientErrors[clientId] = (stats.clientErrors[clientId] || 0) + data.count;
            }
        }

        // Sort by frequency
        stats.topErrors = Object.entries(stats.errorTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return stats;
    }

    /**
     * Clear old error patterns (cleanup)
     */
    cleanupOldPatterns(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        const cutoff = new Date(Date.now() - maxAge);
        
        for (const [key, data] of this.errorPatterns.entries()) {
            if (new Date(data.lastSeen) < cutoff) {
                this.errorPatterns.delete(key);
            }
        }
    }
}

module.exports = SmartErrorHandler;
