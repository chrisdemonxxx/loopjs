/**
 * Ollama Command Validator
 * Validates generated commands for safety, syntax, and permissions
 */
class OllamaCommandValidator {
    constructor() {
        this.dangerousOperations = this.loadDangerousOperations();
        this.safetyRules = this.loadSafetyRules();
        this.validationHistory = new Map();
        this.whitelist = new Set();
        this.blacklist = new Set();
    }

    /**
     * Validate generated command before execution
     */
    async validateCommand(command, context = {}) {
        try {
            console.log('[VALIDATOR] Validating command:', command.substring(0, 100) + '...');
            
            const validationId = `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Perform all validation checks
            const destructiveCheck = this.checkDestructive(command, context);
            const syntaxCheck = this.validatePowerShellSyntax(command);
            const permissionCheck = this.checkRequiredPermissions(command, context);
            const impactCheck = this.estimateImpact(command, context);
            const safetyCheck = this.checkSafetyRules(command, context);
            
            // Combine all results
            const validationResult = {
                id: validationId,
                command: command,
                context: context,
                timestamp: new Date().toISOString(),
                destructive: destructiveCheck,
                syntax: syntaxCheck,
                permissions: permissionCheck,
                impact: impactCheck,
                safety: safetyCheck,
                overall: this.calculateOverallSafety(destructiveCheck, syntaxCheck, permissionCheck, impactCheck, safetyCheck)
            };
            
            // Store validation result
            this.validationHistory.set(validationId, validationResult);
            
            return {
                success: true,
                validation: validationResult
            };

        } catch (error) {
            console.error('[VALIDATOR] Error validating command:', error);
            return {
                success: false,
                error: error.message,
                validation: this.getDefaultValidationResult(command, context)
            };
        }
    }

    /**
     * Check for dangerous operations
     */
    checkDestructive(command, context) {
        const destructive = {
            detected: false,
            operations: [],
            warnings: [],
            requiresConfirmation: false,
            riskLevel: 'low'
        };

        const commandLower = command.toLowerCase();
        
        // Check for dangerous operations
        for (const [category, operations] of Object.entries(this.dangerousOperations)) {
            for (const operation of operations) {
                if (commandLower.includes(operation.pattern)) {
                    destructive.detected = true;
                    destructive.operations.push({
                        category: category,
                        operation: operation.name,
                        pattern: operation.pattern,
                        risk: operation.risk,
                        description: operation.description
                    });
                    
                    if (operation.risk === 'high') {
                        destructive.requiresConfirmation = true;
                        destructive.riskLevel = 'high';
                    } else if (operation.risk === 'medium' && destructive.riskLevel !== 'high') {
                        destructive.riskLevel = 'medium';
                    }
                    
                    destructive.warnings.push(operation.warning);
                }
            }
        }

        return destructive;
    }

    /**
     * Validate PowerShell syntax
     */
    validatePowerShellSyntax(command) {
        const syntax = {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };

        try {
            // Basic syntax checks
            const lines = command.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#') || line === '') continue;
                
                // Check for common syntax issues
                if (line.includes('&&') || line.includes('||')) {
                    syntax.warnings.push(`Line ${i + 1}: Use PowerShell operators (-and, -or) instead of && or ||`);
                }
                
                if (line.includes('$(') && !line.includes(')')) {
                    syntax.errors.push(`Line ${i + 1}: Unclosed subexpression $()`);
                    syntax.valid = false;
                }
                
                if (line.includes('"') && (line.split('"').length - 1) % 2 !== 0) {
                    syntax.errors.push(`Line ${i + 1}: Unclosed string literal`);
                    syntax.valid = false;
                }
                
                if (line.includes("'") && (line.split("'").length - 1) % 2 !== 0) {
                    syntax.errors.push(`Line ${i + 1}: Unclosed string literal`);
                    syntax.valid = false;
                }
                
                // Check for proper variable syntax
                if (line.includes('$') && !line.match(/\$[a-zA-Z_][a-zA-Z0-9_]*/)) {
                    syntax.warnings.push(`Line ${i + 1}: Check variable syntax`);
                }
            }
            
            // Check for proper PowerShell cmdlet usage
            const cmdletPattern = /\b[A-Z][a-zA-Z]*-[A-Z][a-zA-Z]*\b/g;
            const cmdlets = command.match(cmdletPattern);
            
            if (cmdlets) {
                for (const cmdlet of cmdlets) {
                    if (!this.isValidCmdlet(cmdlet)) {
                        syntax.warnings.push(`Unknown or potentially invalid cmdlet: ${cmdlet}`);
                    }
                }
            }
            
        } catch (error) {
            syntax.valid = false;
            syntax.errors.push(`Syntax validation error: ${error.message}`);
        }

        return syntax;
    }

    /**
     * Check required permissions
     */
    checkRequiredPermissions(command, context) {
        const permissions = {
            required: [],
            elevated: false,
            network: false,
            fileSystem: false,
            registry: false,
            services: false,
            processes: false
        };

        const commandLower = command.toLowerCase();
        
        // Check for elevated permissions
        const elevatedOperations = [
            'install', 'uninstall', 'service', 'registry', 'system', 'admin',
            'set-executionpolicy', 'new-item', 'remove-item', 'set-itemproperty'
        ];
        
        for (const operation of elevatedOperations) {
            if (commandLower.includes(operation)) {
                permissions.elevated = true;
                permissions.required.push('Administrator');
                break;
            }
        }
        
        // Check for network permissions
        if (commandLower.includes('invoke-webrequest') || 
            commandLower.includes('invoke-restmethod') ||
            commandLower.includes('test-netconnection') ||
            commandLower.includes('ping')) {
            permissions.network = true;
            permissions.required.push('Network Access');
        }
        
        // Check for file system permissions
        if (commandLower.includes('copy-item') || 
            commandLower.includes('move-item') ||
            commandLower.includes('remove-item') ||
            commandLower.includes('new-item')) {
            permissions.fileSystem = true;
            permissions.required.push('File System Access');
        }
        
        // Check for registry permissions
        if (commandLower.includes('get-itemproperty') || 
            commandLower.includes('set-itemproperty') ||
            commandLower.includes('new-itemproperty') ||
            commandLower.includes('hkcu:') ||
            commandLower.includes('hklm:')) {
            permissions.registry = true;
            permissions.required.push('Registry Access');
        }
        
        // Check for service permissions
        if (commandLower.includes('get-service') || 
            commandLower.includes('set-service') ||
            commandLower.includes('start-service') ||
            commandLower.includes('stop-service')) {
            permissions.services = true;
            permissions.required.push('Service Management');
        }
        
        // Check for process permissions
        if (commandLower.includes('get-process') || 
            commandLower.includes('stop-process') ||
            commandLower.includes('start-process')) {
            permissions.processes = true;
            permissions.required.push('Process Management');
        }

        return permissions;
    }

    /**
     * Estimate impact of command
     */
    estimateImpact(command, context) {
        const impact = {
            scope: 'local',
            severity: 'low',
            affected: [],
            reversible: true,
            estimatedTime: 5,
            resources: {
                cpu: 'low',
                memory: 'low',
                disk: 'low',
                network: 'low'
            }
        };

        const commandLower = command.toLowerCase();
        
        // Determine scope
        if (commandLower.includes('\\server\\') || 
            commandLower.includes('\\\\') ||
            commandLower.includes('remote')) {
            impact.scope = 'network';
        }
        
        if (commandLower.includes('all') || 
            commandLower.includes('every') ||
            commandLower.includes('system-wide')) {
            impact.scope = 'system';
        }
        
        // Determine severity
        if (commandLower.includes('delete') || 
            commandLower.includes('remove') ||
            commandLower.includes('format')) {
            impact.severity = 'high';
            impact.reversible = false;
        } else if (commandLower.includes('modify') || 
                   commandLower.includes('change') ||
                   commandLower.includes('update')) {
            impact.severity = 'medium';
        }
        
        // Estimate affected components
        if (commandLower.includes('file') || commandLower.includes('folder')) {
            impact.affected.push('File System');
        }
        if (commandLower.includes('service')) {
            impact.affected.push('Services');
        }
        if (commandLower.includes('registry')) {
            impact.affected.push('Registry');
        }
        if (commandLower.includes('user') || commandLower.includes('account')) {
            impact.affected.push('User Accounts');
        }
        if (commandLower.includes('network') || commandLower.includes('port')) {
            impact.affected.push('Network');
        }
        
        // Estimate resource usage
        if (commandLower.includes('compress') || 
            commandLower.includes('backup') ||
            commandLower.includes('copy')) {
            impact.resources.disk = 'high';
            impact.estimatedTime = 30;
        }
        
        if (commandLower.includes('download') || 
            commandLower.includes('upload') ||
            commandLower.includes('invoke-webrequest')) {
            impact.resources.network = 'high';
            impact.estimatedTime = 15;
        }
        
        if (commandLower.includes('process') || 
            commandLower.includes('cpu') ||
            commandLower.includes('memory')) {
            impact.resources.cpu = 'medium';
            impact.resources.memory = 'medium';
        }

        return impact;
    }

    /**
     * Check safety rules
     */
    checkSafetyRules(command, context) {
        const safety = {
            passed: true,
            violations: [],
            warnings: [],
            recommendations: []
        };

        // Check whitelist/blacklist
        if (this.blacklist.has(command.trim())) {
            safety.passed = false;
            safety.violations.push('Command is in blacklist');
        }
        
        if (this.whitelist.size > 0 && !this.whitelist.has(command.trim())) {
            safety.warnings.push('Command not in whitelist');
        }
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /powershell.*-enc/i,
            /invoke-expression/i,
            /iex/i,
            /\.exe.*http/i,
            /downloadstring/i
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(command)) {
                safety.violations.push(`Suspicious pattern detected: ${pattern.source}`);
                safety.passed = false;
            }
        }
        
        // Check for proper error handling
        if (!command.includes('try') && !command.includes('catch') && 
            (command.includes('remove') || command.includes('delete'))) {
            safety.warnings.push('Consider adding error handling for destructive operations');
            safety.recommendations.push('Wrap destructive operations in try-catch blocks');
        }
        
        // Check for logging
        if (!command.includes('write-log') && !command.includes('write-host') && 
            command.length > 200) {
            safety.warnings.push('Consider adding logging for complex operations');
            safety.recommendations.push('Add logging statements for better traceability');
        }

        return safety;
    }

    /**
     * Calculate overall safety score
     */
    calculateOverallSafety(destructive, syntax, permissions, impact, safety) {
        let score = 100;
        
        // Deduct points for destructive operations
        if (destructive.detected) {
            score -= destructive.riskLevel === 'high' ? 40 : destructive.riskLevel === 'medium' ? 20 : 10;
        }
        
        // Deduct points for syntax errors
        if (!syntax.valid) {
            score -= 30;
        } else {
            score -= syntax.warnings.length * 2;
        }
        
        // Deduct points for elevated permissions
        if (permissions.elevated) {
            score -= 15;
        }
        
        // Deduct points for high impact
        if (impact.severity === 'high') {
            score -= 25;
        } else if (impact.severity === 'medium') {
            score -= 10;
        }
        
        // Deduct points for safety violations
        if (!safety.passed) {
            score -= 35;
        } else {
            score -= safety.warnings.length * 3;
        }
        
        return {
            score: Math.max(0, score),
            level: score >= 80 ? 'safe' : score >= 60 ? 'caution' : score >= 40 ? 'warning' : 'danger',
            requiresConfirmation: destructive.requiresConfirmation || !safety.passed || impact.severity === 'high',
            canExecute: score >= 40 && syntax.valid
        };
    }

    /**
     * Load dangerous operations patterns
     */
    loadDangerousOperations() {
        return {
            'file_system': [
                {
                    name: 'Format Disk',
                    pattern: 'format',
                    risk: 'high',
                    description: 'Formats a disk drive',
                    warning: 'This will permanently erase all data on the disk!'
                },
                {
                    name: 'Delete System Files',
                    pattern: 'del c:\\windows',
                    risk: 'high',
                    description: 'Deletes Windows system files',
                    warning: 'This could make the system unbootable!'
                },
                {
                    name: 'Remove Directory',
                    pattern: 'remove-item',
                    risk: 'medium',
                    description: 'Removes files or directories',
                    warning: 'This will permanently delete files!'
                }
            ],
            'system': [
                {
                    name: 'Shutdown System',
                    pattern: 'shutdown',
                    risk: 'high',
                    description: 'Shuts down the system',
                    warning: 'This will shut down the computer!'
                },
                {
                    name: 'Restart System',
                    pattern: 'restart',
                    risk: 'high',
                    description: 'Restarts the system',
                    warning: 'This will restart the computer!'
                },
                {
                    name: 'Stop Critical Service',
                    pattern: 'stop-service',
                    risk: 'medium',
                    description: 'Stops a Windows service',
                    warning: 'Stopping critical services may affect system stability!'
                }
            ],
            'network': [
                {
                    name: 'Disable Firewall',
                    pattern: 'disable-netfirewallrule',
                    risk: 'high',
                    description: 'Disables firewall rules',
                    warning: 'This reduces system security!'
                },
                {
                    name: 'Open Ports',
                    pattern: 'new-netfirewallrule',
                    risk: 'medium',
                    description: 'Creates new firewall rules',
                    warning: 'Opening ports may expose the system to attacks!'
                }
            ],
            'registry': [
                {
                    name: 'Modify Registry',
                    pattern: 'set-itemproperty',
                    risk: 'medium',
                    description: 'Modifies registry values',
                    warning: 'Incorrect registry changes can damage the system!'
                }
            ]
        };
    }

    /**
     * Load safety rules
     */
    loadSafetyRules() {
        return {
            requireConfirmation: [
                'format',
                'shutdown',
                'restart',
                'del c:\\windows',
                'disable-netfirewallrule'
            ],
            requireAdmin: [
                'install',
                'uninstall',
                'service',
                'registry',
                'set-executionpolicy'
            ],
            suspiciousPatterns: [
                'powershell.*-enc',
                'invoke-expression',
                'iex',
                '\\.exe.*http',
                'downloadstring'
            ]
        };
    }

    /**
     * Check if cmdlet is valid
     */
    isValidCmdlet(cmdlet) {
        // Common PowerShell cmdlets that are safe to assume exist
        const validCmdlets = [
            'Get-ChildItem', 'Set-Location', 'Copy-Item', 'Move-Item', 'Remove-Item',
            'New-Item', 'Get-Content', 'Set-Content', 'Add-Content', 'Clear-Content',
            'Get-Process', 'Stop-Process', 'Start-Process', 'Get-Service', 'Set-Service',
            'Start-Service', 'Stop-Service', 'Restart-Service', 'Get-EventLog',
            'Write-Host', 'Write-Output', 'Write-Warning', 'Write-Error', 'Write-Verbose',
            'Invoke-WebRequest', 'Invoke-RestMethod', 'Test-NetConnection', 'Ping',
            'Get-NetAdapter', 'Get-NetIPAddress', 'Set-NetIPAddress', 'Get-DnsClientServerAddress',
            'Get-ComputerInfo', 'Get-WmiObject', 'Get-CimInstance', 'Invoke-CimMethod',
            'Get-ItemProperty', 'Set-ItemProperty', 'New-ItemProperty', 'Remove-ItemProperty',
            'Get-Acl', 'Set-Acl', 'Get-User', 'New-LocalUser', 'Remove-LocalUser',
            'Add-LocalGroupMember', 'Remove-LocalGroupMember', 'Get-LocalGroup',
            'Test-Path', 'Resolve-Path', 'Split-Path', 'Join-Path', 'Convert-Path'
        ];
        
        return validCmdlets.includes(cmdlet);
    }

    /**
     * Get default validation result
     */
    getDefaultValidationResult(command, context) {
        return {
            id: 'default',
            command: command,
            context: context,
            timestamp: new Date().toISOString(),
            destructive: { detected: false, operations: [], warnings: [], requiresConfirmation: false, riskLevel: 'low' },
            syntax: { valid: true, errors: [], warnings: [], suggestions: [] },
            permissions: { required: [], elevated: false, network: false, fileSystem: false, registry: false, services: false, processes: false },
            impact: { scope: 'local', severity: 'low', affected: [], reversible: true, estimatedTime: 5, resources: { cpu: 'low', memory: 'low', disk: 'low', network: 'low' } },
            safety: { passed: true, violations: [], warnings: [], recommendations: [] },
            overall: { score: 50, level: 'caution', requiresConfirmation: false, canExecute: true }
        };
    }

    /**
     * Add command to whitelist
     */
    addToWhitelist(command) {
        this.whitelist.add(command.trim());
    }

    /**
     * Add command to blacklist
     */
    addToBlacklist(command) {
        this.blacklist.add(command.trim());
    }

    /**
     * Get validator statistics
     */
    getStatistics() {
        const validations = Array.from(this.validationHistory.values());
        const safeCount = validations.filter(v => v.overall.level === 'safe').length;
        const cautionCount = validations.filter(v => v.overall.level === 'caution').length;
        const warningCount = validations.filter(v => v.overall.level === 'warning').length;
        const dangerCount = validations.filter(v => v.overall.level === 'danger').length;
        
        return {
            totalValidations: this.validationHistory.size,
            safetyDistribution: {
                safe: safeCount,
                caution: cautionCount,
                warning: warningCount,
                danger: dangerCount
            },
            averageScore: validations.length > 0 ? 
                validations.reduce((sum, v) => sum + v.overall.score, 0) / validations.length : 0,
            whitelistSize: this.whitelist.size,
            blacklistSize: this.blacklist.size,
            dangerousOperationsCount: Object.values(this.dangerousOperations).flat().length,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = OllamaCommandValidator;
