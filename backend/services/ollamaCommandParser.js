/**
 * Ollama Command Parser
 * Advanced natural language parsing for complex command requests
 */
class OllamaCommandParser {
    constructor() {
        this.parsingPatterns = this.loadParsingPatterns();
        this.parsingHistory = new Map(); // Track parsing history for learning
    }

    /**
     * Extract intent from natural language input
     */
    async extractIntent(userInput, clientInfo, context = {}, ollamaProcessor = null) {
        try {
            console.log('[PARSER] Extracting intent from:', userInput);
            
            const intentPrompt = this.buildIntentExtractionPrompt(userInput, clientInfo, context);
            
            if (!ollamaProcessor) {
                // Fallback to simple intent extraction
                return this.simpleIntentExtraction(userInput, clientInfo, context);
            }
            
            const result = await ollamaProcessor.processCommandWithAI(
                intentPrompt,
                clientInfo,
                { category: 'intent_extraction', action: 'parse_intent' }
            );

            if (!result.success) {
                throw new Error('Failed to extract intent');
            }

            const parsedIntent = this.parseIntentResponse(result.data.response || result.data.explanation);
            
            // Store parsing result for learning
            this.parsingHistory.set(Date.now(), {
                input: userInput,
                intent: parsedIntent,
                clientInfo: clientInfo,
                context: context
            });

            return {
                success: true,
                intent: parsedIntent
            };

        } catch (error) {
            console.error('[PARSER] Error extracting intent:', error);
            return {
                success: false,
                error: error.message,
                intent: this.getFallbackIntent(userInput)
            };
        }
    }

    /**
     * Simple intent extraction fallback
     */
    simpleIntentExtraction(userInput, clientInfo, context) {
        // Simple keyword-based intent extraction
        const input = userInput.toLowerCase();
        let action = 'execute';
        let category = 'general';
        
        if (input.includes('download') || input.includes('install')) {
            action = 'install';
            category = 'automation';
        } else if (input.includes('backup') || input.includes('copy')) {
            action = 'backup';
            category = 'file_operations';
        } else if (input.includes('check') || input.includes('test')) {
            action = 'diagnose';
            category = 'diagnostics';
        } else if (input.includes('security') || input.includes('audit')) {
            action = 'audit';
            category = 'security';
        }
        
        const intent = {
            action: action,
            category: category,
            description: userInput,
            priority: 'medium',
            urgency: 'medium',
            scope: 'single',
            target: 'system',
            method: 'direct',
            expectedOutcome: 'command execution',
            constraints: [],
            relatedActions: []
        };
        
        return {
            success: true,
            intent: intent
        };
    }

    /**
     * Identify command parameters and variables
     */
    async identifyParameters(userInput, intent, context = {}) {
        try {
            console.log('[PARSER] Identifying parameters for:', intent.action);
            
            const parameterPrompt = this.buildParameterExtractionPrompt(userInput, intent, context);
            
            const result = await this.ollamaProcessor.processCommandWithAI(
                parameterPrompt,
                { platform: 'Win32NT 10.0.26100.0' },
                { category: 'parameter_extraction', action: 'extract_parameters' }
            );

            if (!result.success) {
                throw new Error('Failed to identify parameters');
            }

            const parameters = this.parseParameterResponse(result.data.response || result.data.explanation);
            
            return {
                success: true,
                parameters: parameters
            };

        } catch (error) {
            console.error('[PARSER] Error identifying parameters:', error);
            return {
                success: false,
                error: error.message,
                parameters: this.getDefaultParameters(intent)
            };
        }
    }

    /**
     * Detect command sequences and dependencies
     */
    async detectSequences(userInput, intent, context = {}) {
        try {
            console.log('[PARSER] Detecting command sequences for:', intent.action);
            
            const sequencePrompt = this.buildSequenceDetectionPrompt(userInput, intent, context);
            
            const result = await this.ollamaProcessor.processCommandWithAI(
                sequencePrompt,
                { platform: 'Win32NT 10.0.26100.0' },
                { category: 'sequence_detection', action: 'detect_sequences' }
            );

            if (!result.success) {
                throw new Error('Failed to detect sequences');
            }

            const sequences = this.parseSequenceResponse(result.data.response || result.data.explanation);
            
            return {
                success: true,
                sequences: sequences
            };

        } catch (error) {
            console.error('[PARSER] Error detecting sequences:', error);
            return {
                success: false,
                error: error.message,
                sequences: this.getDefaultSequence(intent)
            };
        }
    }

    /**
     * Parse conditional logic and loops
     */
    async parseConditionalLogic(userInput, intent, context = {}) {
        try {
            console.log('[PARSER] Parsing conditional logic for:', intent.action);
            
            const conditionalPrompt = this.buildConditionalParsingPrompt(userInput, intent, context);
            
            const result = await this.ollamaProcessor.processCommandWithAI(
                conditionalPrompt,
                { platform: 'Win32NT 10.0.26100.0' },
                { category: 'conditional_parsing', action: 'parse_conditionals' }
            );

            if (!result.success) {
                throw new Error('Failed to parse conditional logic');
            }

            const conditionals = this.parseConditionalResponse(result.data.response || result.data.explanation);
            
            return {
                success: true,
                conditionals: conditionals
            };

        } catch (error) {
            console.error('[PARSER] Error parsing conditional logic:', error);
            return {
                success: false,
                error: error.message,
                conditionals: []
            };
        }
    }

    /**
     * Understand time constraints and scheduling
     */
    async parseTimeConstraints(userInput, intent, context = {}) {
        try {
            console.log('[PARSER] Parsing time constraints for:', intent.action);
            
            const timePrompt = this.buildTimeConstraintPrompt(userInput, intent, context);
            
            const result = await this.ollamaProcessor.processCommandWithAI(
                timePrompt,
                { platform: 'Win32NT 10.0.26100.0' },
                { category: 'time_parsing', action: 'parse_time_constraints' }
            );

            if (!result.success) {
                throw new Error('Failed to parse time constraints');
            }

            const timeConstraints = this.parseTimeConstraintResponse(result.data.response || result.data.explanation);
            
            return {
                success: true,
                timeConstraints: timeConstraints
            };

        } catch (error) {
            console.error('[PARSER] Error parsing time constraints:', error);
            return {
                success: false,
                error: error.message,
                timeConstraints: this.getDefaultTimeConstraints()
            };
        }
    }

    /**
     * Comprehensive parsing of complex user input
     */
    async parseComplexInput(userInput, clientInfo, context = {}, ollamaProcessor = null) {
        try {
            console.log('[PARSER] Parsing complex input:', userInput);
            
            // Extract intent
            const intentResult = await this.extractIntent(userInput, clientInfo, context, ollamaProcessor);
            if (!intentResult.success) {
                throw new Error('Failed to extract intent: ' + intentResult.error);
            }

            // Identify parameters
            const parameterResult = await this.identifyParameters(userInput, intentResult.intent, context);
            
            // Detect sequences
            const sequenceResult = await this.detectSequences(userInput, intentResult.intent, context);
            
            // Parse conditionals
            const conditionalResult = await this.parseConditionalLogic(userInput, intentResult.intent, context);
            
            // Parse time constraints
            const timeResult = await this.parseTimeConstraints(userInput, intentResult.intent, context);
            
            // Combine all results
            const comprehensiveResult = {
                success: true,
                originalInput: userInput,
                intent: intentResult.intent,
                parameters: parameterResult.parameters || {},
                sequences: sequenceResult.sequences || [],
                conditionals: conditionalResult.conditionals || [],
                timeConstraints: timeResult.timeConstraints || {},
                complexity: this.assessComplexity(intentResult.intent, sequenceResult.sequences, conditionalResult.conditionals),
                estimatedDuration: this.estimateDuration(sequenceResult.sequences, timeResult.timeConstraints),
                riskLevel: this.assessRiskLevel(intentResult.intent, parameterResult.parameters)
            };

            return comprehensiveResult;

        } catch (error) {
            console.error('[PARSER] Error parsing complex input:', error);
            return {
                success: false,
                error: error.message,
                originalInput: userInput,
                intent: this.getFallbackIntent(userInput)
            };
        }
    }

    /**
     * Build intent extraction prompt
     */
    buildIntentExtractionPrompt(userInput, clientInfo, context) {
        return `Analyze this user request and extract the primary intent:

USER REQUEST: "${userInput}"

CLIENT INFO: ${JSON.stringify(clientInfo)}
CONTEXT: ${JSON.stringify(context)}

Extract the intent and return a JSON response:

{
  "action": "primary_action_name",
  "category": "action_category",
  "description": "What the user wants to accomplish",
  "priority": "low|medium|high",
  "urgency": "low|medium|high",
  "scope": "single|multiple|system_wide",
  "target": "what_is_being_affected",
  "method": "how_it_should_be_done",
  "expectedOutcome": "what_result_is_expected",
  "constraints": ["any_limitations_or_requirements"],
  "relatedActions": ["other_actions_that_might_be_needed"]
}

Categories include: installation, configuration, monitoring, maintenance, security, backup, cleanup, diagnostics, automation, etc.

Focus on understanding the core purpose and desired outcome. Return ONLY the JSON response.`;
    }

    /**
     * Build parameter extraction prompt
     */
    buildParameterExtractionPrompt(userInput, intent, context) {
        return `Extract parameters and variables from this user request:

USER REQUEST: "${userInput}"
INTENT: ${JSON.stringify(intent)}

Extract all parameters and return JSON:

{
  "parameters": {
    "param_name": {
      "value": "extracted_value",
      "type": "string|number|boolean|path|url|etc",
      "required": true|false,
      "description": "what this parameter represents",
      "validation": "how_to_validate_this_parameter",
      "default": "default_value_if_any"
    }
  },
  "variables": {
    "var_name": {
      "value": "extracted_value",
      "scope": "local|global|session",
      "description": "what this variable represents"
    }
  },
  "paths": {
    "source": "source_path_or_location",
    "destination": "destination_path_or_location",
    "working": "working_directory"
  },
  "options": {
    "option_name": "option_value",
    "flags": ["flag1", "flag2"]
  }
}

Focus on extracting:
- File paths and locations
- URLs and network addresses
- Configuration values
- Time periods and schedules
- User accounts and permissions
- Software names and versions

Return ONLY the JSON response.`;
    }

    /**
     * Build sequence detection prompt
     */
    buildSequenceDetectionPrompt(userInput, intent, context) {
        return `Detect command sequences and dependencies in this request:

USER REQUEST: "${userInput}"
INTENT: ${JSON.stringify(intent)}

Analyze for sequences and return JSON:

{
  "sequences": [
    {
      "sequenceId": "seq_1",
      "steps": [
        {
          "step": 1,
          "action": "action_name",
          "description": "what this step does",
          "dependsOn": null,
          "parallelPossible": false,
          "estimatedTime": 5,
          "critical": true|false
        }
      ],
      "type": "sequential|parallel|conditional|mixed",
      "description": "overall sequence description"
    }
  ],
  "dependencies": [
    {
      "from": "step_name",
      "to": "dependent_step_name",
      "type": "success|completion|data|time"
    }
  ],
  "parallelOpportunities": [
    {
      "steps": ["step1", "step2"],
      "reason": "why these can run in parallel"
    }
  ]
}

Look for:
- Sequential operations (one after another)
- Parallel operations (can run simultaneously)
- Conditional operations (if/then logic)
- Dependencies between steps
- Data flow between steps

Return ONLY the JSON response.`;
    }

    /**
     * Build conditional parsing prompt
     */
    buildConditionalParsingPrompt(userInput, intent, context) {
        return `Parse conditional logic and loops from this request:

USER REQUEST: "${userInput}"
INTENT: ${JSON.stringify(intent)}

Extract conditionals and return JSON:

{
  "conditionals": [
    {
      "type": "if_then|if_then_else|while|until|for",
      "condition": "condition_description",
      "conditionCode": "PowerShell condition expression",
      "trueAction": "what happens if true",
      "falseAction": "what happens if false (if applicable)",
      "loopCount": "number of iterations (for loops)",
      "description": "what this conditional does"
    }
  ],
  "loops": [
    {
      "type": "foreach|for|while|do_while",
      "iterator": "what is being iterated",
      "condition": "loop condition",
      "action": "action to perform in loop",
      "breakCondition": "when to break out of loop"
    }
  ],
  "errorHandling": [
    {
      "condition": "error condition",
      "action": "what to do on error",
      "retry": true|false,
      "maxRetries": "maximum retry attempts"
    }
  ]
}

Look for:
- If/then/else statements
- While/until loops
- For/foreach loops
- Error handling conditions
- Retry logic
- Break/continue conditions

Return ONLY the JSON response.`;
    }

    /**
     * Build time constraint prompt
     */
    buildTimeConstraintPrompt(userInput, intent, context) {
        return `Parse time constraints and scheduling from this request:

USER REQUEST: "${userInput}"
INTENT: ${JSON.stringify(intent)}

Extract time constraints and return JSON:

{
  "timeConstraints": {
    "duration": "how long it should take",
    "timeout": "maximum time allowed",
    "schedule": "when it should run",
    "frequency": "how often to repeat",
    "deadline": "when it must be completed",
    "priority": "time priority level"
  },
  "scheduling": {
    "immediate": true|false,
    "scheduled": "specific time to run",
    "recurring": "recurrence pattern",
    "conditions": "conditions for scheduling"
  },
  "monitoring": {
    "duration": "how long to monitor",
    "interval": "checking interval",
    "threshold": "threshold values",
    "action": "action when threshold reached"
  }
}

Look for:
- Time durations ("5 minutes", "2 hours")
- Scheduling ("every day", "at 3 PM")
- Deadlines ("by tomorrow", "before Friday")
- Monitoring periods ("for 10 minutes", "until success")
- Frequency ("every hour", "daily")

Return ONLY the JSON response.`;
    }

    /**
     * Parse intent response
     */
    parseIntentResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
                action: parsed.action || 'unknown',
                category: parsed.category || 'general',
                description: parsed.description || '',
                priority: parsed.priority || 'medium',
                urgency: parsed.urgency || 'medium',
                scope: parsed.scope || 'single',
                target: parsed.target || '',
                method: parsed.method || '',
                expectedOutcome: parsed.expectedOutcome || '',
                constraints: parsed.constraints || [],
                relatedActions: parsed.relatedActions || []
            };

        } catch (error) {
            console.error('[PARSER] Error parsing intent response:', error);
            return this.getFallbackIntent(response);
        }
    }

    /**
     * Parse parameter response
     */
    parseParameterResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
                parameters: parsed.parameters || {},
                variables: parsed.variables || {},
                paths: parsed.paths || {},
                options: parsed.options || {}
            };

        } catch (error) {
            console.error('[PARSER] Error parsing parameter response:', error);
            return {
                parameters: {},
                variables: {},
                paths: {},
                options: {}
            };
        }
    }

    /**
     * Parse sequence response
     */
    parseSequenceResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
                sequences: parsed.sequences || [],
                dependencies: parsed.dependencies || [],
                parallelOpportunities: parsed.parallelOpportunities || []
            };

        } catch (error) {
            console.error('[PARSER] Error parsing sequence response:', error);
            return {
                sequences: [],
                dependencies: [],
                parallelOpportunities: []
            };
        }
    }

    /**
     * Parse conditional response
     */
    parseConditionalResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
                conditionals: parsed.conditionals || [],
                loops: parsed.loops || [],
                errorHandling: parsed.errorHandling || []
            };

        } catch (error) {
            console.error('[PARSER] Error parsing conditional response:', error);
            return {
                conditionals: [],
                loops: [],
                errorHandling: []
            };
        }
    }

    /**
     * Parse time constraint response
     */
    parseTimeConstraintResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
                timeConstraints: parsed.timeConstraints || {},
                scheduling: parsed.scheduling || {},
                monitoring: parsed.monitoring || {}
            };

        } catch (error) {
            console.error('[PARSER] Error parsing time constraint response:', error);
            return {
                timeConstraints: {},
                scheduling: {},
                monitoring: {}
            };
        }
    }

    /**
     * Get fallback intent when parsing fails
     */
    getFallbackIntent(input) {
        return {
            action: 'execute',
            category: 'general',
            description: input,
            priority: 'medium',
            urgency: 'medium',
            scope: 'single',
            target: 'system',
            method: 'direct',
            expectedOutcome: 'command execution',
            constraints: [],
            relatedActions: []
        };
    }

    /**
     * Get default parameters
     */
    getDefaultParameters(intent) {
        return {
            parameters: {},
            variables: {},
            paths: {},
            options: {}
        };
    }

    /**
     * Get default sequence
     */
    getDefaultSequence(intent) {
        return {
            sequences: [{
                sequenceId: 'default',
                steps: [{
                    step: 1,
                    action: intent.action,
                    description: intent.description,
                    dependsOn: null,
                    parallelPossible: false,
                    estimatedTime: 5,
                    critical: true
                }],
                type: 'sequential',
                description: 'Default single-step sequence'
            }],
            dependencies: [],
            parallelOpportunities: []
        };
    }

    /**
     * Get default time constraints
     */
    getDefaultTimeConstraints() {
        return {
            timeConstraints: {},
            scheduling: { immediate: true },
            monitoring: {}
        };
    }

    /**
     * Assess complexity of parsed input
     */
    assessComplexity(intent, sequences, conditionals) {
        let complexity = 'simple';
        
        if (sequences.length > 1) complexity = 'medium';
        if (conditionals.length > 0) complexity = 'medium';
        if (sequences.length > 3 || conditionals.length > 2) complexity = 'complex';
        
        return complexity;
    }

    /**
     * Estimate duration based on sequences and time constraints
     */
    estimateDuration(sequences, timeConstraints) {
        if (timeConstraints.timeConstraints?.duration) {
            return timeConstraints.timeConstraints.duration;
        }
        
        let totalTime = 0;
        for (const sequence of sequences) {
            for (const step of sequence.steps) {
                totalTime += step.estimatedTime || 5;
            }
        }
        
        return totalTime;
    }

    /**
     * Assess risk level
     */
    assessRiskLevel(intent, parameters) {
        const highRiskActions = ['delete', 'format', 'remove', 'uninstall', 'disable'];
        const mediumRiskActions = ['modify', 'change', 'update', 'install'];
        
        const action = intent.action.toLowerCase();
        
        if (highRiskActions.some(risk => action.includes(risk))) {
            return 'high';
        }
        if (mediumRiskActions.some(risk => action.includes(risk))) {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Load parsing patterns for pattern matching
     */
    loadParsingPatterns() {
        return {
            timePatterns: [
                /(\d+)\s*(minutes?|mins?|m)/gi,
                /(\d+)\s*(hours?|hrs?|h)/gi,
                /(\d+)\s*(days?|d)/gi,
                /(\d+)\s*(weeks?|w)/gi
            ],
            pathPatterns: [
                /[A-Za-z]:\\[^\\]+/g,
                /\\\\[^\\]+\\[^\\]+/g,
                /\/[^\/]+/g
            ],
            urlPatterns: [
                /https?:\/\/[^\s]+/gi,
                /ftp:\/\/[^\s]+/gi
            ],
            conditionalPatterns: [
                /if\s+(.+?)\s+then\s+(.+)/gi,
                /when\s+(.+?)\s+do\s+(.+)/gi,
                /unless\s+(.+?)\s+then\s+(.+)/gi
            ]
        };
    }

    /**
     * Get parser statistics
     */
    getStatistics() {
        return {
            parsingHistorySize: this.parsingHistory.size,
            patternsLoaded: Object.keys(this.parsingPatterns).length,
            averageComplexity: this.calculateAverageComplexity(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate average complexity from history
     */
    calculateAverageComplexity() {
        if (this.parsingHistory.size === 0) return 'simple';
        
        const complexities = Array.from(this.parsingHistory.values())
            .map(entry => entry.intent?.complexity || 'simple');
        
        const simpleCount = complexities.filter(c => c === 'simple').length;
        const mediumCount = complexities.filter(c => c === 'medium').length;
        const complexCount = complexities.filter(c => c === 'complex').length;
        
        if (complexCount > mediumCount && complexCount > simpleCount) return 'complex';
        if (mediumCount > simpleCount) return 'medium';
        return 'simple';
    }
}

module.exports = OllamaCommandParser;
