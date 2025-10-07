/**
 * Ollama PowerShell Script Generator
 * Generates production-ready PowerShell scripts with error handling, logging, and templates
 */
class OllamaPowerShellGenerator {
    constructor() {
        this.scriptTemplates = this.loadScriptTemplates();
        this.generatedScripts = new Map(); // Track generated scripts
    }

    /**
     * Generate complete PowerShell script from command steps
     */
    async generateScript(steps, options = {}) {
        try {
            console.log('[SCRIPT GENERATOR] Generating PowerShell script for', steps.length, 'steps');
            
            const scriptId = `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const scriptParts = [];
            
            // Generate script header
            scriptParts.push(this.generateScriptHeader(options));
            
            // Generate parameter section
            if (options.parameters && options.parameters.length > 0) {
                scriptParts.push(this.generateParameterSection(options.parameters));
            }
            
            // Generate variable section
            scriptParts.push(this.generateVariableSection(options.variables));
            
            // Generate function definitions
            if (options.functions && options.functions.length > 0) {
                scriptParts.push(this.generateFunctionSection(options.functions));
            }
            
            // Generate main execution logic
            scriptParts.push(await this.generateMainExecution(steps, options));
            
            // Generate script footer
            scriptParts.push(this.generateScriptFooter(options));
            
            const fullScript = scriptParts.join('\n\n');
            
            // Store generated script
            this.generatedScripts.set(scriptId, {
                id: scriptId,
                script: fullScript,
                steps: steps,
                options: options,
                generatedAt: new Date().toISOString(),
                template: options.template || 'custom'
            });
            
            return {
                success: true,
                scriptId: scriptId,
                script: fullScript,
                metadata: {
                    steps: steps.length,
                    template: options.template || 'custom',
                    estimatedDuration: this.estimateScriptDuration(steps),
                    riskLevel: this.assessScriptRisk(steps),
                    requiresAdmin: this.checkAdminRequirements(steps)
                }
            };

        } catch (error) {
            console.error('[SCRIPT GENERATOR] Error generating script:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate script using predefined template
     */
    async generateFromTemplate(templateName, parameters, options = {}, ollamaProcessor = null) {
        try {
            const template = this.scriptTemplates[templateName];
            if (!template) {
                throw new Error(`Template '${templateName}' not found`);
            }

            console.log('[SCRIPT GENERATOR] Generating script from template:', templateName);
            
            // Use Ollama to customize the template
            const customizationPrompt = this.buildTemplateCustomizationPrompt(template, parameters, options);
            
            if (!ollamaProcessor) {
                // Fallback to simple template generation
                return this.generateSimpleTemplateScript(template, parameters, options);
            }
            
            const customizationResult = await ollamaProcessor.processCommandWithAI(
                customizationPrompt,
                { platform: 'Win32NT 10.0.26100.0' },
                { category: 'script_generation', action: 'customize_template' }
            );

            if (!customizationResult.success) {
                throw new Error('Failed to customize template');
            }

            // Generate the customized script
            const scriptResult = await this.generateScript(
                template.steps,
                {
                    ...options,
                    template: templateName,
                    parameters: parameters,
                    customizations: customizationResult.data
                }
            );

            return scriptResult;

        } catch (error) {
            console.error('[SCRIPT GENERATOR] Error generating from template:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate simple template script without Ollama processing
     */
    generateSimpleTemplateScript(template, parameters, options) {
        const scriptId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Simple script generation without AI customization
        const scriptParts = [];
        scriptParts.push(this.generateScriptHeader(options));
        
        for (const step of template.steps) {
            scriptParts.push(`# ${step.description}`);
            scriptParts.push(step.command || `Write-Host "Executing: ${step.description}"`);
            scriptParts.push('');
        }
        
        scriptParts.push(this.generateScriptFooter(options));
        
        const fullScript = scriptParts.join('\n');
        
        this.generatedScripts.set(scriptId, {
            id: scriptId,
            script: fullScript,
            steps: template.steps,
            options: options,
            generatedAt: new Date().toISOString(),
            template: template.name
        });
        
        return {
            success: true,
            scriptId: scriptId,
            script: fullScript,
            metadata: {
                steps: template.steps.length,
                template: template.name,
                estimatedDuration: template.estimatedDuration || 60,
                riskLevel: 'medium',
                requiresAdmin: false
            }
        };
    }

    /**
     * Generate script header with proper setup
     */
    generateScriptHeader(options = {}) {
        const header = [];
        
        header.push('# ===========================================');
        header.push('# PowerShell Script Generated by Ollama');
        header.push('# ===========================================');
        header.push(`# Generated: ${new Date().toISOString()}`);
        header.push(`# Template: ${options.template || 'custom'}`);
        header.push(`# Script ID: ${options.scriptId || 'unknown'}`);
        header.push('# ===========================================');
        header.push('');
        
        // Set execution policy and preferences
        header.push('# Execution settings');
        header.push('Set-StrictMode -Version Latest');
        header.push('$ErrorActionPreference = "Stop"');
        header.push('$ProgressPreference = "SilentlyContinue"');
        header.push('');
        
        // Add logging setup
        header.push('# Logging configuration');
        header.push('$LogFile = "C:\\temp\\ollama_script_$(Get-Date -Format "yyyyMMdd_HHmmss").log"');
        header.push('$LogLevel = "' + (options.logLevel || 'INFO') + '"');
        header.push('');
        header.push('function Write-Log {');
        header.push('    param(');
        header.push('        [string]$Message,');
        header.push('        [string]$Level = "INFO"');
        header.push('    )');
        header.push('    ');
        header.push('    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"');
        header.push('    $LogEntry = "[$Timestamp] [$Level] $Message"');
        header.push('    ');
        header.push('    # Console output with colors');
        header.push('    switch ($Level) {');
        header.push('        "ERROR" { Write-Host $LogEntry -ForegroundColor Red }');
        header.push('        "WARN"  { Write-Host $LogEntry -ForegroundColor Yellow }');
        header.push('        "INFO"  { Write-Host $LogEntry -ForegroundColor White }');
        header.push('        "DEBUG" { Write-Host $LogEntry -ForegroundColor Gray }');
        header.push('        default { Write-Host $LogEntry }');
        header.push('    }');
        header.push('    ');
        header.push('    # File logging');
        header.push('    try {');
        header.push('        Add-Content -Path $LogFile -Value $LogEntry -ErrorAction SilentlyContinue');
        header.push('    } catch {');
        header.push('        # Ignore logging errors');
        header.push('    }');
        header.push('}');
        header.push('');
        
        // Add progress tracking
        header.push('# Progress tracking');
        header.push('function Update-Progress {');
        header.push('    param(');
        header.push('        [string]$Activity,');
        header.push('        [string]$Status,');
        header.push('        [int]$PercentComplete = -1');
        header.push('    )');
        header.push('    ');
        header.push('    Write-Log "Progress: $Activity - $Status"');
        header.push('    if ($PercentComplete -ge 0) {');
        header.push('        Write-Progress -Activity $Activity -Status $Status -PercentComplete $PercentComplete');
        header.push('    }');
        header.push('}');
        header.push('');
        
        // Add error handling
        header.push('# Error handling');
        header.push('function Handle-Error {');
        header.push('    param(');
        header.push('        [string]$Context');
        header.push('    )');
        header.push('    ');
        header.push('    $ErrorMessage = $_.Exception.Message');
        header.push('    Write-Log "ERROR in $Context`: $ErrorMessage" "ERROR"');
        header.push('    ');
        header.push('    # Optional: Send error notification');
        header.push('    if ($env:SEND_ERROR_NOTIFICATIONS -eq "true") {');
        header.push('        # Add notification logic here');
        header.push('    }');
        header.push('}');
        header.push('');
        
        return header.join('\n');
    }

    /**
     * Generate parameter section
     */
    generateParameterSection(parameters) {
        const paramSection = [];
        
        paramSection.push('# ===========================================');
        paramSection.push('# Script Parameters');
        paramSection.push('# ===========================================');
        paramSection.push('');
        
        for (const param of parameters) {
            paramSection.push(`param(`);
            paramSection.push(`    [${param.type || 'string'}]`);
            paramSection.push(`    $${param.name}`);
            if (param.defaultValue !== undefined) {
                paramSection.push(`    = ${typeof param.defaultValue === 'string' ? `"${param.defaultValue}"` : param.defaultValue}`);
            }
            paramSection.push(`    # ${param.description || 'No description'}`);
            paramSection.push(`)`);
            paramSection.push('');
        }
        
        return paramSection.join('\n');
    }

    /**
     * Generate variable section
     */
    generateVariableSection(variables) {
        const varSection = [];
        
        varSection.push('# ===========================================');
        varSection.push('# Script Variables');
        varSection.push('# ===========================================');
        varSection.push('');
        
        if (variables && Object.keys(variables).length > 0) {
            for (const [name, value] of Object.entries(variables)) {
                const valueStr = typeof value === 'string' ? `"${value}"` : value;
                varSection.push(`$${name} = ${valueStr}  # ${variables[`${name}_desc`] || 'Variable'}`);
            }
        } else {
            varSection.push('# No custom variables defined');
        }
        
        varSection.push('');
        
        return varSection.join('\n');
    }

    /**
     * Generate function section
     */
    generateFunctionSection(functions) {
        const funcSection = [];
        
        funcSection.push('# ===========================================');
        funcSection.push('# Helper Functions');
        funcSection.push('# ===========================================');
        funcSection.push('');
        
        for (const func of functions) {
            funcSection.push(`function ${func.name} {`);
            funcSection.push(`    param(`);
            
            if (func.parameters) {
                for (const param of func.parameters) {
                    funcSection.push(`        [${param.type || 'string'}] $${param.name},`);
                }
            }
            
            funcSection.push(`    )`);
            funcSection.push(`    `);
            funcSection.push(`    # ${func.description || 'Function description'}`);
            funcSection.push(`    `);
            funcSection.push(`    try {`);
            funcSection.push(`        ${func.body || '# Function implementation'}`);
            funcSection.push(`    } catch {`);
            funcSection.push(`        Handle-Error "${func.name}"`);
            funcSection.push(`        throw`);
            funcSection.push(`    }`);
            funcSection.push(`}`);
            funcSection.push('');
        }
        
        return funcSection.join('\n');
    }

    /**
     * Generate main execution logic
     */
    async generateMainExecution(steps, options) {
        const execution = [];
        
        execution.push('# ===========================================');
        execution.push('# Main Execution');
        execution.push('# ===========================================');
        execution.push('');
        
        execution.push('try {');
        execution.push('    Write-Log "Script execution started"');
        execution.push('    $StartTime = Get-Date');
        execution.push('');
        
        // Add admin check if required
        if (this.checkAdminRequirements(steps)) {
            execution.push('    # Check for administrator privileges');
            execution.push('    $IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")');
            execution.push('    if (-not $IsAdmin) {');
            execution.push('        Write-Log "This script requires administrator privileges" "ERROR"');
            execution.push('        throw "Administrator privileges required"');
            execution.push('    }');
            execution.push('    Write-Log "Administrator privileges confirmed"');
            execution.push('');
        }
        
        // Generate step execution
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepNumber = i + 1;
            
            execution.push(`    # Step ${stepNumber}: ${step.description || step.action}`);
            execution.push(`    Update-Progress "Executing Step ${stepNumber}" "${step.description || step.action}" ${Math.round((stepNumber / steps.length) * 100)}`);
            execution.push('');
            
            // Add step-specific error handling
            execution.push('    try {');
            
            // Generate the actual command for this step
            const stepCommand = await this.generateStepCommand(step, stepNumber, options);
            execution.push(`        ${stepCommand}`);
            
            execution.push('        Write-Log "Step completed successfully"');
            execution.push('    } catch {');
            execution.push('        Handle-Error "Step ' + stepNumber + '"');
            execution.push('        throw');
            execution.push('    }');
            execution.push('');
        }
        
        execution.push('    # Script completion');
        execution.push('    $EndTime = Get-Date');
        execution.push('    $Duration = $EndTime - $StartTime');
        execution.push('    Write-Log "Script completed successfully in $($Duration.TotalSeconds) seconds"');
        execution.push('    Write-Host "✅ Script execution completed successfully!" -ForegroundColor Green');
        execution.push('');
        
        execution.push('} catch {');
        execution.push('    Write-Log "Script execution failed: $($_.Exception.Message)" "ERROR"');
        execution.push('    Write-Host "❌ Script execution failed!" -ForegroundColor Red');
        execution.push('    exit 1');
        execution.push('}');
        
        return execution.join('\n');
    }

    /**
     * Generate command for a specific step
     */
    async generateStepCommand(step, stepNumber, options) {
        try {
            // If step already has a command, use it
            if (step.command) {
                return step.command;
            }
            
            // Generate command using Ollama
            const prompt = this.buildStepCommandPrompt(step, stepNumber, options);
            
            const result = await this.ollamaProcessor.processCommandWithAI(
                prompt,
                { platform: 'Win32NT 10.0.26100.0' },
                { category: 'command_generation', action: 'generate_step_command' }
            );

            if (result.success) {
                return result.data.optimizedCommand?.command || result.data.explanation || step.action;
            } else {
                return `# Error generating command: ${result.error}`;
            }

        } catch (error) {
            return `# Error: ${error.message}`;
        }
    }

    /**
     * Generate script footer
     */
    generateScriptFooter(options = {}) {
        const footer = [];
        
        footer.push('');
        footer.push('# ===========================================');
        footer.push('# Script Footer');
        footer.push('# ===========================================');
        footer.push('');
        footer.push('Write-Log "Script finished at $(Get-Date)"');
        footer.push('');
        
        // Add cleanup if specified
        if (options.cleanup) {
            footer.push('# Cleanup operations');
            footer.push('try {');
            footer.push('    # Add cleanup logic here');
            footer.push('    Write-Log "Cleanup completed"');
            footer.push('} catch {');
            footer.push('    Write-Log "Cleanup failed: $($_.Exception.Message)" "WARN"');
            footer.push('}');
            footer.push('');
        }
        
        footer.push('# End of script');
        footer.push('');
        
        return footer.join('\n');
    }

    /**
     * Build template customization prompt
     */
    buildTemplateCustomizationPrompt(template, parameters, options) {
        return `Customize this PowerShell script template:

TEMPLATE: ${template.name}
DESCRIPTION: ${template.description}
STEPS: ${JSON.stringify(template.steps)}

PARAMETERS: ${JSON.stringify(parameters)}
OPTIONS: ${JSON.stringify(options)}

Please customize the template steps based on the provided parameters and options.
Return a JSON response with customized steps:

{
  "customizedSteps": [
    {
      "step": 1,
      "action": "action_name",
      "description": "Customized description",
      "command": "Customized PowerShell command",
      "variables": {},
      "conditions": []
    }
  ],
  "customizations": {
    "description": "What was customized",
    "parameters": "How parameters were used",
    "options": "How options were applied"
  }
}

Focus on:
1. Using the provided parameters effectively
2. Adapting commands to the specific context
3. Maintaining script robustness and error handling
4. Following PowerShell best practices

Return ONLY the JSON response.`;
    }

    /**
     * Build step command prompt
     */
    buildStepCommandPrompt(step, stepNumber, options) {
        return `Generate a PowerShell command for this step:

STEP: ${step.action}
DESCRIPTION: ${step.description}
STEP NUMBER: ${stepNumber}
CONTEXT: ${JSON.stringify(options.context || {})}

Requirements:
1. Use proper PowerShell syntax
2. Include error handling where appropriate
3. Add progress indicators
4. Make it robust and reliable
5. Follow PowerShell best practices

Return ONLY the PowerShell command, no explanations.`;
    }

    /**
     * Load script templates
     */
    loadScriptTemplates() {
        return {
            'download_and_install': {
                name: 'Download And Install (Safe)',
                description: 'Safely download an installer and run it silently',
                steps: [
                    { action: 'prepare_dir', description: 'Prepare download directory', command: '$downloadDir = Join-Path $env:USERPROFILE "Downloads"\nNew-Item -ItemType Directory -Force -Path $downloadDir | Out-Null' },
                    { action: 'download', description: 'Download installer', command: '$installer = Join-Path $downloadDir "setup.exe"\nInvoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing -MaximumRedirection 10 -TimeoutSec 120 -ErrorAction Stop' },
                    { action: 'validate', description: 'Validate downloaded file', command: 'if (-not (Test-Path $installer)) { throw "Download failed" }\nif ((Get-Item $installer).Length -lt 1024) { throw "Downloaded file too small" }' },
                    { action: 'install', description: 'Run installer silently', command: 'Start-Process -FilePath $installer -ArgumentList "/S","/quiet" -Wait -NoNewWindow' }
                ]
            },
            'winget_install': {
                name: 'Winget Install',
                description: 'Install software using winget with silent flags',
                steps: [
                    { action: 'ensure_winget', description: 'Check winget availability', command: 'if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw "winget not available" }' },
                    { action: 'install', description: 'Install package', command: 'winget install --id $PackageId -e --silent --accept-package-agreements --accept-source-agreements' }
                ]
            },
            'choco_install': {
                name: 'Chocolatey Install',
                description: 'Install software using Chocolatey',
                steps: [
                    { action: 'ensure_choco', description: 'Check choco availability', command: 'if (-not (Get-Command choco -ErrorAction SilentlyContinue)) { throw "choco not available" }' },
                    { action: 'install', description: 'Install package', command: 'choco install $PackageName -y --no-progress' }
                ]
            },
            'software_installation': {
                name: 'Software Installation',
                description: 'Download, install, and configure software',
                steps: [
                    { action: 'download', description: 'Download software installer' },
                    { action: 'verify', description: 'Verify download integrity' },
                    { action: 'install', description: 'Install software silently' },
                    { action: 'configure', description: 'Configure software settings' },
                    { action: 'verify_install', description: 'Verify installation' }
                ]
            },
            'system_diagnostics': {
                name: 'System Diagnostics',
                description: 'Comprehensive system health check',
                steps: [
                    { action: 'collect_system_info', description: 'Collect system information' },
                    { action: 'check_services', description: 'Check critical services' },
                    { action: 'check_disk_space', description: 'Check disk space usage' },
                    { action: 'check_memory', description: 'Check memory usage' },
                    { action: 'check_network', description: 'Check network connectivity' },
                    { action: 'generate_report', description: 'Generate diagnostic report' }
                ]
            },
            'security_audit': {
                name: 'Security Audit',
                description: 'Comprehensive security assessment',
                steps: [
                    { action: 'check_firewall', description: 'Check firewall status' },
                    { action: 'check_antivirus', description: 'Check antivirus status' },
                    { action: 'check_users', description: 'Audit user accounts' },
                    { action: 'check_permissions', description: 'Check file permissions' },
                    { action: 'check_services', description: 'Check security services' },
                    { action: 'generate_report', description: 'Generate security report' }
                ]
            },
            'file_operations': {
                name: 'File Operations',
                description: 'Batch file processing operations',
                steps: [
                    { action: 'search_files', description: 'Search for target files' },
                    { action: 'filter_files', description: 'Apply filters to files' },
                    { action: 'process_files', description: 'Process filtered files' },
                    { action: 'move_files', description: 'Move processed files' },
                    { action: 'verify_operation', description: 'Verify operation success' }
                ]
            },
            'network_operations': {
                name: 'Network Operations',
                description: 'Network configuration and diagnostics',
                steps: [
                    { action: 'scan_network', description: 'Scan network configuration' },
                    { action: 'test_connectivity', description: 'Test network connectivity' },
                    { action: 'check_ports', description: 'Check open ports' },
                    { action: 'generate_report', description: 'Generate network report' }
                ]
            }
        };
    }

    /**
     * Estimate script duration
     */
    estimateScriptDuration(steps) {
        return steps.reduce((total, step) => total + (parseInt(step.estimatedTime) || 5), 0);
    }

    /**
     * Assess script risk level
     */
    assessScriptRisk(steps) {
        const highRiskActions = ['delete', 'format', 'remove', 'uninstall', 'disable'];
        const mediumRiskActions = ['modify', 'change', 'update', 'install'];
        
        for (const step of steps) {
            const action = step.action.toLowerCase();
            if (highRiskActions.some(risk => action.includes(risk))) {
                return 'high';
            }
            if (mediumRiskActions.some(risk => action.includes(risk))) {
                return 'medium';
            }
        }
        
        return 'low';
    }

    /**
     * Check if script requires admin privileges
     */
    checkAdminRequirements(steps) {
        const adminActions = ['install', 'uninstall', 'service', 'registry', 'system', 'admin'];
        
        return steps.some(step => 
            adminActions.some(action => 
                step.action.toLowerCase().includes(action) || 
                step.description.toLowerCase().includes(action)
            )
        );
    }

    /**
     * Get generator statistics
     */
    getStatistics() {
        return {
            templatesAvailable: Object.keys(this.scriptTemplates).length,
            scriptsGenerated: this.generatedScripts.size,
            averageSteps: this.generatedScripts.size > 0 ?
                Array.from(this.generatedScripts.values()).reduce((sum, script) => sum + script.steps.length, 0) / this.generatedScripts.size : 0,
            templates: Object.keys(this.scriptTemplates),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = OllamaPowerShellGenerator;
