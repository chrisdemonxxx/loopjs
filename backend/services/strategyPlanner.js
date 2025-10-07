/**
 * Strategy Planner
 * Generates multiple fallback strategies for command execution
 */

class StrategyPlanner {
    constructor() {
        this.strategyTemplates = {
            download: {
                package_manager: {
                    name: 'Package Manager',
                    description: 'Use system package managers',
                    tools: ['system_tools'],
                    priority: 1,
                    successRate: 0.72,
                    estimatedTime: 15000
                },
                direct: {
                    name: 'Direct Download',
                    description: 'Download directly from official URL',
                    tools: ['web_fetch'],
                    priority: 2,
                    successRate: 0.8,
                    estimatedTime: 5000
                },
                mirror: {
                    name: 'Mirror/CDN Download',
                    description: 'Try alternative download sources',
                    tools: ['web_fetch'],
                    priority: 3,
                    successRate: 0.7,
                    estimatedTime: 8000
                },
                browser_automation: {
                    name: 'Browser Automation',
                    description: 'Use browser to navigate and download',
                    tools: ['browser_automation'],
                    priority: 4,
                    successRate: 0.9,
                    estimatedTime: 20000
                },
                search_and_scrape: {
                    name: 'Search and Scrape',
                    description: 'Search for download links and scrape',
                    tools: ['web_fetch', 'browser_automation'],
                    priority: 5,
                    successRate: 0.5,
                    estimatedTime: 30000
                }
            },
            
            install: {
                silent: {
                    name: 'Silent Installation',
                    description: 'Install silently with command line flags',
                    tools: ['system_tools'],
                    priority: 1,
                    successRate: 0.8,
                    estimatedTime: 10000
                },
                gui: {
                    name: 'GUI Installation',
                    description: 'Use browser automation for GUI install',
                    tools: ['browser_automation'],
                    priority: 2,
                    successRate: 0.9,
                    estimatedTime: 25000
                },
                package_manager: {
                    name: 'Package Manager Install',
                    description: 'Use system package managers',
                    tools: ['system_tools'],
                    priority: 3,
                    successRate: 0.7,
                    estimatedTime: 12000
                },
                portable: {
                    name: 'Portable Installation',
                    description: 'Extract portable version',
                    tools: ['web_fetch', 'system_tools'],
                    priority: 4,
                    successRate: 0.6,
                    estimatedTime: 15000
                }
            },
            
            network: {
                direct_command: {
                    name: 'Direct Network Command',
                    description: 'Execute network command directly',
                    tools: ['system_tools'],
                    priority: 1,
                    successRate: 0.95,
                    estimatedTime: 2000
                },
                alternative_command: {
                    name: 'Alternative Network Tool',
                    description: 'Use alternative network tools',
                    tools: ['system_tools'],
                    priority: 2,
                    successRate: 0.8,
                    estimatedTime: 3000
                },
                script_wrapper: {
                    name: 'Script Wrapper',
                    description: 'Wrap command in script for better execution',
                    tools: ['system_tools'],
                    priority: 3,
                    successRate: 0.85,
                    estimatedTime: 4000
                }
            },
            
            search: {
                direct_query: {
                    name: 'Direct Search Query',
                    description: 'Search using search engine APIs',
                    tools: ['web_fetch'],
                    priority: 1,
                    successRate: 0.8,
                    estimatedTime: 5000
                },
                browser_search: {
                    name: 'Browser Search',
                    description: 'Use browser automation for search',
                    tools: ['browser_automation'],
                    priority: 2,
                    successRate: 0.9,
                    estimatedTime: 15000
                },
                multiple_engines: {
                    name: 'Multiple Search Engines',
                    description: 'Try different search engines',
                    tools: ['web_fetch'],
                    priority: 3,
                    successRate: 0.7,
                    estimatedTime: 20000
                },
                specialized_sites: {
                    name: 'Specialized Sites',
                    description: 'Search specialized websites',
                    tools: ['web_fetch', 'browser_automation'],
                    priority: 4,
                    successRate: 0.6,
                    estimatedTime: 25000
                }
            },
            
            automate: {
                selenium: {
                    name: 'Selenium Automation',
                    description: 'Use Selenium for web automation',
                    tools: ['python_tools'],
                    priority: 1,
                    successRate: 0.9,
                    estimatedTime: 20000
                },
                puppeteer: {
                    name: 'Puppeteer Automation',
                    description: 'Use Puppeteer for browser automation',
                    tools: ['browser_automation'],
                    priority: 2,
                    successRate: 0.8,
                    estimatedTime: 15000
                },
                native_automation: {
                    name: 'Native Automation',
                    description: 'Use system native automation',
                    tools: ['system_tools'],
                    priority: 3,
                    successRate: 0.7,
                    estimatedTime: 10000
                },
                hybrid: {
                    name: 'Hybrid Approach',
                    description: 'Combine multiple automation methods',
                    tools: ['browser_automation', 'python_tools'],
                    priority: 4,
                    successRate: 0.8,
                    estimatedTime: 30000
                }
            },
            
            security: {
                python_tools: {
                    name: 'Python Security Tools',
                    description: 'Use Python-based security tools',
                    tools: ['python_tools'],
                    priority: 1,
                    successRate: 0.8,
                    estimatedTime: 25000
                },
                native_tools: {
                    name: 'Native Security Tools',
                    description: 'Use built-in system security tools',
                    tools: ['system_tools'],
                    priority: 2,
                    successRate: 0.6,
                    estimatedTime: 15000
                },
                custom_scripts: {
                    name: 'Custom Security Scripts',
                    description: 'Generate custom security scripts',
                    tools: ['python_tools', 'system_tools'],
                    priority: 3,
                    successRate: 0.7,
                    estimatedTime: 30000
                }
            }
        };

        this.fallbackMappings = {
            '404': ['mirror', 'browser_automation', 'search_and_scrape'],
            'timeout': ['mirror', 'browser_automation'],
            'permission_denied': ['gui', 'package_manager', 'portable'],
            'network_error': ['mirror', 'browser_automation'],
            'file_not_found': ['search_and_scrape', 'browser_automation'],
            'invalid_url': ['search_and_scrape', 'browser_automation'],
            'rate_limited': ['browser_automation', 'multiple_engines'],
            'captcha': ['browser_automation', 'selenium'],
            'javascript_required': ['browser_automation', 'selenium', 'puppeteer']
        };
    }

    /**
     * Generate multiple strategies for command execution
     * @param {object} analysis - Command analysis result
     * @returns {Array} Array of strategy objects
     */
    async generateStrategies(analysis) {
        try {
            const strategies = [];
            const intent = analysis.intent;
            const complexity = analysis.complexity;
            const requiredTools = analysis.requiredTools;
            const privilegeLevel = analysis.privilegeLevel;

            // Get base strategies for the intent
            const baseStrategies = this.strategyTemplates[intent] || this.strategyTemplates.download;
            
            // Generate primary strategies
            for (const [strategyKey, strategyTemplate] of Object.entries(baseStrategies)) {
                const strategy = this.createStrategy(strategyTemplate, analysis);
                
                // Adjust strategy based on analysis
                this.adjustStrategyForContext(strategy, analysis);
                
                strategies.push(strategy);
            }

            // Add fallback strategies based on context
            const fallbackStrategies = this.generateFallbackStrategies(analysis);
            strategies.push(...fallbackStrategies);

            // Sort by priority and success rate
            strategies.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return b.successRate - a.successRate;
            });

            // Limit to 5 strategies maximum
            return strategies.slice(0, 5);

        } catch (error) {
            console.error('[STRATEGY PLANNER] Error generating strategies:', error);
            return this.getDefaultStrategies(analysis);
        }
    }

    /**
     * Create a strategy object from template
     */
    createStrategy(template, analysis) {
        return {
            id: this.generateStrategyId(),
            name: template.name,
            description: template.description,
            tools: [...template.tools],
            priority: template.priority,
            successRate: template.successRate,
            estimatedTime: template.estimatedTime,
            
            // Dynamic properties
            originalInput: analysis.originalInput,
            intent: analysis.intent,
            complexity: analysis.complexity,
            privilegeLevel: analysis.privilegeLevel,
            
            // Execution properties
            parameters: this.generateStrategyParameters(template, analysis),
            fallbackTriggers: this.getFallbackTriggers(template),
            successCriteria: this.getSuccessCriteria(template),
            
            // Metadata
            createdAt: new Date(),
            attempts: 0,
            lastAttempt: null,
            successCount: 0,
            failureCount: 0
        };
    }

    /**
     * Adjust strategy based on analysis context
     */
    adjustStrategyForContext(strategy, analysis) {
        // Adjust for complexity
        if (analysis.complexity === 'complex') {
            strategy.estimatedTime *= 1.5;
            strategy.successRate *= 0.9;
        } else if (analysis.complexity === 'simple') {
            strategy.estimatedTime *= 0.7;
            strategy.successRate *= 1.1;
        }

        // Adjust for privilege level
        if (analysis.privilegeLevel === 'admin') {
            if (strategy.tools.includes('system_tools')) {
                strategy.successRate *= 1.2;
            }
        } else if (analysis.privilegeLevel === 'standard') {
            if (strategy.tools.includes('system_tools')) {
                strategy.successRate *= 0.8;
                strategy.priority += 2; // Lower priority for admin tools
            }
        }

        // Adjust for risk level
        if (analysis.riskLevel === 'high') {
            strategy.successCriteria.requireConfirmation = true;
        }

        // Adjust for constraints
        if (analysis.constraints.timeLimit === 'fast') {
            if (strategy.estimatedTime > 10000) {
                strategy.priority += 1; // Lower priority for slow strategies
            }
        }

        if (analysis.constraints.securityLevel === 'high') {
            strategy.parameters.verifyChecksums = true;
            strategy.parameters.useHTTPS = true;
        }
    }

    /**
     * Generate fallback strategies based on analysis
     */
    generateFallbackStrategies(analysis) {
        const fallbackStrategies = [];

        // Add research-based strategy
        if (analysis.complexity === 'complex' || analysis.confidence < 0.7) {
            fallbackStrategies.push({
                id: this.generateStrategyId(),
                name: 'AI Research Strategy',
                description: 'Use AI to research and find solutions',
                tools: ['web_fetch', 'browser_automation'],
                priority: 10,
                successRate: 0.6,
                estimatedTime: 45000,
                originalInput: analysis.originalInput,
                intent: analysis.intent,
                complexity: analysis.complexity,
                privilegeLevel: analysis.privilegeLevel,
                parameters: {
                    researchDepth: 'deep',
                    useAI: true,
                    maxResearchTime: 30000
                },
                fallbackTriggers: ['all_other_strategies_failed'],
                successCriteria: {
                    requireConfirmation: false,
                    minConfidence: 0.8
                },
                createdAt: new Date(),
                attempts: 0,
                lastAttempt: null,
                successCount: 0,
                failureCount: 0
            });
        }

        // Add emergency fallback
        fallbackStrategies.push({
            id: this.generateStrategyId(),
            name: 'Emergency Fallback',
            description: 'Manual intervention required',
            tools: ['manual'],
            priority: 100,
            successRate: 0.1,
            estimatedTime: 60000,
            originalInput: analysis.originalInput,
            intent: analysis.intent,
            complexity: analysis.complexity,
            privilegeLevel: analysis.privilegeLevel,
            parameters: {
                requireHuman: true,
                escalationLevel: 'high'
            },
            fallbackTriggers: ['all_strategies_failed'],
            successCriteria: {
                requireConfirmation: true,
                minConfidence: 0.5
            },
            createdAt: new Date(),
            attempts: 0,
            lastAttempt: null,
            successCount: 0,
            failureCount: 0
        });

        return fallbackStrategies;
    }

    /**
     * Generate strategy-specific parameters
     */
    generateStrategyParameters(template, analysis) {
        const parameters = {
            timeout: template.estimatedTime * 2,
            retries: 3,
            verifyChecksums: false,
            useHTTPS: true
        };

        // Add intent-specific parameters
        if (analysis.intent === 'download') {
            parameters.resumeCapability = true;
            parameters.chunkSize = 1024 * 1024; // 1MB chunks
        }

        if (analysis.intent === 'install') {
            parameters.silentMode = analysis.parameters.silent || false;
            parameters.createShortcuts = true;
        }

        if (analysis.intent === 'automate') {
            parameters.headless = true;
            parameters.waitForNetworkIdle = true;
        }

        // Add analysis parameters
        if (analysis.parameters.version) {
            parameters.version = analysis.parameters.version;
        }

        if (analysis.parameters.architecture) {
            parameters.architecture = analysis.parameters.architecture;
        }

        if (analysis.parameters.outputDir) {
            parameters.outputDir = analysis.parameters.outputDir;
        }

        return parameters;
    }

    /**
     * Get fallback triggers for a strategy
     */
    getFallbackTriggers(template) {
        const triggers = [];

        if (template.tools.includes('web_fetch')) {
            triggers.push('404', 'timeout', 'network_error', 'invalid_url');
        }

        if (template.tools.includes('browser_automation')) {
            triggers.push('captcha', 'javascript_required', 'rate_limited');
        }

        if (template.tools.includes('system_tools')) {
            triggers.push('permission_denied', 'file_not_found');
        }

        return triggers;
    }

    /**
     * Get success criteria for a strategy
     */
    getSuccessCriteria(template) {
        return {
            requireConfirmation: false,
            minConfidence: 0.7,
            maxExecutionTime: template.estimatedTime * 3,
            validateOutput: true
        };
    }

    /**
     * Generate unique strategy ID
     */
    generateStrategyId() {
        return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get strategies for specific error type
     */
    getStrategiesForError(errorType, analysis) {
        const fallbackKeys = this.fallbackMappings[errorType] || [];
        const strategies = [];

        for (const key of fallbackKeys) {
            // Find matching strategy template
            for (const intentStrategies of Object.values(this.strategyTemplates)) {
                if (intentStrategies[key]) {
                    const strategy = this.createStrategy(intentStrategies[key], analysis);
                    strategies.push(strategy);
                    break;
                }
            }
        }

        return strategies;
    }

    /**
     * Adapt strategy based on error context
     */
    adaptStrategy(strategy, errorContext) {
        const adaptedStrategy = { ...strategy };
        
        // Adjust based on error type
        if (errorContext.type === 'timeout') {
            adaptedStrategy.parameters.timeout *= 2;
            adaptedStrategy.estimatedTime *= 1.5;
        }

        if (errorContext.type === 'permission_denied') {
            adaptedStrategy.tools = adaptedStrategy.tools.filter(tool => tool !== 'system_tools');
            adaptedStrategy.tools.push('browser_automation');
            adaptedStrategy.priority += 1;
        }

        if (errorContext.type === '404') {
            adaptedStrategy.tools.push('search_and_scrape');
            adaptedStrategy.parameters.searchDepth = 'deep';
        }

        // Add error-specific parameters
        adaptedStrategy.parameters.lastError = errorContext;
        adaptedStrategy.parameters.adaptationCount = (adaptedStrategy.parameters.adaptationCount || 0) + 1;

        return adaptedStrategy;
    }

    /**
     * Get default strategies when generation fails
     */
    getDefaultStrategies(analysis) {
        return [
            {
                id: this.generateStrategyId(),
                name: 'Default Web Fetch',
                description: 'Basic web fetching strategy',
                tools: ['web_fetch'],
                priority: 1,
                successRate: 0.5,
                estimatedTime: 10000,
                originalInput: analysis.originalInput,
                intent: analysis.intent,
                complexity: analysis.complexity,
                privilegeLevel: analysis.privilegeLevel,
                parameters: {
                    timeout: 20000,
                    retries: 3,
                    verifyChecksums: false,
                    useHTTPS: true
                },
                fallbackTriggers: ['404', 'timeout', 'network_error'],
                successCriteria: {
                    requireConfirmation: false,
                    minConfidence: 0.5,
                    maxExecutionTime: 30000,
                    validateOutput: true
                },
                createdAt: new Date(),
                attempts: 0,
                lastAttempt: null,
                successCount: 0,
                failureCount: 0
            }
        ];
    }
}

module.exports = StrategyPlanner;
