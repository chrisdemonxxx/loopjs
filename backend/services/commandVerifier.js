/**
 * Command Verifier
 * Verifies commands before execution to prevent common failures
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

class CommandVerifier {
    constructor() {
        this.verificationCache = new Map();
    }

    /**
     * Verify command before execution
     * @param {string} command - Command to verify
     * @param {object} context - Context information
     * @returns {object} Verification result
     */
    async verifyCommand(command, context = {}) {
        try {
            console.log('[COMMAND VERIFIER] Verifying command...');
            
            const results = {
                valid: true,
                command: command,
                checks: {},
                warnings: [],
                errors: [],
                suggestions: []
            };
            
            // Check 1: Syntax validation
            results.checks.syntax = this.validateSyntax(command);
            if (!results.checks.syntax.valid) {
                results.valid = false;
                results.errors.push(results.checks.syntax.error);
            }
            
            // Check 2: Referenced files exist
            results.checks.fileReferences = await this.checkFileReferences(command);
            if (results.checks.fileReferences.missingFiles.length > 0) {
                results.warnings.push(`Referenced files not found: ${results.checks.fileReferences.missingFiles.join(', ')}`);
                
                // If it's an executable that doesn't exist, this is likely an error
                if (results.checks.fileReferences.missingExecutables.length > 0) {
                    results.valid = false;
                    results.errors.push(`Executables not found: ${results.checks.fileReferences.missingExecutables.join(', ')}`);
                    results.suggestions.push('Download or install the required software first');
                }
            }
            
            // Check 3: Required tools available
            results.checks.toolAvailability = await this.checkToolAvailability(command);
            if (results.checks.toolAvailability.missingTools.length > 0) {
                results.warnings.push(`Tools not available: ${results.checks.toolAvailability.missingTools.join(', ')}`);
            }
            
            // Check 4: Dangerous operations
            results.checks.safety = this.checkSafety(command);
            if (results.checks.safety.dangerous) {
                results.warnings.push(`Potentially dangerous operation: ${results.checks.safety.reason}`);
            }
            
            // Check 5: Context-specific validation
            if (context.intent === 'download' || context.intent === 'install') {
                results.checks.downloadContext = this.validateDownloadContext(command, context);
                if (!results.checks.downloadContext.valid) {
                    results.valid = false;
                    results.errors.push(results.checks.downloadContext.error);
                    results.suggestions.push(results.checks.downloadContext.suggestion);
                }
            }
            
            console.log(`[COMMAND VERIFIER] Verification result: ${results.valid ? 'VALID' : 'INVALID'}`);
            
            return results;
            
        } catch (error) {
            console.error('[COMMAND VERIFIER] Verification failed:', error.message);
            return {
                valid: false,
                command: command,
                error: error.message,
                checks: {},
                warnings: [],
                errors: [error.message],
                suggestions: []
            };
        }
    }

    /**
     * Validate command syntax
     */
    validateSyntax(command) {
        // Basic syntax checks
        const issues = [];
        
        // Check for unmatched quotes
        const singleQuotes = (command.match(/'/g) || []).length;
        const doubleQuotes = (command.match(/"/g) || []).length;
        
        if (singleQuotes % 2 !== 0) {
            issues.push('Unmatched single quotes');
        }
        if (doubleQuotes % 2 !== 0) {
            issues.push('Unmatched double quotes');
        }
        
        // Check for unmatched parentheses
        const openParens = (command.match(/\(/g) || []).length;
        const closeParens = (command.match(/\)/g) || []).length;
        
        if (openParens !== closeParens) {
            issues.push('Unmatched parentheses');
        }
        
        // Check for empty command
        if (!command || command.trim().length === 0) {
            issues.push('Empty command');
        }
        
        return {
            valid: issues.length === 0,
            error: issues.length > 0 ? issues.join('; ') : null,
            issues: issues
        };
    }

    /**
     * Check if referenced files exist
     */
    async checkFileReferences(command) {
        const missingFiles = [];
        const missingExecutables = [];
        const existingFiles = [];
        
        // Extract potential file paths and executables
        const filePatterns = [
            // Executables at start of command
            /^([a-zA-Z]:\\[^\s]+\.exe)/gi,
            /^([a-zA-Z]:\\[^\s]+\.msi)/gi,
            // Paths in quotes
            /"([a-zA-Z]:[^"]+)"/g,
            /'([a-zA-Z]:[^']+)'/g,
            // Common executable patterns
            /\b([a-zA-Z]+\.exe)\b/gi,
            /\b([a-zA-Z]+\.msi)\b/gi,
            // Start command pattern
            /start\s+([^\s]+\.exe)/gi,
            /cmd\s+\/c\s+start\s+([^\s]+\.exe)/gi
        ];
        
        const checkedPaths = new Set();
        
        for (const pattern of filePatterns) {
            const matches = command.matchAll(pattern);
            for (const match of matches) {
                const filePath = match[1];
                if (!filePath || checkedPaths.has(filePath)) continue;
                
                checkedPaths.add(filePath);
                
                try {
                    // Check if it's an absolute path
                    if (path.isAbsolute(filePath)) {
                        if (fs.existsSync(filePath)) {
                            existingFiles.push(filePath);
                        } else {
                            missingFiles.push(filePath);
                            if (filePath.match(/\.(exe|msi)$/i)) {
                                missingExecutables.push(filePath);
                            }
                        }
                    } else {
                        // For relative paths or just executable names, check if they're in PATH
                        const inPath = await this.checkIfInPath(filePath);
                        if (!inPath) {
                            if (filePath.match(/\.(exe|msi)$/i)) {
                                missingExecutables.push(filePath);
                            } else {
                                missingFiles.push(filePath);
                            }
                        } else {
                            existingFiles.push(filePath);
                        }
                    }
                } catch (error) {
                    // Ignore check errors
                }
            }
        }
        
        return {
            missingFiles: missingFiles,
            missingExecutables: missingExecutables,
            existingFiles: existingFiles
        };
    }

    /**
     * Check if executable is in PATH
     */
    async checkIfInPath(executable) {
        try {
            // Use 'where' command on Windows
            await execAsync(`where ${executable}`, { timeout: 2000 });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check tool availability
     */
    async checkToolAvailability(command) {
        const tools = [
            { name: 'curl', pattern: /\bcurl\b/i },
            { name: 'wget', pattern: /\bwget\b/i },
            { name: 'powershell', pattern: /\bpowershell\b/i },
            { name: 'winget', pattern: /\bwinget\b/i },
            { name: 'choco', pattern: /\bchoco\b/i },
            { name: 'git', pattern: /\bgit\b/i },
            { name: 'python', pattern: /\bpython\b/i },
            { name: 'node', pattern: /\bnode\b/i },
            { name: 'npm', pattern: /\bnpm\b/i }
        ];
        
        const requiredTools = [];
        const availableTools = [];
        const missingTools = [];
        
        for (const tool of tools) {
            if (tool.pattern.test(command)) {
                requiredTools.push(tool.name);
                
                // Check if tool is available (use cache)
                const cacheKey = `tool_${tool.name}`;
                let available = this.verificationCache.get(cacheKey);
                
                if (available === undefined) {
                    available = await this.checkIfInPath(tool.name);
                    this.verificationCache.set(cacheKey, available);
                }
                
                if (available) {
                    availableTools.push(tool.name);
                } else {
                    missingTools.push(tool.name);
                }
            }
        }
        
        return {
            requiredTools: requiredTools,
            availableTools: availableTools,
            missingTools: missingTools
        };
    }

    /**
     * Check command safety
     */
    checkSafety(command) {
        const dangerousPatterns = [
            { pattern: /rm\s+-rf\s+\//i, reason: 'Recursive deletion of root directory' },
            { pattern: /del\s+\/[sS]\s+[cC]:\\/i, reason: 'Recursive deletion of C drive' },
            { pattern: /format\s+[cC]:/i, reason: 'Format system drive' },
            { pattern: /shutdown\s+\/[sS]/i, reason: 'System shutdown' },
            { pattern: /reg\s+delete/i, reason: 'Registry deletion' },
            { pattern: /bcdedit/i, reason: 'Boot configuration modification' }
        ];
        
        for (const { pattern, reason } of dangerousPatterns) {
            if (pattern.test(command)) {
                return {
                    dangerous: true,
                    reason: reason
                };
            }
        }
        
        return {
            dangerous: false
        };
    }

    /**
     * Validate download/install context
     */
    validateDownloadContext(command, context) {
        // For download/install commands, verify they actually download something
        const hasDownloadAction = 
            /Invoke-WebRequest/i.test(command) ||
            /curl/i.test(command) ||
            /wget/i.test(command) ||
            /winget\s+install/i.test(command) ||
            /choco\s+install/i.test(command);
        
        if (!hasDownloadAction) {
            // Check if command tries to execute something that doesn't exist
            const hasStartCommand = /start\s+[^\s]+\.exe/i.test(command) || /cmd\s+\/c\s+start/i.test(command);
            
            if (hasStartCommand) {
                return {
                    valid: false,
                    error: 'Command attempts to execute file without downloading it first',
                    suggestion: 'Add download step before execution'
                };
            }
        }
        
        return {
            valid: true
        };
    }

    /**
     * Clear verification cache
     */
    clearCache() {
        this.verificationCache.clear();
    }
}

module.exports = CommandVerifier;
