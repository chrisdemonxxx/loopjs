const path = require('path');

/**
 * AI-Powered Command Processor
 * Translates simple user inputs into optimized technical commands
 */
class AICommandProcessor {
    constructor() {
        this.commandHistory = new Map(); // Store successful command patterns
        this.errorPatterns = new Map(); // Store error-to-solution mappings
        this.clientProfiles = new Map(); // Store client-specific optimizations
    }

    /**
     * Main entry point for command processing
     * @param {Object} params - Command parameters from frontend
     * @param {Object} clientInfo - Target client information
     * @returns {Object} - Optimized command with execution strategy
     */
    async processCommand(params, clientInfo) {
        try {
            console.log('[AI PROCESSOR] Processing command:', JSON.stringify(params));
            
            const { category, action, ...commandParams } = params;
            
            // Analyze command type and generate base command
            const baseCommand = await this.generateBaseCommand(category, action, commandParams);
            
            // Optimize command based on client profile
            const optimizedCommand = await this.optimizeForClient(baseCommand, clientInfo);
            
            // Create execution strategy
            const strategy = await this.createExecutionStrategy(optimizedCommand, clientInfo);
            
            return {
                originalParams: params,
                optimizedCommand: optimizedCommand,
                executionStrategy: strategy,
                retryCount: 0,
                maxRetries: 3,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('[AI PROCESSOR] Error processing command:', error);
            throw error;
        }
    }

    /**
     * Generate base command based on category and action
     */
    async generateBaseCommand(category, action, params) {
        switch (category) {
            case 'download_exec':
                return this.generateDownloadCommand(action, params);
            case 'system_info':
                return this.generateSystemInfoCommand(action, params);
            case 'file_ops':
                return this.generateFileOpsCommand(action, params);
            case 'network':
                return this.generateNetworkCommand(action, params);
            case 'security':
                return this.generateSecurityCommand(action, params);
            case 'system_mgmt':
                return this.generateSystemMgmtCommand(action, params);
            case 'power_command':
                return this.generatePowerCommand(action, params);
            case 'custom_command':
                return this.generateCustomCommand(action, params);
            case 'natural_language':
                return this.generateNaturalLanguageCommand(action, params);
            default:
                throw new Error(`Unknown command category: ${category}`);
        }
    }

    /**
     * Generate download and execute commands
     */
    generateDownloadCommand(action, params) {
        const { url, savePath, execute, runAsAdmin, runHidden, timeout } = params;
        
        if (!url) {
            throw new Error('URL is required for download commands');
        }

        const defaultPath = savePath || 'C:\\temp\\downloaded_file.exe';
        const dir = path.dirname(defaultPath);
        
        let command = `Write-Host '=== AI DOWNLOAD STARTING ==='; `;
        
        // Create directory if needed
        command += `if (!(Test-Path '${dir}')) { Write-Host 'Creating directory: ${dir}'; New-Item -ItemType Directory -Path '${dir}' -Force }; `;
        
        // Download with progress and error handling
        command += `Write-Host 'Downloading from: ${url}'; `;
        command += `Write-Host 'Saving to: ${defaultPath}'; `;
        command += `try { `;
        command += `$ProgressPreference = 'SilentlyContinue'; `;
        command += `Invoke-WebRequest -Uri '${url}' -OutFile '${defaultPath}' -UseBasicParsing -TimeoutSec ${timeout || 300}; `;
        command += `} catch { Write-Host 'Download error: ' + $_.Exception.Message; throw }; `;
        
        // Verify download
        command += `if (Test-Path '${defaultPath}') { `;
        command += `Write-Host 'SUCCESS: File downloaded successfully'; `;
        command += `$file = Get-Item '${defaultPath}'; `;
        command += `Write-Host 'File: ' + $file.Name; `;
        command += `Write-Host 'Size: ' + $file.Length + ' bytes'; `;
        command += `Write-Host 'Modified: ' + $file.LastWriteTime; `;
        command += `} else { Write-Host 'ERROR: File not found after download'; throw 'Download failed' }; `;
        
        // Execute if requested
        if (execute) {
            command += `Write-Host '=== EXECUTING FILE ==='; `;
            if (runAsAdmin) {
                command += `Start-Process '${defaultPath}' -Verb RunAs -Wait; `;
            } else if (runHidden) {
                command += `Start-Process '${defaultPath}' -WindowStyle Hidden -Wait; `;
            } else {
                command += `Start-Process '${defaultPath}' -Wait; `;
            }
            command += `Write-Host 'File execution completed'; `;
        }
        
        command += `Write-Host '=== AI DOWNLOAD COMPLETE ==='; `;
        
        return {
            type: 'powershell',
            command: command,
            timeout: timeout || 300,
            category: 'download_exec',
            action: action
        };
    }

    /**
     * Generate system information commands
     */
    generateSystemInfoCommand(action, params) {
        const commands = {
            'computer': {
                type: 'powershell',
                command: `Write-Host '=== COMPUTER INFORMATION ==='; Get-WmiObject -Class Win32_ComputerSystem | Select-Object Name,Manufacturer,Model,SystemType,TotalPhysicalMemory | Format-Table -AutoSize; Write-Host '=== COMPUTER INFO COMPLETE ==='`,
                timeout: 30
            },
            'memory': {
                type: 'powershell',
                command: `Write-Host '=== MEMORY INFORMATION ==='; Get-WmiObject -Class Win32_PhysicalMemory | Select-Object Capacity,Speed,Manufacturer,PartNumber | Format-Table -AutoSize; Write-Host '=== MEMORY INFO COMPLETE ==='`,
                timeout: 30
            },
            'cpu': {
                type: 'powershell',
                command: `Write-Host '=== CPU INFORMATION ==='; Get-WmiObject -Class Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed,Manufacturer | Format-Table -AutoSize; Write-Host '=== CPU INFO COMPLETE ==='`,
                timeout: 30
            },
            'disk': {
                type: 'powershell',
                command: `Write-Host '=== DISK INFORMATION ==='; Get-WmiObject -Class Win32_LogicalDisk | Select-Object Size,FreeSpace,Caption,FileSystem | Format-Table -AutoSize; Write-Host '=== DISK INFO COMPLETE ==='`,
                timeout: 30
            },
            'network': {
                type: 'powershell',
                command: `Write-Host '=== NETWORK INFORMATION ==='; Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object Name,InterfaceDescription,Status,LinkSpeed | Format-Table -AutoSize; Write-Host '=== NETWORK INFO COMPLETE ==='`,
                timeout: 30
            },
            'users': {
                type: 'powershell',
                command: `Write-Host '=== USER INFORMATION ==='; Get-WmiObject -Class Win32_UserAccount | Select-Object Name,Domain,Disabled,AccountType | Format-Table -AutoSize; Write-Host '=== USER INFO COMPLETE ==='`,
                timeout: 30
            },
            'processes': {
                type: 'powershell',
                command: `Write-Host '=== PROCESS INFORMATION ==='; Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Name,CPU,WorkingSet,Id | Format-Table -AutoSize; Write-Host '=== PROCESS INFO COMPLETE ==='`,
                timeout: 30
            },
            'services': {
                type: 'powershell',
                command: `Write-Host '=== SERVICE INFORMATION ==='; Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object Name,Status,StartType | Format-Table -AutoSize; Write-Host '=== SERVICE INFO COMPLETE ==='`,
                timeout: 30
            }
        };

        const selectedCommand = commands[action];
        if (!selectedCommand) {
            throw new Error(`Unknown system info action: ${action}`);
        }

        return {
            ...selectedCommand,
            category: 'system_info',
            action: action
        };
    }

    /**
     * Generate file operations commands
     */
    generateFileOpsCommand(action, params) {
        const { sourcePath, destPath, filePath, searchPattern } = params;
        
        switch (action) {
            case 'list_files':
                const listPath = sourcePath || 'C:\\';
                return {
                    type: 'powershell',
                    command: `Write-Host '=== LISTING FILES ==='; Get-ChildItem '${listPath}' -Force | Select-Object Name,Length,LastWriteTime,Attributes | Format-Table -AutoSize; Write-Host '=== FILE LIST COMPLETE ==='`,
                    timeout: 60,
                    category: 'file_ops',
                    action: 'list_files'
                };
                
            case 'copy_file':
                if (!sourcePath || !destPath) {
                    throw new Error('Source and destination paths are required for copy operation');
                }
                return {
                    type: 'powershell',
                    command: `Write-Host '=== COPYING FILE ==='; Copy-Item '${sourcePath}' '${destPath}' -Force; Write-Host 'File copied successfully'; Write-Host '=== COPY COMPLETE ==='`,
                    timeout: 120,
                    category: 'file_ops',
                    action: 'copy_file'
                };
                
            case 'delete_file':
                if (!filePath) {
                    throw new Error('File path is required for delete operation');
                }
                return {
                    type: 'powershell',
                    command: `Write-Host '=== DELETING FILE ==='; Remove-Item '${filePath}' -Force; Write-Host 'File deleted successfully'; Write-Host '=== DELETE COMPLETE ==='`,
                    timeout: 30,
                    category: 'file_ops',
                    action: 'delete_file'
                };
                
            case 'search_files':
                const searchPath = sourcePath || 'C:\\';
                const pattern = searchPattern || '*';
                return {
                    type: 'powershell',
                    command: `Write-Host '=== SEARCHING FILES ==='; Get-ChildItem '${searchPath}' -Recurse -Filter '${pattern}' -ErrorAction SilentlyContinue | Select-Object Name,FullName,Length | Format-Table -AutoSize; Write-Host '=== SEARCH COMPLETE ==='`,
                    timeout: 300,
                    category: 'file_ops',
                    action: 'search_files'
                };
                
            default:
                throw new Error(`Unknown file operation: ${action}`);
        }
    }

    /**
     * Generate network commands
     */
    generateNetworkCommand(action, params) {
        const { target, port, count } = params;
        
        switch (action) {
            case 'ping':
                const pingTarget = target || 'google.com';
                const pingCount = count || 4;
                return {
                    type: 'powershell',
                    command: `Write-Host '=== PING TEST ==='; Test-Connection -ComputerName '${pingTarget}' -Count ${pingCount} | Format-Table -AutoSize; Write-Host '=== PING COMPLETE ==='`,
                    timeout: 60,
                    category: 'network',
                    action: 'ping'
                };
                
            case 'port_scan':
                if (!target || !port) {
                    throw new Error('Target and port are required for port scan');
                }
                return {
                    type: 'powershell',
                    command: `Write-Host '=== PORT SCAN ==='; Test-NetConnection -ComputerName '${target}' -Port ${port} | Format-Table -AutoSize; Write-Host '=== PORT SCAN COMPLETE ==='`,
                    timeout: 30,
                    category: 'network',
                    action: 'port_scan'
                };
                
            case 'network_info':
                return {
                    type: 'powershell',
                    command: `Write-Host '=== NETWORK INFO ==='; Get-NetIPConfiguration | Format-Table -AutoSize; Write-Host '=== NETWORK INFO COMPLETE ==='`,
                    timeout: 30,
                    category: 'network',
                    action: 'network_info'
                };
                
            default:
                throw new Error(`Unknown network operation: ${action}`);
        }
    }

    /**
     * Generate security commands
     */
    generateSecurityCommand(action, params) {
        switch (action) {
            case 'firewall_status':
                return {
                    type: 'powershell',
                    command: `Write-Host '=== FIREWALL STATUS ==='; Get-NetFirewallProfile | Format-Table -AutoSize; Write-Host '=== FIREWALL STATUS COMPLETE ==='`,
                    timeout: 30,
                    category: 'security',
                    action: 'firewall_status'
                };
                
            case 'antivirus_status':
                return {
                    type: 'powershell',
                    command: `Write-Host '=== ANTIVIRUS STATUS ==='; Get-MpComputerStatus | Format-Table -AutoSize; Write-Host '=== ANTIVIRUS STATUS COMPLETE ==='`,
                    timeout: 30,
                    category: 'security',
                    action: 'antivirus_status'
                };
                
            default:
                throw new Error(`Unknown security operation: ${action}`);
        }
    }

    /**
     * Generate system management commands
     */
    generateSystemMgmtCommand(action, params) {
        switch (action) {
            case 'restart_service':
                const { serviceName } = params;
                if (!serviceName) {
                    throw new Error('Service name is required for restart operation');
                }
                return {
                    type: 'powershell',
                    command: `Write-Host '=== RESTARTING SERVICE ==='; Restart-Service -Name '${serviceName}' -Force; Write-Host 'Service restarted successfully'; Write-Host '=== SERVICE RESTART COMPLETE ==='`,
                    timeout: 60,
                    category: 'system_mgmt',
                    action: 'restart_service'
                };
                
            case 'kill_process':
                const { processName } = params;
                if (!processName) {
                    throw new Error('Process name is required for kill operation');
                }
                return {
                    type: 'powershell',
                    command: `Write-Host '=== KILLING PROCESS ==='; Stop-Process -Name '${processName}' -Force; Write-Host 'Process killed successfully'; Write-Host '=== PROCESS KILL COMPLETE ==='`,
                    timeout: 30,
                    category: 'system_mgmt',
                    action: 'kill_process'
                };
                
            default:
                throw new Error(`Unknown system management operation: ${action}`);
        }
    }

    /**
     * Optimize command based on client profile
     */
    async optimizeForClient(command, clientInfo) {
        const clientId = clientInfo.uuid;
        const profile = this.clientProfiles.get(clientId) || {};
        
        // Check if client has WMIC issues
        if (profile.wmicIssues && command.command.includes('wmic')) {
            command = await this.convertWMICToPowerShell(command);
        }
        
        // Check if client has PowerShell execution policy issues
        if (profile.powershellPolicyIssues) {
            command.command = `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; ${command.command}`;
        }
        
        // Store successful patterns
        this.commandHistory.set(`${clientId}_${command.category}_${command.action}`, {
            command: command.command,
            success: true,
            timestamp: new Date().toISOString()
        });
        
        return command;
    }

    /**
     * Convert WMIC commands to PowerShell equivalents
     */
    async convertWMICToPowerShell(command) {
        const wmicMappings = {
            'computersystem': 'Get-WmiObject -Class Win32_ComputerSystem',
            'cpu': 'Get-WmiObject -Class Win32_Processor',
            'memorychip': 'Get-WmiObject -Class Win32_PhysicalMemory',
            'logicaldisk': 'Get-WmiObject -Class Win32_LogicalDisk',
            'process': 'Get-WmiObject -Class Win32_Process',
            'service': 'Get-WmiObject -Class Win32_Service',
            'useraccount': 'Get-WmiObject -Class Win32_UserAccount',
            'bios': 'Get-WmiObject -Class Win32_BIOS'
        };
        
        // This would be implemented based on specific WMIC command patterns
        console.log('[AI PROCESSOR] Converting WMIC to PowerShell for better compatibility');
        
        return command;
    }

    /**
     * Create execution strategy
     */
    async createExecutionStrategy(command, clientInfo) {
        return {
            primaryMethod: command.type,
            fallbackMethods: this.getFallbackMethods(command.type),
            timeout: command.timeout,
            retryOnError: true,
            clientCompatibility: this.checkClientCompatibility(command, clientInfo)
        };
    }

    /**
     * Get fallback methods for command execution
     */
    getFallbackMethods(primaryType) {
        const fallbacks = {
            'powershell': ['cmd', 'wmic'],
            'cmd': ['powershell'],
            'wmic': ['powershell']
        };
        
        return fallbacks[primaryType] || [];
    }

    /**
     * Check client compatibility
     */
    checkClientCompatibility(command, clientInfo) {
        const platform = clientInfo.platform || '';
        const isWindows = platform.includes('Windows') || platform.includes('Win32');
        
        return {
            isWindows: isWindows,
            supportsPowerShell: isWindows,
            supportsWMIC: isWindows && !platform.includes('Windows 11'),
            recommendedMethod: isWindows ? 'powershell' : 'cmd'
        };
    }

    /**
     * Learn from command results
     */
    learnFromResult(commandId, success, error, clientInfo) {
        const key = `${clientInfo.uuid}_${commandId}`;
        
        if (success) {
            this.commandHistory.set(key, {
                success: true,
                timestamp: new Date().toISOString(),
                clientInfo: clientInfo
            });
        } else {
            this.errorPatterns.set(key, {
                error: error,
                timestamp: new Date().toISOString(),
                clientInfo: clientInfo
            });
            
            // Update client profile with error patterns
            const clientId = clientInfo.uuid;
            const profile = this.clientProfiles.get(clientId) || {};
            
            if (error.includes('WMIC') || error.includes('wmic')) {
                profile.wmicIssues = true;
            }
            if (error.includes('execution policy') || error.includes('ExecutionPolicy')) {
                profile.powershellPolicyIssues = true;
            }
            
            this.clientProfiles.set(clientId, profile);
        }
    }

    /**
     * Generate power command with AI optimization
     */
    generatePowerCommand(action, params) {
        const { originalCommand, commandType, commandName } = params;
        
        if (!originalCommand) {
            throw new Error('Original command is required for power command optimization');
        }
        
        // AI optimization based on command type
        let optimizedCommand = originalCommand;
        
        switch (commandType) {
            case 'System':
                // Add error handling and better output formatting
                if (originalCommand.includes('systeminfo')) {
                    optimizedCommand = `echo === SYSTEM INFORMATION === && systeminfo && echo === SYSTEM INFO COMPLETE ===`;
                } else if (originalCommand.includes('tasklist')) {
                    optimizedCommand = `echo === RUNNING PROCESSES === && tasklist /fo table && echo === PROCESS LIST COMPLETE ===`;
                } else if (originalCommand.includes('sc query')) {
                    optimizedCommand = `echo === SERVICES STATUS === && sc query state= all && echo === SERVICES QUERY COMPLETE ===`;
                }
                break;
                
            case 'Network':
                // Add network-specific optimizations
                if (originalCommand.includes('netstat')) {
                    optimizedCommand = `echo === NETWORK CONNECTIONS === && netstat -an && echo === NETWORK SCAN COMPLETE ===`;
                } else if (originalCommand.includes('arp')) {
                    optimizedCommand = `echo === ARP CACHE === && arp -a && echo === ARP TABLE COMPLETE ===`;
                } else if (originalCommand.includes('ipconfig')) {
                    optimizedCommand = `echo === DNS CACHE === && ipconfig /displaydns && echo === DNS CACHE COMPLETE ===`;
                }
                break;
                
            case 'Storage':
                // Add storage-specific optimizations
                if (originalCommand.includes('wmic logicaldisk')) {
                    optimizedCommand = `echo === DISK USAGE === && wmic logicaldisk get size,freespace,caption /format:table && echo === DISK INFO COMPLETE ===`;
                } else if (originalCommand.includes('dir')) {
                    optimizedCommand = `echo === DIRECTORY LISTING === && dir /s && echo === DIRECTORY SCAN COMPLETE ===`;
                }
                break;
                
            case 'Security':
                // Add security-specific optimizations
                if (originalCommand.includes('net user')) {
                    optimizedCommand = `echo === USER ACCOUNTS === && net user && echo === USER LIST COMPLETE ===`;
                } else if (originalCommand.includes('net localgroup')) {
                    optimizedCommand = `echo === USER GROUPS === && net localgroup && echo === GROUP LIST COMPLETE ===`;
                } else if (originalCommand.includes('reg query')) {
                    optimizedCommand = `echo === REGISTRY QUERY === && reg query HKLM\\SOFTWARE && echo === REGISTRY QUERY COMPLETE ===`;
                }
                break;
                
            case 'Advanced':
                // Add advanced command optimizations
                if (originalCommand.includes('wmic process')) {
                    optimizedCommand = `echo === WMI PROCESS QUERY === && wmic process get ProcessId,Name,CommandLine /format:table && echo === WMI QUERY COMPLETE ===`;
                } else if (originalCommand.includes('powershell')) {
                    optimizedCommand = `echo === POWERSHELL EXECUTION === && powershell -Command "Get-Process | Format-Table -AutoSize" && echo === POWERSHELL COMPLETE ===`;
                } else if (originalCommand.includes('Invoke-WebRequest')) {
                    optimizedCommand = `echo === WEB DOWNLOAD === && powershell -Command "Write-Host 'Download functionality available'; Get-Help Invoke-WebRequest" && echo === DOWNLOAD INFO COMPLETE ===`;
                }
                break;
        }
        
        return {
            command: optimizedCommand,
            type: 'cmd',
            category: 'power_command',
            action: action,
            timeout: 60,
            originalCommand: originalCommand,
            commandName: commandName,
            aiOptimized: true
        };
    }

    /**
     * Generate custom command with AI optimization
     */
    generateCustomCommand(action, params) {
        const { customCommand } = params;
        
        if (!customCommand) {
            throw new Error('Custom command is required');
        }
        
        // AI optimization for custom commands
        let optimizedCommand = customCommand;
        
        // Add basic error handling and output formatting
        if (!customCommand.includes('echo')) {
            optimizedCommand = `echo === CUSTOM COMMAND EXECUTION === && ${customCommand} && echo === CUSTOM COMMAND COMPLETE ===`;
        }
        
        // Add timeout protection for potentially long-running commands
        if (customCommand.includes('dir /s') || customCommand.includes('findstr')) {
            optimizedCommand = `echo === CUSTOM COMMAND EXECUTION === && timeout /t 30 /nobreak >nul 2>&1 & ${customCommand} && echo === CUSTOM COMMAND COMPLETE ===`;
        }
        
        return {
            command: optimizedCommand,
            type: 'cmd',
            category: 'custom_command',
            action: action,
            timeout: 120,
            originalCommand: customCommand,
            aiOptimized: true
        };
    }

    /**
     * Advanced AI-Powered Natural Language Command Processor
     * Can understand and execute ANY command like a true AI CLI
     */
    async generateNaturalLanguageCommand(action, params) {
        const { userInput } = params;
        
        if (!userInput) {
            throw new Error('User input is required for natural language commands');
        }
        
        const input = userInput.toLowerCase().trim();
        
        // First, try advanced AI pattern matching
        const aiCommand = await this.generateAdvancedAICommand(userInput, input);
        if (aiCommand) {
            return aiCommand;
        }
        
        // Fallback to intelligent command execution
        return this.generateIntelligentFallback(userInput, input);
    }

    /**
     * Advanced AI Command Generation - Handles ANY command intelligently
     */
    async generateAdvancedAICommand(userInput, input) {
        // Dynamic pattern matching with intelligent command generation
        const patterns = [
            // File Operations
            {
                pattern: /(create|make|new)\s+(folder|directory|dir)\s+(.+)/i,
                generate: (match) => {
                    const folderName = match[3].trim();
                    return {
                        command: `Write-Host "Creating folder: ${folderName}"; New-Item -ItemType Directory -Path "${folderName}" -Force; Write-Host "Folder created successfully"`,
                        type: 'powershell',
                        category: 'file_ops',
                        action: 'create_folder',
                        timeout: 10
                    };
                }
            },
            {
                pattern: /(delete|remove|rm)\s+(.+)/i,
                generate: (match) => {
                    const target = match[2].trim();
                    return {
                        command: `Write-Host "Deleting: ${target}"; if (Test-Path "${target}") { Remove-Item "${target}" -Recurse -Force; Write-Host "Deleted successfully" } else { Write-Host "Path not found: ${target}" }`,
                        type: 'powershell',
                        category: 'file_ops',
                        action: 'delete',
                        timeout: 10
                    };
                }
            },
            {
                pattern: /(copy|cp)\s+(.+)\s+(to|into)\s+(.+)/i,
                generate: (match) => {
                    const source = match[2].trim();
                    const destination = match[4].trim();
                    return {
                        command: `Write-Host "Copying ${source} to ${destination}"; Copy-Item "${source}" "${destination}" -Recurse -Force; Write-Host "Copy completed"`,
                        type: 'powershell',
                        category: 'file_ops',
                        action: 'copy',
                        timeout: 30
                    };
                }
            },
            {
                pattern: /(move|mv)\s+(.+)\s+(to|into)\s+(.+)/i,
                generate: (match) => {
                    const source = match[2].trim();
                    const destination = match[4].trim();
                    return {
                        command: `Write-Host "Moving ${source} to ${destination}"; Move-Item "${source}" "${destination}" -Force; Write-Host "Move completed"`,
                        type: 'powershell',
                        category: 'file_ops',
                        action: 'move',
                        timeout: 30
                    };
                }
            },
            {
                pattern: /(list|show|ls)\s+(files|files in|contents of)\s+(.+)/i,
                generate: (match) => {
                    const path = match[3].trim();
                    return {
                        command: `Write-Host "Listing contents of: ${path}"; Get-ChildItem "${path}" | Format-Table Name, Length, LastWriteTime -AutoSize`,
                        type: 'powershell',
                        category: 'file_ops',
                        action: 'list',
                        timeout: 15
                    };
                }
            },

            // Application Operations
            {
                pattern: /(open|launch|start|run)\s+(calculator|calc)/i,
                generate: () => ({
                    command: `Write-Host "Opening Calculator"; Start-Process calc.exe; Write-Host "Calculator opened"`,
                    type: 'powershell',
                    category: 'application',
                    action: 'launch',
                    timeout: 5
                })
            },
            {
                pattern: /(open|launch|start|run)\s+(notepad|text editor)/i,
                generate: () => ({
                    command: `Write-Host "Opening Notepad"; Start-Process notepad.exe; Write-Host "Notepad opened"`,
                    type: 'powershell',
                    category: 'application',
                    action: 'launch',
                    timeout: 5
                })
            },
            {
                pattern: /(open|launch|start|run)\s+(task manager|taskmgr)/i,
                generate: () => ({
                    command: `Write-Host "Opening Task Manager"; Start-Process taskmgr.exe; Write-Host "Task Manager opened"`,
                    type: 'powershell',
                    category: 'application',
                    action: 'launch',
                    timeout: 5
                })
            },
            {
                pattern: /(open|launch|start|run)\s+(control panel|control)/i,
                generate: () => ({
                    command: `Write-Host "Opening Control Panel"; Start-Process control.exe; Write-Host "Control Panel opened"`,
                    type: 'powershell',
                    category: 'application',
                    action: 'launch',
                    timeout: 5
                })
            },
            {
                pattern: /(open|launch|start|run)\s+(cmd|command prompt|terminal)/i,
                generate: () => ({
                    command: `Write-Host "Opening Command Prompt"; Start-Process cmd.exe; Write-Host "Command Prompt opened"`,
                    type: 'powershell',
                    category: 'application',
                    action: 'launch',
                    timeout: 5
                })
            },
            {
                pattern: /(open|launch|start|run)\s+(powershell|ps)/i,
                generate: () => ({
                    command: `Write-Host "Opening PowerShell"; Start-Process powershell.exe; Write-Host "PowerShell opened"`,
                    type: 'powershell',
                    category: 'application',
                    action: 'launch',
                    timeout: 5
                })
            },

            // System Operations
            {
                pattern: /(restart|reboot)\s+(computer|system|pc)/i,
                generate: () => ({
                    command: `Write-Host "Restarting computer in 10 seconds..."; Start-Sleep 10; Restart-Computer -Force`,
                    type: 'powershell',
                    category: 'system',
                    action: 'restart',
                    timeout: 60
                })
            },
            {
                pattern: /(shutdown|shut down)\s+(computer|system|pc)/i,
                generate: () => ({
                    command: `Write-Host "Shutting down computer in 10 seconds..."; Start-Sleep 10; Stop-Computer -Force`,
                    type: 'powershell',
                    category: 'system',
                    action: 'shutdown',
                    timeout: 60
                })
            },
            {
                pattern: /(lock|lock screen)/i,
                generate: () => ({
                    command: `Write-Host "Locking screen"; rundll32.exe user32.dll,LockWorkStation; Write-Host "Screen locked"`,
                    type: 'cmd',
                    category: 'system',
                    action: 'lock',
                    timeout: 5
                })
            },
            {
                pattern: /(sleep|suspend)\s+(computer|system|pc)/i,
                generate: () => ({
                    command: `Write-Host "Putting computer to sleep"; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState("Suspend", $false, $false)`,
                    type: 'powershell',
                    category: 'system',
                    action: 'sleep',
                    timeout: 10
                })
            },

            // Network Operations
            {
                pattern: /(download|get)\s+(.+)\s+(from|at)\s+(.+)/i,
                generate: (match) => {
                    const filename = match[2].trim();
                    const url = match[4].trim();
                    return {
                        command: `Write-Host "Downloading ${filename} from ${url}"; ` +
                                `if (!(Test-Path "C:\\temp")) { New-Item -ItemType Directory -Path "C:\\temp" -Force }; ` +
                                `Invoke-WebRequest -Uri "${url}" -OutFile "C:\\temp\\${filename}"; ` +
                                `if (Test-Path "C:\\temp\\${filename}") { Write-Host "Download successful: C:\\temp\\${filename}" } else { Write-Host "Download failed" }`,
                        type: 'powershell',
                        category: 'download',
                        action: 'download_file',
                        timeout: 300
                    };
                }
            },
            {
                pattern: /(ping|test connection)\s+(.+)/i,
                generate: (match) => {
                    const target = match[2].trim();
                    return {
                        command: `Write-Host "Pinging ${target}"; Test-NetConnection -ComputerName "${target}" -Port 80 -InformationLevel Detailed`,
                        type: 'powershell',
                        category: 'network',
                        action: 'ping',
                        timeout: 30
                    };
                }
            },
            {
                pattern: /(check|show|display)\s+(ip|ip address)/i,
                generate: () => ({
                    command: `Write-Host "Current IP Address:"; Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"} | Select-Object IPAddress, InterfaceAlias | Format-Table -AutoSize`,
                    type: 'powershell',
                    category: 'network',
                    action: 'ip_info',
                    timeout: 15
                })
            },

            // Process Management
            {
                pattern: /(kill|stop|end)\s+(process|task)\s+(.+)/i,
                generate: (match) => {
                    const processName = match[3].trim();
                    return {
                        command: `Write-Host "Stopping process: ${processName}"; Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Host "Process stopped"`,
                        type: 'powershell',
                        category: 'process',
                        action: 'kill_process',
                        timeout: 10
                    };
                }
            },
            {
                pattern: /(find|search)\s+(process|processes)\s+(.+)/i,
                generate: (match) => {
                    const searchTerm = match[3].trim();
                    return {
                        command: `Write-Host "Searching for processes containing: ${searchTerm}"; Get-Process | Where-Object {$_.ProcessName -like "*${searchTerm}*"} | Select-Object ProcessName, Id, CPU, WorkingSet | Format-Table -AutoSize`,
                        type: 'powershell',
                        category: 'process',
                        action: 'search_process',
                        timeout: 15
                    };
                }
            },

            // Registry Operations
            {
                pattern: /(check|view|show|read)\s+(registry|reg)\s+(.+)/i,
                generate: (match) => {
                    const regPath = match[3].trim();
                    return {
                        command: `Write-Host "Reading registry: ${regPath}"; Get-ItemProperty -Path "${regPath}" -ErrorAction SilentlyContinue | Format-List`,
                        type: 'powershell',
                        category: 'registry',
                        action: 'read_registry',
                        timeout: 30
                    };
                }
            },
            {
                pattern: /(set|write|modify)\s+(registry|reg)\s+(.+)\s+(to|value)\s+(.+)/i,
                generate: (match) => {
                    const regPath = match[3].trim();
                    const value = match[5].trim();
                    return {
                        command: `Write-Host "Setting registry value: ${regPath} = ${value}"; Set-ItemProperty -Path "${regPath}" -Value "${value}"; Write-Host "Registry value set"`,
                        type: 'powershell',
                        category: 'registry',
                        action: 'write_registry',
                        timeout: 15
                    };
                }
            },

            // Service Operations
            {
                pattern: /(start|start service)\s+(.+)/i,
                generate: (match) => {
                    const serviceName = match[2].trim();
                    return {
                        command: `Write-Host "Starting service: ${serviceName}"; Start-Service "${serviceName}"; Write-Host "Service started"`,
                        type: 'powershell',
                        category: 'service',
                        action: 'start_service',
                        timeout: 30
                    };
                }
            },
            {
                pattern: /(stop|stop service)\s+(.+)/i,
                generate: (match) => {
                    const serviceName = match[2].trim();
                    return {
                        command: `Write-Host "Stopping service: ${serviceName}"; Stop-Service "${serviceName}"; Write-Host "Service stopped"`,
                        type: 'powershell',
                        category: 'service',
                        action: 'stop_service',
                        timeout: 30
                    };
                }
            },

            // Environment Variables
            {
                pattern: /(show|display|list)\s+(environment|env)\s+(variables|vars)/i,
                generate: () => ({
                    command: `Write-Host "Environment Variables:"; Get-ChildItem Env: | Sort-Object Name | Format-Table Name, Value -AutoSize`,
                    type: 'powershell',
                    category: 'system',
                    action: 'env_vars',
                    timeout: 15
                })
            },
            {
                pattern: /(set|create)\s+(environment|env)\s+(variable|var)\s+(.+)\s+(to|value)\s+(.+)/i,
                generate: (match) => {
                    const varName = match[4].trim();
                    const varValue = match[6].trim();
                    return {
                        command: `Write-Host "Setting environment variable: ${varName} = ${varValue}"; [Environment]::SetEnvironmentVariable("${varName}", "${varValue}", "User"); Write-Host "Environment variable set"`,
                        type: 'powershell',
                        category: 'system',
                        action: 'set_env_var',
                        timeout: 10
                    };
                }
            },

            // Advanced System Information
            {
                pattern: /(show|display|get)\s+(system|computer|pc)\s+(info|information)/i,
                generate: () => ({
                    command: `Write-Host "=== SYSTEM INFORMATION ==="; ` +
                            `Write-Host "Computer Name: $env:COMPUTERNAME"; ` +
                            `Write-Host "User Name: $env:USERNAME"; ` +
                            `Write-Host "OS Version:"; ` +
                            `Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory; ` +
                            `Write-Host "Processor Count: $env:NUMBER_OF_PROCESSORS"; ` +
                            `Write-Host "CPU Info:"; ` +
                            `Get-WmiObject -Class Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors | Format-Table -AutoSize`,
                    type: 'powershell',
                    category: 'system_info',
                    action: 'computer',
                    timeout: 30
                })
            },
            {
                pattern: /(show|display|list)\s+(running|active)\s+(processes|process)/i,
                generate: () => ({
                    command: `Write-Host "=== RUNNING PROCESSES ==="; ` +
                            `Get-Process | Sort-Object CPU -Descending | Select-Object -First 15 ProcessName, Id, CPU, WorkingSet | Format-Table -AutoSize; ` +
                            `Write-Host "Total Processes: $(Get-Process).Count"`,
                    type: 'powershell',
                    category: 'system_mgmt',
                    action: 'list_processes',
                    timeout: 30
                })
            },
            {
                pattern: /(show|display|get)\s+(cpu|cpu info|cpu information)/i,
                generate: () => ({
                    command: `Write-Host "=== CPU INFORMATION ==="; ` +
                            `Get-WmiObject -Class Win32_Processor | Select-Object Name, Manufacturer, MaxClockSpeed, NumberOfCores, NumberOfLogicalProcessors | Format-Table -AutoSize`,
                    type: 'powershell',
                    category: 'system_info',
                    action: 'cpu',
                    timeout: 30
                })
            },
            {
                pattern: /(show|display|get)\s+(memory|memory info|memory information)/i,
                generate: () => ({
                    command: `Write-Host "=== MEMORY INFORMATION ==="; ` +
                            `Get-WmiObject -Class Win32_PhysicalMemory | Select-Object Capacity, Speed, Manufacturer, DeviceLocator | Format-Table -AutoSize; ` +
                            `Write-Host "Total Physical Memory:"; ` +
                            `Get-WmiObject -Class Win32_ComputerSystem | Select-Object TotalPhysicalMemory | ForEach-Object { [math]::Round($_.TotalPhysicalMemory / 1GB, 2) + " GB" }`,
                    type: 'powershell',
                    category: 'system_info',
                    action: 'memory',
                    timeout: 30
                })
            },

            // Download and Install Commands (Enhanced)
            {
                pattern: /(download|get|install)\s+(putty|ssh client)/i,
                generate: () => ({
                    command: `Write-Host "=== DOWNLOADING PUTTY ==="; ` +
                            `if (!(Test-Path "C:\\temp")) { New-Item -ItemType Directory -Path "C:\\temp" -Force }; ` +
                            `Invoke-WebRequest -Uri "https://the.earth.li/~sgtatham/putty/latest/w64/putty.exe" -OutFile "C:\\temp\\putty.exe"; ` +
                            `if (Test-Path "C:\\temp\\putty.exe") { Write-Host "SUCCESS: Downloaded PuTTY"; Start-Process "C:\\temp\\putty.exe" } else { Write-Host "ERROR: Download failed" }`,
                    type: 'powershell',
                    category: 'download_exec',
                    action: 'download_and_execute',
                    timeout: 300
                })
            },
            {
                pattern: /(download|get|install)\s+(notepad|notepad\+\+)/i,
                generate: () => ({
                    command: `Write-Host "=== DOWNLOADING NOTEPAD++ ==="; ` +
                            `if (!(Test-Path "C:\\temp")) { New-Item -ItemType Directory -Path "C:\\temp" -Force }; ` +
                            `Invoke-WebRequest -Uri "https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.6.6/npp.8.6.6.Installer.x64.exe" -OutFile "C:\\temp\\notepad_installer.exe"; ` +
                            `if (Test-Path "C:\\temp\\notepad_installer.exe") { Write-Host "SUCCESS: Downloaded Notepad++"; Start-Process "C:\\temp\\notepad_installer.exe" } else { Write-Host "ERROR: Download failed" }`,
                    type: 'powershell',
                    category: 'download_exec',
                    action: 'download_and_execute',
                    timeout: 300
                })
            },
            {
                pattern: /(download|get|install)\s+(chrome|google chrome)/i,
                generate: () => ({
                    command: `Write-Host "=== DOWNLOADING CHROME ==="; ` +
                            `if (!(Test-Path "C:\\temp")) { New-Item -ItemType Directory -Path "C:\\temp" -Force }; ` +
                            `Invoke-WebRequest -Uri "https://dl.google.com/chrome/install/375.126/chrome_installer.exe" -OutFile "C:\\temp\\chrome_installer.exe"; ` +
                            `if (Test-Path "C:\\temp\\chrome_installer.exe") { Write-Host "SUCCESS: Downloaded Chrome"; Start-Process "C:\\temp\\chrome_installer.exe" } else { Write-Host "ERROR: Download failed" }`,
                    type: 'powershell',
                    category: 'download_exec',
                    action: 'download_and_execute',
                    timeout: 300
                })
            }
        ];

        // Try to match patterns
        for (const pattern of patterns) {
            const match = userInput.match(pattern.pattern);
            if (match) {
                console.log(`[AI PROCESSOR] Matched pattern: ${pattern.pattern}`);
                return pattern.generate(match);
            }
        }

        return null; // No pattern matched
    }

    /**
     * Intelligent Fallback - For unrecognized commands, try to execute them intelligently
     */
    generateIntelligentFallback(userInput, input) {
        // Check if it looks like a PowerShell command
        if (this.looksLikePowerShellCommand(userInput)) {
            return {
                command: `Write-Host "=== EXECUTING POWERSHELL COMMAND ==="; ` +
                        `Write-Host "Command: ${userInput}"; ` +
                        `try { ${userInput} } catch { Write-Host "Error: $($_.Exception.Message)" }`,
                type: 'powershell',
                category: 'custom_command',
                action: 'execute',
                timeout: 60
            };
        }

        // Check if it looks like a CMD command
        if (this.looksLikeCmdCommand(userInput)) {
            return {
                command: `@echo off && echo === EXECUTING CMD COMMAND === && echo Command: ${userInput} && ${userInput} && echo === COMMAND COMPLETED ===`,
                type: 'cmd',
                category: 'custom_command',
                action: 'execute',
                timeout: 60
            };
        }

        // Check if it's a simple application name
        if (this.looksLikeApplicationName(userInput)) {
            return {
                command: `Write-Host "Attempting to launch: ${userInput}"; ` +
                        `try { Start-Process "${userInput}" } catch { Write-Host "Could not launch ${userInput}: $($_.Exception.Message)" }`,
                type: 'powershell',
                category: 'application',
                action: 'launch',
                timeout: 10
            };
        }

        // Default intelligent fallback with suggestions
        return {
            command: `Write-Host "=== AI CLI - INTELLIGENT FALLBACK ==="; ` +
                    `Write-Host "Command: ${userInput}"; ` +
                    `Write-Host "Analysis: Command not recognized, but I'll try to help!"; ` +
                    `Write-Host ""; ` +
                    `Write-Host "Available AI Commands:"; ` +
                    `Write-Host "• File Operations: 'create folder MyFolder', 'delete file.txt', 'copy source dest'"; ` +
                    `Write-Host "• Applications: 'open calculator', 'run notepad', 'start task manager'"; ` +
                    `Write-Host "• System: 'show system info', 'restart computer', 'lock screen'"; ` +
                    `Write-Host "• Network: 'ping google.com', 'download chrome', 'check ip address'"; ` +
                    `Write-Host "• Processes: 'list processes', 'kill process chrome', 'find process notepad'"; ` +
                    `Write-Host "• Registry: 'check registry HKLM\\Software', 'set registry value'"; ` +
                    `Write-Host "• Services: 'start service spooler', 'stop service wuauserv'"; ` +
                    `Write-Host "• Environment: 'show environment variables', 'set env var MYVAR value'"; ` +
                    `Write-Host ""; ` +
                    `Write-Host "Or try direct PowerShell/CMD commands!"`,
            type: 'powershell',
            category: 'natural_language',
            action: 'fallback',
            timeout: 30
        };
    }

    /**
     * Helper methods for intelligent command detection
     */
    looksLikePowerShellCommand(input) {
        const psKeywords = ['get-', 'set-', 'new-', 'remove-', 'start-', 'stop-', 'invoke-', 'write-host', 'foreach', 'where-object', 'select-object', 'format-table'];
        return psKeywords.some(keyword => input.toLowerCase().includes(keyword));
    }

    looksLikeCmdCommand(input) {
        const cmdKeywords = ['dir', 'cd', 'copy', 'del', 'ren', 'md', 'rd', 'type', 'echo', 'pause', 'cls', 'ipconfig', 'ping', 'netstat'];
        return cmdKeywords.some(keyword => input.toLowerCase().includes(keyword));
    }

    looksLikeApplicationName(input) {
        // Simple heuristic: if it's a single word or short phrase, might be an app
        const words = input.trim().split(' ');
        return words.length <= 2 && /^[a-zA-Z0-9\-\+]+$/.test(input.trim());
    }
}

module.exports = AICommandProcessor;
