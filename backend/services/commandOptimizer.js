/**
 * AI Command Optimization Engine
 * Optimizes commands for better success rates and performance
 */
class CommandOptimizer {
    constructor() {
        this.optimizationRules = new Map();
        this.performanceMetrics = new Map();
        this.clientCapabilities = new Map();
        this.initializeOptimizationRules();
    }

    /**
     * Initialize optimization rules
     */
    initializeOptimizationRules() {
        // PowerShell optimization rules
        this.optimizationRules.set('powershell_output', {
            pattern: /Get-WmiObject.*Format-Table/i,
            optimization: (command) => {
                // Add error handling and better output formatting
                return command.replace(
                    /Get-WmiObject(.*?)\|(.*?)$/i,
                    'try { Get-WmiObject$1 | $2 } catch { Write-Host "Error: " + $_.Exception.Message }'
                );
            },
            priority: 1
        });

        // Download optimization rules
        this.optimizationRules.set('download_optimization', {
            pattern: /Invoke-WebRequest/i,
            optimization: (command) => {
                // Add progress indication and error handling
                if (!command.includes('Write-Host')) {
                    return command.replace(
                        /Invoke-WebRequest/,
                        'Write-Host "Starting download..."; Invoke-WebRequest -UseBasicParsing'
                    );
                }
                return command;
            },
            priority: 2
        });

        // File operation optimization rules
        this.optimizationRules.set('file_operation_safety', {
            pattern: /Remove-Item|Copy-Item|Move-Item/i,
            optimization: (command) => {
                // Add safety checks for file operations
                if (command.includes('Remove-Item') && !command.includes('Test-Path')) {
                    return command.replace(
                        /Remove-Item\s+([^\s]+)/i,
                        'if (Test-Path $1) { Remove-Item $1 -Force } else { Write-Host "File not found: $1" }'
                    );
                }
                return command;
            },
            priority: 3
        });

        // Process execution optimization rules
        this.optimizationRules.set('process_execution', {
            pattern: /Start-Process/i,
            optimization: (command) => {
                // Add error handling for process execution
                if (!command.includes('try {')) {
                    return `try { ${command} } catch { Write-Host "Process execution failed: " + $_.Exception.Message }`;
                }
                return command;
            },
            priority: 4
        });
    }

    /**
     * Main optimization entry point
     * @param {Object} command - Command to optimize
     * @param {Object} clientInfo - Target client information
     * @returns {Object} - Optimized command
     */
    async optimizeCommand(command, clientInfo) {
        try {
            console.log('[AI OPTIMIZER] Optimizing command for client:', clientInfo.uuid);
            
            let optimizedCommand = { ...command };
            
            // Apply general optimizations
            optimizedCommand = await this.applyGeneralOptimizations(optimizedCommand);
            
            // Apply client-specific optimizations
            optimizedCommand = await this.applyClientSpecificOptimizations(optimizedCommand, clientInfo);
            
            // Apply performance optimizations
            optimizedCommand = await this.applyPerformanceOptimizations(optimizedCommand, clientInfo);
            
            // Apply safety optimizations
            optimizedCommand = await this.applySafetyOptimizations(optimizedCommand, clientInfo);
            
            // Record optimization metrics
            this.recordOptimizationMetrics(command, optimizedCommand, clientInfo);
            
            return optimizedCommand;
            
        } catch (error) {
            console.error('[AI OPTIMIZER] Error optimizing command:', error);
            return command; // Return original command if optimization fails
        }
    }

    /**
     * Apply general optimizations
     */
    async applyGeneralOptimizations(command) {
        let optimizedCommand = command.command;
        
        // Apply all optimization rules
        for (const [ruleName, rule] of this.optimizationRules.entries()) {
            if (rule.pattern.test(optimizedCommand)) {
                console.log(`[AI OPTIMIZER] Applying rule: ${ruleName}`);
                optimizedCommand = rule.optimization(optimizedCommand);
            }
        }
        
        // Add common error handling wrapper based on command type
        if (!optimizedCommand.includes('try {') && !optimizedCommand.includes('Write-Host') && !optimizedCommand.includes('echo')) {
            if (command.type === 'cmd') {
                // For CMD commands, use CMD syntax
                optimizedCommand = `echo === COMMAND STARTING === && ${optimizedCommand} && echo === COMMAND COMPLETE ===`;
            } else {
                // For PowerShell commands, use PowerShell syntax
                optimizedCommand = `Write-Host "=== COMMAND STARTING ==="; try { ${optimizedCommand} } catch { Write-Host "Error: " + $_.Exception.Message } finally { Write-Host "=== COMMAND COMPLETE ===" }`;
            }
        }
        
        return {
            ...command,
            command: optimizedCommand
        };
    }

    /**
     * Apply client-specific optimizations
     */
    async applyClientSpecificOptimizations(command, clientInfo) {
        const clientId = clientInfo.uuid;
        const capabilities = this.clientCapabilities.get(clientId) || await this.detectClientCapabilities(clientInfo);
        
        let optimizedCommand = command.command;
        
        // Windows version specific optimizations
        if (capabilities.isWindows11 && optimizedCommand.includes('wmic')) {
            console.log('[AI OPTIMIZER] Converting WMIC for Windows 11 compatibility');
            optimizedCommand = this.convertWMICForWindows11(optimizedCommand);
        }
        
        // PowerShell version optimizations
        if (capabilities.powershellVersion < 5.0 && optimizedCommand.includes('Get-NetAdapter')) {
            console.log('[AI OPTIMIZER] Using legacy network commands for older PowerShell');
            optimizedCommand = optimizedCommand.replace(
                'Get-NetAdapter',
                'Get-WmiObject -Class Win32_NetworkAdapter'
            );
        }
        
        // Memory optimization for low-memory systems
        if (capabilities.totalMemory < 4 * 1024 * 1024 * 1024) { // Less than 4GB
            console.log('[AI OPTIMIZER] Optimizing for low-memory system');
            optimizedCommand = this.optimizeForLowMemory(optimizedCommand);
        }
        
        return {
            ...command,
            command: optimizedCommand
        };
    }

    /**
     * Apply performance optimizations
     */
    async applyPerformanceOptimizations(command, clientInfo) {
        let optimizedCommand = command.command;
        
        // Optimize file operations for better performance
        if (optimizedCommand.includes('Get-ChildItem -Recurse')) {
            console.log('[AI OPTIMIZER] Optimizing recursive file operations');
            optimizedCommand = optimizedCommand.replace(
                'Get-ChildItem -Recurse',
                'Get-ChildItem -Recurse -ErrorAction SilentlyContinue'
            );
        }
        
        // Optimize WMI queries
        if (optimizedCommand.includes('Get-WmiObject')) {
            console.log('[AI OPTIMIZER] Optimizing WMI queries');
            optimizedCommand = optimizedCommand.replace(
                'Get-WmiObject',
                'Get-WmiObject -ErrorAction SilentlyContinue'
            );
        }
        
        // Add timeout for long-running operations
        if (optimizedCommand.includes('Invoke-WebRequest') && !optimizedCommand.includes('TimeoutSec')) {
            optimizedCommand = optimizedCommand.replace(
                'Invoke-WebRequest',
                'Invoke-WebRequest -TimeoutSec 300'
            );
        }
        
        return {
            ...command,
            command: optimizedCommand,
            timeout: Math.max(command.timeout || 30, this.calculateOptimalTimeout(optimizedCommand))
        };
    }

    /**
     * Apply safety optimizations
     */
    async applySafetyOptimizations(command, clientInfo) {
        let optimizedCommand = command.command;
        
        // Add safety checks for destructive operations
        if (optimizedCommand.includes('Remove-Item') && !optimizedCommand.includes('Test-Path')) {
            console.log('[AI OPTIMIZER] Adding safety checks for file deletion');
            optimizedCommand = optimizedCommand.replace(
                /Remove-Item\s+([^\s]+)/gi,
                'if (Test-Path $1) { Remove-Item $1 -Force } else { Write-Host "File not found: $1" }'
            );
        }
        
        // Add confirmation for system operations
        if (optimizedCommand.includes('Restart-Service') || optimizedCommand.includes('Stop-Service')) {
            console.log('[AI OPTIMIZER] Adding safety checks for service operations');
            optimizedCommand = optimizedCommand.replace(
                /(Restart-Service|Stop-Service)/gi,
                '$1 -Force'
            );
        }
        
        return {
            ...command,
            command: optimizedCommand
        };
    }

    /**
     * Convert WMIC commands for Windows 11 compatibility
     */
    convertWMICForWindows11(command) {
        const wmicConversions = {
            'wmic computersystem get name,manufacturer': 'Get-WmiObject -Class Win32_ComputerSystem | Select-Object Name,Manufacturer',
            'wmic cpu get name,numberofcores': 'Get-WmiObject -Class Win32_Processor | Select-Object Name,NumberOfCores',
            'wmic memorychip get capacity,speed': 'Get-WmiObject -Class Win32_PhysicalMemory | Select-Object Capacity,Speed',
            'wmic logicaldisk get size,freespace,caption': 'Get-WmiObject -Class Win32_LogicalDisk | Select-Object Size,FreeSpace,Caption',
            'wmic process get name,processid,commandline': 'Get-Process | Select-Object Name,Id,ProcessName',
            'wmic service get name,state,startmode': 'Get-Service | Select-Object Name,Status,StartType',
            'wmic useraccount get name,domain,disabled': 'Get-WmiObject -Class Win32_UserAccount | Select-Object Name,Domain,Disabled',
            'wmic bios get manufacturer,version,serialnumber': 'Get-WmiObject -Class Win32_BIOS | Select-Object Manufacturer,Version,SerialNumber'
        };

        let convertedCommand = command;
        
        for (const [wmicCmd, psCmd] of Object.entries(wmicConversions)) {
            if (convertedCommand.toLowerCase().includes(wmicCmd.toLowerCase())) {
                convertedCommand = convertedCommand.replace(
                    new RegExp(wmicCmd, 'gi'),
                    psCmd
                );
                break;
            }
        }
        
        return convertedCommand;
    }

    /**
     * Optimize commands for low-memory systems
     */
    optimizeForLowMemory(command) {
        let optimizedCommand = command;
        
        // Limit output for memory-intensive operations
        if (optimizedCommand.includes('Get-Process')) {
            optimizedCommand = optimizedCommand.replace(
                'Get-Process',
                'Get-Process | Select-Object -First 20'
            );
        }
        
        if (optimizedCommand.includes('Get-Service')) {
            optimizedCommand = optimizedCommand.replace(
                'Get-Service',
                'Get-Service | Where-Object {$_.Status -eq "Running"}'
            );
        }
        
        return optimizedCommand;
    }

    /**
     * Calculate optimal timeout based on command type
     */
    calculateOptimalTimeout(command) {
        if (command.includes('Invoke-WebRequest')) return 300; // 5 minutes for downloads
        if (command.includes('Get-ChildItem -Recurse')) return 180; // 3 minutes for recursive operations
        if (command.includes('Get-WmiObject')) return 60; // 1 minute for WMI queries
        if (command.includes('Start-Process')) return 120; // 2 minutes for process execution
        return 30; // Default 30 seconds
    }

    /**
     * Detect client capabilities
     */
    async detectClientCapabilities(clientInfo) {
        const platform = clientInfo.platform || '';
        const systemInfo = clientInfo.systemInfo || {};
        
        const capabilities = {
            isWindows: platform.includes('Windows') || platform.includes('Win32'),
            isWindows11: platform.includes('Windows 11') || platform.includes('10.0.22000'),
            powershellVersion: this.detectPowerShellVersion(systemInfo),
            totalMemory: this.parseMemory(systemInfo.TotalPhysicalMemory),
            processorCount: parseInt(systemInfo.ProcessorCount) || 1,
            is64Bit: systemInfo.Is64BitOperatingSystem === 'True'
        };
        
        this.clientCapabilities.set(clientInfo.uuid, capabilities);
        return capabilities;
    }

    /**
     * Detect PowerShell version from system info
     */
    detectPowerShellVersion(systemInfo) {
        // This would be implemented based on actual PowerShell version detection
        // For now, assume modern PowerShell for Windows 10+
        return 5.1;
    }

    /**
     * Parse memory string to bytes
     */
    parseMemory(memoryString) {
        if (!memoryString) return 0;
        
        const match = memoryString.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Record optimization metrics
     */
    recordOptimizationMetrics(originalCommand, optimizedCommand, clientInfo) {
        const metrics = {
            clientId: clientInfo.uuid,
            originalLength: originalCommand.command.length,
            optimizedLength: optimizedCommand.command.length,
            optimizationsApplied: this.countOptimizations(originalCommand.command, optimizedCommand.command),
            timestamp: new Date().toISOString()
        };
        
        const key = `${clientInfo.uuid}_${Date.now()}`;
        this.performanceMetrics.set(key, metrics);
    }

    /**
     * Count number of optimizations applied
     */
    countOptimizations(original, optimized) {
        let count = 0;
        
        // Count different optimization patterns
        if (optimized.includes('try {') && !original.includes('try {')) count++;
        if (optimized.includes('Write-Host') && !original.includes('Write-Host')) count++;
        if (optimized.includes('ErrorAction SilentlyContinue') && !original.includes('ErrorAction SilentlyContinue')) count++;
        if (optimized.includes('Test-Path') && !original.includes('Test-Path')) count++;
        
        return count;
    }

    /**
     * Get optimization statistics
     */
    getOptimizationStatistics() {
        const stats = {
            totalOptimizations: this.performanceMetrics.size,
            averageOptimizationsPerCommand: 0,
            topOptimizations: {},
            clientOptimizations: {}
        };

        let totalOptimizations = 0;
        
        for (const [key, metrics] of this.performanceMetrics.entries()) {
            totalOptimizations += metrics.optimizationsApplied;
            
            const clientId = metrics.clientId;
            stats.clientOptimizations[clientId] = (stats.clientOptimizations[clientId] || 0) + metrics.optimizationsApplied;
        }

        stats.averageOptimizationsPerCommand = stats.totalOptimizations > 0 
            ? totalOptimizations / stats.totalOptimizations 
            : 0;

        return stats;
    }

    /**
     * Add error handling to commands
     */
    addErrorHandling(command) {
        if (command.type === 'powershell') {
            // PowerShell error handling
            return {
                ...command,
                command: `try { ` +
                        `${command.command} ` +
                        `} catch { ` +
                        `Write-Host 'Error: ' + $_.Exception.Message; ` +
                        `Write-Host 'Stack Trace: ' + $_.ScriptStackTrace ` +
                        `}`
            };
        } else if (command.type === 'cmd') {
            // CMD error handling
            return {
                ...command,
                command: `${command.command} || echo Error: Command failed`
            };
        }
        
        return command;
    }

    /**
     * Cleanup old metrics
     */
    cleanupOldMetrics(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const cutoff = new Date(Date.now() - maxAge);
        
        for (const [key, metrics] of this.performanceMetrics.entries()) {
            if (new Date(metrics.timestamp) < cutoff) {
                this.performanceMetrics.delete(key);
            }
        }
    }
}

module.exports = CommandOptimizer;
