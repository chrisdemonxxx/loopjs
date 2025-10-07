/**
 * Intelligent Command Analyzer
 * Analyzes user input to extract intent, complexity, and required tools
 */

class IntelligentCommandAnalyzer {
    constructor() {
        this.intentPatterns = {
            download: [
                /download/i, /get/i, /fetch/i, /pull/i, /grab/i,
                /install/i, /setup/i, /deploy/i
            ],
            network: [
                /ping/i, /nslookup/i, /tracert/i, /traceroute/i,
                /telnet/i, /netstat/i, /ipconfig/i, /ifconfig/i,
                /connect/i, /test.*connection/i, /check.*network/i
            ],
            search: [
                /search/i, /find/i, /look for/i, /locate/i,
                /query/i, /bing/i, /yahoo/i
            ],
            execute: [
                /run/i, /execute/i, /start/i, /launch/i,
                /open/i, /launch/i, /begin/i
            ],
            automate: [
                /automate/i, /script/i, /batch/i, /workflow/i,
                /sequence/i, /chain/i, /pipeline/i
            ],
            analyze: [
                /analyze/i, /examine/i, /inspect/i, /check/i,
                /audit/i, /scan/i, /monitor/i
            ],
            modify: [
                /edit/i, /change/i, /modify/i, /update/i,
                /configure/i, /set/i, /adjust/i
            ],
            security: [
                /hack/i, /crack/i, /bypass/i, /exploit/i,
                /penetrate/i, /intrude/i, /breach/i
            ]
        };

        this.complexityIndicators = {
            simple: [
                /single/i, /one/i, /basic/i, /simple/i,
                /quick/i, /fast/i, /direct/i
            ],
            moderate: [
                /multiple/i, /several/i, /few/i, /some/i,
                /with/i, /and/i, /then/i
            ],
            complex: [
                /all/i, /every/i, /comprehensive/i, /complete/i,
                /advanced/i, /complex/i, /sophisticated/i,
                /workflow/i, /pipeline/i, /sequence/i
            ]
        };

        this.toolRequirements = {
            web_fetch: [
                /download/i, /get/i, /fetch/i, /pull/i,
                /url/i, /http/i, /https/i, /website/i
            ],
            browser_automation: [
                /browser/i, /chrome/i, /firefox/i, /edge/i,
                /selenium/i, /automate/i, /click/i, /form/i,
                /javascript/i, /js/i, /spa/i
            ],
            python_tools: [
                /python/i, /selenium/i, /requests/i, /beautifulsoup/i,
                /scrapy/i, /brute/i, /crack/i, /exploit/i
            ],
            system_tools: [
                /install/i, /setup/i, /configure/i, /service/i,
                /registry/i, /system/i, /admin/i
            ]
        };

        this.privilegeRequirements = {
            admin: [
                /install/i, /setup/i, /service/i, /registry/i,
                /system/i, /admin/i, /root/i, /sudo/i,
                /silent/i, /quiet/i, /unattended/i
            ],
            elevated: [
                /modify/i, /change/i, /update/i, /configure/i,
                /permission/i, /access/i, /privilege/i
            ],
            standard: [
                /read/i, /view/i, /check/i, /list/i,
                /show/i, /display/i, /get/i
            ]
        };
    }

    /**
     * Analyze user input to extract comprehensive command information
     * @param {string} userInput - The user's command input
     * @param {object} clientInfo - Client information and context
     * @returns {object} Analysis result
     */
    async analyze(userInput, clientInfo = {}) {
        try {
            const analysis = {
                originalInput: userInput,
                timestamp: new Date(),
                clientInfo: clientInfo,
                
                // Core analysis
                intent: this.extractIntent(userInput),
                complexity: this.determineComplexity(userInput),
                requiredTools: this.determineRequiredTools(userInput),
                privilegeLevel: this.determinePrivilegeLevel(userInput),
                
                // Context analysis
                targets: this.extractTargets(userInput),
                parameters: this.extractParameters(userInput),
                constraints: this.extractConstraints(userInput),
                
                // Strategy hints
                preferredApproach: this.suggestPreferredApproach(userInput),
                fallbackOptions: this.identifyFallbackOptions(userInput),
                
                // Risk assessment
                riskLevel: this.assessRiskLevel(userInput),
                safetyNotes: this.generateSafetyNotes(userInput),
                
                // Execution context
                estimatedTime: this.estimateExecutionTime(userInput),
                resourceRequirements: this.assessResourceRequirements(userInput)
            };

            // Add confidence scores
            analysis.confidence = this.calculateConfidence(analysis);
            
            return analysis;
        } catch (error) {
            console.error('[INTELLIGENT ANALYZER] Error analyzing command:', error);
            return this.getDefaultAnalysis(userInput, clientInfo);
        }
    }

    /**
     * Extract the primary intent from user input
     */
    extractIntent(userInput) {
        const intents = [];
        
        for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(userInput)) {
                    intents.push(intent);
                    break;
                }
            }
        }

        // Return primary intent (most specific)
        if (intents.includes('security')) return 'security';
        if (intents.includes('network')) return 'network';
        if (intents.includes('automate')) return 'automate';
        if (intents.includes('download')) return 'download';
        if (intents.includes('search')) return 'search';
        if (intents.includes('execute')) return 'execute';
        if (intents.includes('analyze')) return 'analyze';
        if (intents.includes('modify')) return 'modify';
        
        return 'general';
    }

    /**
     * Determine command complexity level
     */
    determineComplexity(userInput) {
        const words = userInput.toLowerCase().split(/\s+/);
        const wordCount = words.length;
        
        // Check for complexity indicators
        for (const [level, patterns] of Object.entries(this.complexityIndicators)) {
            for (const pattern of patterns) {
                if (pattern.test(userInput)) {
                    return level;
                }
            }
        }

        // Fallback based on word count and structure
        if (wordCount <= 3) return 'simple';
        if (wordCount <= 8) return 'moderate';
        return 'complex';
    }

    /**
     * Determine which tools are required
     */
    determineRequiredTools(userInput) {
        const tools = [];
        
        for (const [tool, patterns] of Object.entries(this.toolRequirements)) {
            for (const pattern of patterns) {
                if (pattern.test(userInput)) {
                    tools.push(tool);
                    break;
                }
            }
        }

        // Default to web_fetch if no specific tools identified
        if (tools.length === 0) {
            tools.push('web_fetch');
        }

        return tools;
    }

    /**
     * Determine required privilege level
     */
    determinePrivilegeLevel(userInput) {
        for (const [level, patterns] of Object.entries(this.privilegeRequirements)) {
            for (const pattern of patterns) {
                if (pattern.test(userInput)) {
                    return level;
                }
            }
        }
        
        return 'standard';
    }

    /**
     * Extract targets from user input
     */
    extractTargets(userInput) {
        const targets = [];
        
        // URLs
        const urlPattern = /(https?:\/\/[^\s]+)/gi;
        const urls = userInput.match(urlPattern);
        if (urls) targets.push(...urls.map(url => ({ type: 'url', value: url })));
        
        // Applications/Software
        const appPattern = /\b(chrome|firefox|opera|edge|vscode|notepad|calculator|word|excel|powerpoint)\b/gi;
        const apps = userInput.match(appPattern);
        if (apps) targets.push(...apps.map(app => ({ type: 'application', value: app })));
        
        // Files/Paths
        const filePattern = /\b([a-zA-Z]:\\[^\s]+|\/[^\s]+|\.[a-zA-Z0-9]+)\b/gi;
        const files = userInput.match(filePattern);
        if (files) targets.push(...files.map(file => ({ type: 'file', value: file })));
        
        // Keywords that might be targets
        const keywords = userInput.split(/\s+/).filter(word => 
            word.length > 3 && 
            !this.isCommonWord(word) &&
            !word.match(/^(the|and|or|but|for|with|from|to|in|on|at|by)$/i)
        );
        
        if (keywords.length > 0) {
            targets.push({ type: 'keyword', value: keywords[0] });
        }
        
        return targets;
    }

    /**
     * Extract parameters from user input
     */
    extractParameters(userInput) {
        const parameters = {};
        
        // Silent/quiet installation
        if (/silent|quiet|unattended/i.test(userInput)) {
            parameters.silent = true;
        }
        
        // Specific version
        const versionMatch = userInput.match(/version\s+([0-9.]+)/i);
        if (versionMatch) {
            parameters.version = versionMatch[1];
        }
        
        // Specific architecture
        if (/x64|64-bit|64bit/i.test(userInput)) {
            parameters.architecture = 'x64';
        } else if (/x86|32-bit|32bit/i.test(userInput)) {
            parameters.architecture = 'x86';
        }
        
        // Output directory
        const outputMatch = userInput.match(/to\s+([^\s]+)/i);
        if (outputMatch) {
            parameters.outputDir = outputMatch[1];
        }
        
        return parameters;
    }

    /**
     * Extract constraints from user input
     */
    extractConstraints(userInput) {
        const constraints = {};
        
        // Time constraints
        if (/quick|fast|immediately/i.test(userInput)) {
            constraints.timeLimit = 'fast';
        }
        
        // Size constraints
        if (/small|lightweight|minimal/i.test(userInput)) {
            constraints.sizeLimit = 'small';
        }
        
        // Security constraints
        if (/secure|safe|trusted/i.test(userInput)) {
            constraints.securityLevel = 'high';
        }
        
        return constraints;
    }

    /**
     * Suggest preferred approach based on analysis
     */
    suggestPreferredApproach(userInput) {
        const intent = this.extractIntent(userInput);
        const complexity = this.determineComplexity(userInput);
        
        if (intent === 'download' && complexity === 'simple') {
            return 'direct_download';
        } else if (intent === 'download' && complexity === 'complex') {
            return 'multi_strategy';
        } else if (intent === 'automate') {
            return 'browser_automation';
        } else if (intent === 'security') {
            return 'python_tools';
        }
        
        return 'web_fetch';
    }

    /**
     * Identify fallback options
     */
    identifyFallbackOptions(userInput) {
        const options = [];
        const intent = this.extractIntent(userInput);
        
        if (intent === 'download') {
            options.push('mirror_sites', 'alternative_urls', 'browser_automation', 'package_managers');
        } else if (intent === 'search') {
            options.push('alternative_search_engines', 'direct_queries', 'api_endpoints');
        } else if (intent === 'automate') {
            options.push('selenium', 'puppeteer', 'native_automation');
        }
        
        return options;
    }

    /**
     * Assess risk level
     */
    assessRiskLevel(userInput) {
        if (this.intentPatterns.security.some(pattern => pattern.test(userInput))) {
            return 'high';
        } else if (this.privilegeRequirements.admin.some(pattern => pattern.test(userInput))) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Generate safety notes
     */
    generateSafetyNotes(userInput) {
        const notes = [];
        
        if (this.assessRiskLevel(userInput) === 'high') {
            notes.push('High-risk operation detected. Ensure proper authorization.');
        }
        
        if (this.determinePrivilegeLevel(userInput) === 'admin') {
            notes.push('Requires administrative privileges.');
        }
        
        if (/silent|quiet/i.test(userInput)) {
            notes.push('Silent installation may not show progress indicators.');
        }
        
        return notes;
    }

    /**
     * Estimate execution time
     */
    estimateExecutionTime(userInput) {
        const complexity = this.determineComplexity(userInput);
        const tools = this.determineRequiredTools(userInput);
        
        let baseTime = 5000; // 5 seconds base
        
        if (complexity === 'simple') baseTime = 2000;
        else if (complexity === 'moderate') baseTime = 10000;
        else if (complexity === 'complex') baseTime = 30000;
        
        if (tools.includes('browser_automation')) baseTime += 15000;
        if (tools.includes('python_tools')) baseTime += 20000;
        
        return baseTime;
    }

    /**
     * Assess resource requirements
     */
    assessResourceRequirements(userInput) {
        const requirements = {
            memory: 'low',
            cpu: 'low',
            disk: 'low',
            network: 'medium'
        };
        
        const tools = this.determineRequiredTools(userInput);
        
        if (tools.includes('browser_automation')) {
            requirements.memory = 'high';
            requirements.cpu = 'medium';
        }
        
        if (tools.includes('python_tools')) {
            requirements.memory = 'medium';
            requirements.disk = 'medium';
        }
        
        return requirements;
    }

    /**
     * Calculate confidence score for the analysis
     */
    calculateConfidence(analysis) {
        let confidence = 0.5; // Base confidence
        
        // Increase confidence based on clear patterns
        if (analysis.intent !== 'general') confidence += 0.2;
        if (analysis.targets.length > 0) confidence += 0.1;
        if (analysis.parameters && Object.keys(analysis.parameters).length > 0) confidence += 0.1;
        if (analysis.complexity !== 'complex') confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Check if word is a common word
     */
    isCommonWord(word) {
        const commonWords = [
            'the', 'and', 'or', 'but', 'for', 'with', 'from', 'to', 'in', 'on', 'at', 'by',
            'this', 'that', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
            'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'must', 'shall'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    /**
     * Get default analysis when parsing fails
     */
    getDefaultAnalysis(userInput, clientInfo) {
        return {
            originalInput: userInput,
            timestamp: new Date(),
            clientInfo: clientInfo,
            intent: 'general',
            complexity: 'moderate',
            requiredTools: ['web_fetch'],
            privilegeLevel: 'standard',
            targets: [],
            parameters: {},
            constraints: {},
            preferredApproach: 'web_fetch',
            fallbackOptions: ['alternative_urls'],
            riskLevel: 'low',
            safetyNotes: [],
            estimatedTime: 10000,
            resourceRequirements: {
                memory: 'low',
                cpu: 'low',
                disk: 'low',
                network: 'medium'
            },
            confidence: 0.3
        };
    }
}

module.exports = IntelligentCommandAnalyzer;
