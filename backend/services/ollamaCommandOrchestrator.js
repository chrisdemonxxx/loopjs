/**
 * Ollama Command Orchestrator
 * Handles complex multi-step commands and command sequences
 */
class OllamaCommandOrchestrator {
    constructor() {
        this.commandChains = new Map(); // Store active command chains
        this.executionHistory = new Map(); // Store execution results
        this.dependencyGraph = new Map(); // Track command dependencies
    }

    /**
     * Parse complex user input into multiple command steps
     */
    async parseComplexCommand(userInput, clientInfo, context = {}, ollamaProcessor = null) {
        try {
            console.log('[ORCHESTRATOR] Parsing complex command:', userInput);
            
            // Use Ollama to analyze the input and break it down
            const analysisPrompt = this.buildAnalysisPrompt(userInput, clientInfo, context);
            
            if (!ollamaProcessor) {
                // Fallback to simple parsing if no processor provided
                return this.simpleParse(userInput, clientInfo, context);
            }
            
            const analysisResult = await ollamaProcessor.processCommandWithAI(
                analysisPrompt,
                clientInfo,
                { category: 'analysis', action: 'parse' }
            );

            if (!analysisResult.success) {
                throw new Error('Failed to analyze complex command');
            }

            // Parse the AI response to extract command steps
            const parsedSteps = this.parseAIResponse(analysisResult.data.response || analysisResult.data.explanation);
            
            // Generate unique chain ID
            const chainId = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Store command chain
            this.commandChains.set(chainId, {
                id: chainId,
                originalInput: userInput,
                steps: parsedSteps,
                status: 'parsed',
                createdAt: new Date().toISOString(),
                clientInfo: clientInfo,
                context: context
            });

            return {
                success: true,
                chainId: chainId,
                steps: parsedSteps,
                totalSteps: parsedSteps.length,
                estimatedDuration: this.estimateDuration(parsedSteps),
                dependencies: this.buildDependencyGraph(parsedSteps)
            };

        } catch (error) {
            console.error('[ORCHESTRATOR] Error parsing complex command:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Simple parsing fallback when Ollama processor is not available
     */
    simpleParse(userInput, clientInfo, context) {
        // Create a simple single-step command
        const chainId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const steps = [{
            step: 1,
            action: 'execute',
            description: userInput,
            command: userInput,
            dependsOn: null,
            estimatedTime: 10,
            riskLevel: 'medium',
            requiresConfirmation: false,
            parallelPossible: false
        }];
        
        this.commandChains.set(chainId, {
            id: chainId,
            originalInput: userInput,
            steps: steps,
            status: 'parsed',
            createdAt: new Date().toISOString(),
            clientInfo: clientInfo,
            context: context
        });

        return {
            success: true,
            chainId: chainId,
            steps: steps,
            totalSteps: steps.length,
            estimatedDuration: 10,
            dependencies: {}
        };
    }

    /**
     * Generate sequential PowerShell script with dependencies
     */
    async generateSequentialScript(chainId, options = {}, ollamaProcessor = null) {
        try {
            const chain = this.commandChains.get(chainId);
            if (!chain) {
                throw new Error('Command chain not found');
            }

            console.log('[ORCHESTRATOR] Generating script for chain:', chainId);

            const scriptParts = [];
            const variables = new Map();
            
            // Add script header
            scriptParts.push(this.generateScriptHeader(chain, options));
            
            // Process each step
            for (let i = 0; i < chain.steps.length; i++) {
                const step = chain.steps[i];
                const stepNumber = i + 1;
                
                // Generate PowerShell for this step
                const stepScript = await this.generateStepScript(step, stepNumber, variables, chain, ollamaProcessor);
                scriptParts.push(stepScript);
                
                // Update variables for next step
                this.updateVariables(variables, step, stepNumber);
            }
            
            // Add script footer
            scriptParts.push(this.generateScriptFooter(chain, options));
            
            const fullScript = scriptParts.join('\n\n');
            
            // Update chain with generated script
            chain.script = fullScript;
            chain.status = 'script_generated';
            chain.generatedAt = new Date().toISOString();
            
            return {
                success: true,
                script: fullScript,
                steps: chain.steps,
                variables: Object.fromEntries(variables),
                executionOrder: this.getExecutionOrder(chain.steps)
            };

        } catch (error) {
            console.error('[ORCHESTRATOR] Error generating script:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle conditional logic ("if this succeeds, then do that")
     */
    async generateConditionalScript(chainId, conditions) {
        try {
            const chain = this.commandChains.get(chainId);
            if (!chain) {
                throw new Error('Command chain not found');
            }

            console.log('[ORCHESTRATOR] Generating conditional script for chain:', chainId);

            const scriptParts = [];
            scriptParts.push(this.generateScriptHeader(chain, { includeConditionals: true }));
            
            // Process conditional logic
            for (const condition of conditions) {
                const conditionalScript = await this.generateConditionalBlock(condition, chain);
                scriptParts.push(conditionalScript);
            }
            
            scriptParts.push(this.generateScriptFooter(chain, { includeConditionals: true }));
            
            const conditionalScript = scriptParts.join('\n\n');
            
            // Update chain
            chain.conditionalScript = conditionalScript;
            chain.status = 'conditional_generated';
            
            return {
                success: true,
                script: conditionalScript,
                conditions: conditions,
                executionFlow: this.getConditionalFlow(conditions)
            };

        } catch (error) {
            console.error('[ORCHESTRATOR] Error generating conditional script:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Support parallel execution where possible
     */
    async generateParallelScript(chainId, parallelGroups) {
        try {
            const chain = this.commandChains.get(chainId);
            if (!chain) {
                throw new Error('Command chain not found');
            }

            console.log('[ORCHESTRATOR] Generating parallel script for chain:', chainId);

            const scriptParts = [];
            scriptParts.push(this.generateScriptHeader(chain, { includeParallel: true }));
            
            // Process parallel groups
            for (const group of parallelGroups) {
                const parallelScript = await this.generateParallelBlock(group, chain);
                scriptParts.push(parallelScript);
            }
            
            scriptParts.push(this.generateScriptFooter(chain, { includeParallel: true }));
            
            const parallelScript = scriptParts.join('\n\n');
            
            // Update chain
            chain.parallelScript = parallelScript;
            chain.status = 'parallel_generated';
            
            return {
                success: true,
                script: parallelScript,
                parallelGroups: parallelGroups,
                executionPlan: this.getParallelExecutionPlan(parallelGroups)
            };

        } catch (error) {
            console.error('[ORCHESTRATOR] Error generating parallel script:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track command chains and dependencies
     */
    trackCommandChain(chainId, executionData) {
        const chain = this.commandChains.get(chainId);
        if (!chain) {
            return false;
        }

        // Update execution tracking
        chain.executionData = executionData;
        chain.lastExecuted = new Date().toISOString();
        
        // Store in execution history
        this.executionHistory.set(chainId, {
            chainId: chainId,
            originalInput: chain.originalInput,
            executionData: executionData,
            executedAt: new Date().toISOString(),
            success: executionData.success || false,
            duration: executionData.duration || 0,
            stepsExecuted: executionData.stepsExecuted || 0,
            totalSteps: chain.steps.length
        });

        return true;
    }

    /**
     * Build analysis prompt for Ollama
     */
    buildAnalysisPrompt(userInput, clientInfo, context) {
        return `Analyze this complex command request and break it down into sequential steps:

USER REQUEST: "${userInput}"

CLIENT INFO: ${JSON.stringify(clientInfo)}
CONTEXT: ${JSON.stringify(context)}

Please analyze this request and return a JSON response with the following structure:
{
  "steps": [
    {
      "step": 1,
      "action": "action_name",
      "description": "What this step does",
      "command": "PowerShell command or description",
      "dependsOn": null,
      "estimatedTime": "time in seconds",
      "riskLevel": "low|medium|high",
      "requiresConfirmation": false,
      "parallelPossible": false
    }
  ],
  "totalSteps": 1,
  "estimatedDuration": "total time",
  "riskAssessment": "overall risk level",
  "parallelOpportunities": [],
  "conditionalLogic": []
}

Focus on:
1. Breaking down complex requests into logical steps
2. Identifying dependencies between steps
3. Highlighting opportunities for parallel execution
4. Assessing risk levels for each step
5. Suggesting conditional logic where appropriate

Return ONLY the JSON response, no additional text.`;
    }

    /**
     * Parse AI response to extract command steps
     */
    parseAIResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            if (!parsed.steps || !Array.isArray(parsed.steps)) {
                throw new Error('Invalid steps format in AI response');
            }

            return parsed.steps.map((step, index) => ({
                step: step.step || index + 1,
                action: step.action || `step_${index + 1}`,
                description: step.description || '',
                command: step.command || '',
                dependsOn: step.dependsOn || null,
                estimatedTime: step.estimatedTime || 5,
                riskLevel: step.riskLevel || 'low',
                requiresConfirmation: step.requiresConfirmation || false,
                parallelPossible: step.parallelPossible || false,
                variables: step.variables || {},
                conditions: step.conditions || []
            }));

        } catch (error) {
            console.error('[ORCHESTRATOR] Error parsing AI response:', error);
            
            // Fallback: create simple steps from response
            return [{
                step: 1,
                action: 'execute',
                description: 'Execute user request',
                command: response,
                dependsOn: null,
                estimatedTime: 10,
                riskLevel: 'medium',
                requiresConfirmation: false,
                parallelPossible: false
            }];
        }
    }

    /**
     * Generate script header
     */
    generateScriptHeader(chain, options = {}) {
        const header = [];
        
        header.push('# PowerShell Script Generated by Ollama Command Orchestrator');
        header.push(`# Chain ID: ${chain.id}`);
        header.push(`# Original Request: ${chain.originalInput}`);
        header.push(`# Generated: ${new Date().toISOString()}`);
        header.push('');
        
        // Add error handling
        header.push('# Error handling');
        header.push('$ErrorActionPreference = "Stop"');
        header.push('$ProgressPreference = "SilentlyContinue"');
        header.push('');
        
        // Add logging
        header.push('# Logging setup');
        header.push('$LogFile = "C:\\temp\\ollama_script_$(Get-Date -Format "yyyyMMdd_HHmmss").log"');
        header.push('function Write-Log {');
        header.push('    param($Message)');
        header.push('    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"');
        header.push('    $LogEntry = "[$Timestamp] $Message"');
        header.push('    Write-Host $LogEntry');
        header.push('    Add-Content -Path $LogFile -Value $LogEntry');
        header.push('}');
        header.push('');
        
        // Add progress tracking
        header.push('# Progress tracking');
        header.push('$TotalSteps = ' + chain.steps.length);
        header.push('$CurrentStep = 0');
        header.push('function Update-Progress {');
        header.push('    param($StepName)');
        header.push('    $script:CurrentStep++');
        header.push('    $PercentComplete = ($script:CurrentStep / $TotalSteps) * 100');
        header.push('    Write-Log "Step $script:CurrentStep/$TotalSteps : $StepName"');
        header.push('    Write-Progress -Activity "Ollama Command Chain" -Status $StepName -PercentComplete $PercentComplete');
        header.push('}');
        header.push('');
        
        return header.join('\n');
    }

    /**
     * Generate script footer
     */
    generateScriptFooter(chain, options = {}) {
        const footer = [];
        
        footer.push('');
        footer.push('# Script completion');
        footer.push('Write-Log "Script execution completed successfully"');
        footer.push('Write-Host "✅ All steps completed successfully!" -ForegroundColor Green');
        footer.push('');
        footer.push('# Cleanup');
        footer.push('Write-Log "Script finished at $(Get-Date)"');
        footer.push('');
        
        return footer.join('\n');
    }

    /**
     * Generate PowerShell for a single step
     */
    async generateStepScript(step, stepNumber, variables, chain, ollamaProcessor = null) {
        const stepScript = [];
        
        stepScript.push(`# Step ${stepNumber}: ${step.description}`);
        stepScript.push(`Update-Progress "${step.action}"`);
        stepScript.push('');
        
        // Add step-specific error handling
        stepScript.push('try {');
        
        // Generate the actual command
        if (step.command) {
            // Use variables if present
            let command = step.command;
            for (const [key, value] of variables) {
                command = command.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
            }
            stepScript.push(`    ${command}`);
        } else {
            // Generate command using Ollama
            const commandResult = await this.generateCommandForStep(step, chain, ollamaProcessor);
            if (commandResult.success) {
                stepScript.push(`    ${commandResult.command}`);
            } else {
                stepScript.push(`    # Error generating command: ${commandResult.error}`);
                stepScript.push(`    Write-Log "ERROR: ${commandResult.error}"`);
            }
        }
        
        stepScript.push('');
        stepScript.push('    Write-Log "Step completed successfully"');
        stepScript.push('} catch {');
        stepScript.push('    Write-Log "ERROR in step: $($_.Exception.Message)"');
        stepScript.push('    Write-Host "❌ Step failed: $($_.Exception.Message)" -ForegroundColor Red');
        stepScript.push('    throw');
        stepScript.push('}');
        stepScript.push('');
        
        return stepScript.join('\n');
    }

    /**
     * Generate command for a specific step using Ollama
     */
    async generateCommandForStep(step, chain, ollamaProcessor = null) {
        try {
            const prompt = `Generate a PowerShell command for this step:

STEP: ${step.action}
DESCRIPTION: ${step.description}
CONTEXT: ${chain.originalInput}
CLIENT: ${JSON.stringify(chain.clientInfo)}

Requirements:
1. Use proper PowerShell syntax
2. Include error handling
3. Add progress indicators
4. Make it robust and reliable

Return ONLY the PowerShell command, no explanations.`;

            if (!ollamaProcessor) {
                // Fallback to simple command
                return {
                    success: true,
                    command: `Write-Host "Executing: ${step.description}"`
                };
            }

            const result = await ollamaProcessor.processCommandWithAI(
                prompt,
                chain.clientInfo,
                { category: 'command_generation', action: 'generate_step' }
            );

            if (result.success) {
                return {
                    success: true,
                    command: result.data.optimizedCommand?.command || result.data.explanation || prompt
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Failed to generate command'
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
     * Update variables for next step
     */
    updateVariables(variables, step, stepNumber) {
        // Add step-specific variables
        variables.set(`step_${stepNumber}_result`, `$Step${stepNumber}Result`);
        variables.set(`step_${stepNumber}_success`, `$Step${stepNumber}Success`);
        
        // Add step variables if defined
        if (step.variables) {
            for (const [key, value] of Object.entries(step.variables)) {
                variables.set(key, value);
            }
        }
    }

    /**
     * Build dependency graph
     */
    buildDependencyGraph(steps) {
        const graph = new Map();
        
        for (const step of steps) {
            graph.set(step.step, {
                step: step.step,
                dependsOn: step.dependsOn,
                dependents: []
            });
        }
        
        // Build dependents
        for (const step of steps) {
            if (step.dependsOn) {
                const dependencies = Array.isArray(step.dependsOn) ? step.dependsOn : [step.dependsOn];
                for (const dep of dependencies) {
                    if (graph.has(dep)) {
                        graph.get(dep).dependents.push(step.step);
                    }
                }
            }
        }
        
        return Object.fromEntries(graph);
    }

    /**
     * Estimate total duration
     */
    estimateDuration(steps) {
        return steps.reduce((total, step) => total + (parseInt(step.estimatedTime) || 5), 0);
    }

    /**
     * Get execution order based on dependencies
     */
    getExecutionOrder(steps) {
        const visited = new Set();
        const order = [];
        
        const visit = (step) => {
            if (visited.has(step.step)) return;
            
            if (step.dependsOn) {
                const dependencies = Array.isArray(step.dependsOn) ? step.dependsOn : [step.dependsOn];
                for (const dep of dependencies) {
                    const depStep = steps.find(s => s.step === dep);
                    if (depStep) visit(depStep);
                }
            }
            
            visited.add(step.step);
            order.push(step.step);
        };
        
        for (const step of steps) {
            visit(step);
        }
        
        return order;
    }

    /**
     * Generate conditional block
     */
    async generateConditionalBlock(condition, chain) {
        const block = [];
        
        block.push(`# Conditional: ${condition.description}`);
        block.push(`if (${condition.condition}) {`);
        block.push('    try {');
        
        // Generate commands for this condition
        for (const action of condition.actions) {
            const commandResult = await this.generateCommandForStep(action, chain);
            if (commandResult.success) {
                block.push(`        ${commandResult.command}`);
            }
        }
        
        block.push('        Write-Log "Conditional block executed successfully"');
        block.push('    } catch {');
        block.push('        Write-Log "ERROR in conditional block: $($_.Exception.Message)"');
        block.push('        throw');
        block.push('    }');
        block.push('}');
        
        return block.join('\n');
    }

    /**
     * Generate parallel block
     */
    async generateParallelBlock(group, chain) {
        const block = [];
        
        block.push(`# Parallel execution group: ${group.name}`);
        block.push('$ParallelJobs = @()');
        
        for (const step of group.steps) {
            block.push(`$ParallelJobs += Start-Job -ScriptBlock {`);
            block.push(`    # ${step.description}`);
            
            const commandResult = await this.generateCommandForStep(step, chain);
            if (commandResult.success) {
                block.push(`    ${commandResult.command}`);
            }
            
            block.push(`} -Name "Step_${step.step}"`);
        }
        
        block.push('');
        block.push('# Wait for all jobs to complete');
        block.push('$ParallelJobs | Wait-Job');
        block.push('');
        block.push('# Collect results');
        block.push('$ParallelJobs | ForEach-Object {');
        block.push('    $Result = Receive-Job $_');
        block.push('    Write-Log "Job $($_.Name) completed"');
        block.push('    Remove-Job $_');
        block.push('}');
        
        return block.join('\n');
    }

    /**
     * Get conditional flow
     */
    getConditionalFlow(conditions) {
        return conditions.map(condition => ({
            condition: condition.condition,
            description: condition.description,
            actions: condition.actions.map(action => action.action)
        }));
    }

    /**
     * Get parallel execution plan
     */
    getParallelExecutionPlan(parallelGroups) {
        return parallelGroups.map(group => ({
            name: group.name,
            steps: group.steps.map(step => step.action),
            estimatedTime: Math.max(...group.steps.map(step => step.estimatedTime || 5))
        }));
    }

    /**
     * Get orchestrator statistics
     */
    getStatistics() {
        return {
            activeChains: this.commandChains.size,
            totalExecutions: this.executionHistory.size,
            averageSteps: this.commandChains.size > 0 ? 
                Array.from(this.commandChains.values()).reduce((sum, chain) => sum + chain.steps.length, 0) / this.commandChains.size : 0,
            successRate: this.executionHistory.size > 0 ?
                Array.from(this.executionHistory.values()).filter(exec => exec.success).length / this.executionHistory.size : 0,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = OllamaCommandOrchestrator;
