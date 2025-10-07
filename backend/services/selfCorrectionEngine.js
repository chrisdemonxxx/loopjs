/**
 * Self-Correction Engine
 * Analyzes failures and dynamically adjusts strategies
 */

const OllamaAICommandProcessor = require('./ollamaAICommandProcessor');
const ErrorAnalyzer = require('./errorAnalyzer');
const WebFetchService = require('./webFetchService');
const BrowserAutomationService = require('./browserAutomationService');

class SelfCorrectionEngine {
    constructor() {
        this.ollamaProcessor = new OllamaAICommandProcessor();
        this.errorAnalyzer = new ErrorAnalyzer();
        this.webFetchService = new WebFetchService();
        this.browserAutomationService = new BrowserAutomationService();
        
        this.correctionHistory = new Map();
        this.successfulPatterns = new Map();
        this.failurePatterns = new Map();
        this.learningData = new Map();
    }

    /**
     * Analyze failure and generate corrected strategy
     * @param {object} failureContext - Context of the failure
     * @returns {object} Correction result
     */
    async analyzeAndCorrect(failureContext) {
        try {
            console.log('[SELF-CORRECTION] Analyzing failure and generating correction...');

            const {
                originalCommand,
                failedStrategy,
                error,
                attempts,
                clientInfo,
                context
            } = failureContext;

            // Step 1: Analyze the error
            const errorAnalysis = await this.errorAnalyzer.analyzeError(error, {
                strategy: failedStrategy,
                command: originalCommand,
                attempts: attempts,
                clientInfo: clientInfo
            });

            // Step 2: Research alternative solutions
            const researchResult = await this.researchAlternativeSolutions(
                originalCommand,
                errorAnalysis,
                attempts
            );

            // Step 3: Generate corrected strategy
            const correctedStrategy = await this.generateCorrectedStrategy(
                originalCommand,
                failedStrategy,
                errorAnalysis,
                researchResult,
                context
            );

            // Step 4: Validate the correction
            const validationResult = await this.validateCorrection(
                correctedStrategy,
                errorAnalysis
            );

            // Step 5: Learn from this correction
            this.learnFromCorrection(failureContext, errorAnalysis, correctedStrategy);

            return {
                success: true,
                originalStrategy: failedStrategy,
                errorAnalysis: errorAnalysis,
                researchResult: researchResult,
                correctedStrategy: correctedStrategy,
                validationResult: validationResult,
                confidence: this.calculateConfidence(correctedStrategy, errorAnalysis),
                recommendations: this.generateRecommendations(errorAnalysis, correctedStrategy)
            };

        } catch (error) {
            console.error('[SELF-CORRECTION] Correction failed:', error);
            return {
                success: false,
                error: error.message,
                fallbackStrategy: this.getFallbackStrategy(failureContext)
            };
        }
    }

    /**
     * Research alternative solutions using AI and web resources
     */
    async researchAlternativeSolutions(originalCommand, errorAnalysis, attempts) {
        try {
            console.log('[SELF-CORRECTION] Researching alternative solutions...');

            const researchQueries = this.generateResearchQueries(originalCommand, errorAnalysis);
            const researchResults = [];

            // Research using AI
            for (const query of researchQueries) {
                try {
                    const aiResult = await this.ollamaProcessor.processCommandWithAI(
                        `Research solution for: ${query}. Previous attempts failed: ${attempts.map(a => a.error).join(', ')}`
                    );
                    
                    if (aiResult.success) {
                        researchResults.push({
                            source: 'ai',
                            query: query,
                            result: aiResult,
                            confidence: 0.7
                        });
                    }
                } catch (error) {
                    console.log(`[SELF-CORRECTION] AI research failed for query: ${query}`);
                }
            }

            // Research using web search
            try {
                const webResults = await this.webFetchService.searchForDownloadUrls(
                    `${originalCommand} solution alternative download`
                );
                
                if (webResults.length > 0) {
                    researchResults.push({
                        source: 'web',
                        query: 'web search',
                        result: webResults,
                        confidence: 0.6
                    });
                }
            } catch (error) {
                console.log('[SELF-CORRECTION] Web research failed:', error.message);
            }

            // Research using browser automation
            try {
                const initResult = await this.browserAutomationService.initialize();
                if (initResult.success) {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(originalCommand + ' download solution')}`;
                    const navResult = await this.browserAutomationService.navigateToUrl(searchUrl);
                    
                    if (navResult.success) {
                        const linksResult = await this.browserAutomationService.extractDownloadLinks();
                        
                        if (linksResult.success && linksResult.links.length > 0) {
                            researchResults.push({
                                source: 'browser',
                                query: 'browser search',
                                result: linksResult.links,
                                confidence: 0.8
                            });
                        }
                    }
                }
            } catch (error) {
                console.log('[SELF-CORRECTION] Browser research failed:', error.message);
            }

            return {
                success: true,
                results: researchResults,
                totalResults: researchResults.length,
                bestResult: this.selectBestResearchResult(researchResults)
            };

        } catch (error) {
            console.error('[SELF-CORRECTION] Research failed:', error);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Generate research queries based on command and error
     */
    generateResearchQueries(originalCommand, errorAnalysis) {
        const queries = [];

        // Base query
        queries.push(`${originalCommand} solution`);

        // Error-specific queries
        if (errorAnalysis.category === 'file_not_found') {
            queries.push(`${originalCommand} alternative download`);
            queries.push(`${originalCommand} mirror site`);
            queries.push(`${originalCommand} official website`);
        }

        if (errorAnalysis.category === 'permission') {
            queries.push(`${originalCommand} portable version`);
            queries.push(`${originalCommand} no admin required`);
            queries.push(`${originalCommand} user install`);
        }

        if (errorAnalysis.category === 'network') {
            queries.push(`${originalCommand} offline installer`);
            queries.push(`${originalCommand} direct download`);
            queries.push(`${originalCommand} torrent magnet`);
        }

        if (errorAnalysis.category === 'captcha') {
            queries.push(`${originalCommand} bypass captcha`);
            queries.push(`${originalCommand} automated download`);
            queries.push(`${originalCommand} script download`);
        }

        // Add generic fallback queries
        queries.push(`${originalCommand} working method`);
        queries.push(`${originalCommand} 2024 download`);
        queries.push(`${originalCommand} latest version`);

        return queries.slice(0, 5); // Limit to 5 queries
    }

    /**
     * Generate corrected strategy based on analysis and research
     */
    async generateCorrectedStrategy(originalCommand, failedStrategy, errorAnalysis, researchResult, context) {
        try {
            console.log('[SELF-CORRECTION] Generating corrected strategy...');

            const correctedStrategy = {
                ...failedStrategy,
                id: `corrected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: `Corrected ${failedStrategy.name}`,
                description: `Corrected strategy based on error analysis: ${errorAnalysis.category}`,
                priority: failedStrategy.priority + 1, // Lower priority than original
                successRate: this.adjustSuccessRate(failedStrategy.successRate, errorAnalysis),
                estimatedTime: this.adjustEstimatedTime(failedStrategy.estimatedTime, errorAnalysis),
                
                // Error-specific adjustments
                parameters: this.adjustParameters(failedStrategy.parameters, errorAnalysis),
                tools: this.adjustTools(failedStrategy.tools, errorAnalysis),
                
                // Research-based improvements
                researchInsights: researchResult.bestResult,
                errorContext: errorAnalysis,
                
                // Metadata
                correctionCount: (failedStrategy.correctionCount || 0) + 1,
                originalStrategyId: failedStrategy.id,
                correctedAt: new Date(),
                confidence: this.calculateStrategyConfidence(errorAnalysis, researchResult)
            };

            // Apply specific corrections based on error type
            this.applyErrorSpecificCorrections(correctedStrategy, errorAnalysis);

            // Apply research-based improvements
            this.applyResearchImprovements(correctedStrategy, researchResult);

            return correctedStrategy;

        } catch (error) {
            console.error('[SELF-CORRECTION] Strategy generation failed:', error);
            return failedStrategy; // Return original strategy if correction fails
        }
    }

    /**
     * Adjust success rate based on error analysis
     */
    adjustSuccessRate(originalRate, errorAnalysis) {
        let adjustment = 0;

        // Increase rate for well-understood errors
        if (errorAnalysis.category === 'file_not_found') adjustment += 0.1;
        if (errorAnalysis.category === 'network') adjustment += 0.05;
        if (errorAnalysis.category === 'permission') adjustment -= 0.1;

        // Decrease rate for complex errors
        if (errorAnalysis.severity === 'high') adjustment -= 0.15;
        if (errorAnalysis.severity === 'medium') adjustment -= 0.05;

        return Math.max(0.1, Math.min(0.9, originalRate + adjustment));
    }

    /**
     * Adjust estimated time based on error analysis
     */
    adjustEstimatedTime(originalTime, errorAnalysis) {
        let multiplier = 1.0;

        // Increase time for complex corrections
        if (errorAnalysis.category === 'captcha') multiplier = 1.5;
        if (errorAnalysis.category === 'permission') multiplier = 1.3;
        if (errorAnalysis.category === 'network') multiplier = 1.2;

        return Math.round(originalTime * multiplier);
    }

    /**
     * Adjust parameters based on error analysis
     */
    adjustParameters(originalParams, errorAnalysis) {
        const adjustedParams = { ...originalParams };

        // Error-specific parameter adjustments
        if (errorAnalysis.category === 'timeout') {
            adjustedParams.timeout = (adjustedParams.timeout || 30000) * 2;
            adjustedParams.retries = (adjustedParams.retries || 3) + 1;
        }

        if (errorAnalysis.category === 'permission') {
            adjustedParams.silentMode = false; // Try GUI mode
            adjustedParams.requireElevation = false;
        }

        if (errorAnalysis.category === 'file_not_found') {
            adjustedParams.searchDepth = 'deep';
            adjustedParams.useMirrors = true;
        }

        if (errorAnalysis.category === 'captcha') {
            adjustedParams.headless = false; // Might need visual mode
            adjustedParams.waitForNetworkIdle = true;
        }

        return adjustedParams;
    }

    /**
     * Adjust tools based on error analysis
     */
    adjustTools(originalTools, errorAnalysis) {
        const adjustedTools = [...originalTools];

        // Add tools based on error type
        if (errorAnalysis.category === 'file_not_found' && !adjustedTools.includes('browser_automation')) {
            adjustedTools.push('browser_automation');
        }

        if (errorAnalysis.category === 'captcha' && !adjustedTools.includes('browser_automation')) {
            adjustedTools.push('browser_automation');
        }

        if (errorAnalysis.category === 'permission' && adjustedTools.includes('system_tools')) {
            adjustedTools.splice(adjustedTools.indexOf('system_tools'), 1);
            adjustedTools.push('browser_automation');
        }

        return adjustedTools;
    }

    /**
     * Apply error-specific corrections
     */
    applyErrorSpecificCorrections(strategy, errorAnalysis) {
        switch (errorAnalysis.category) {
            case 'file_not_found':
                strategy.parameters.useAlternativeUrls = true;
                strategy.parameters.searchEngines = ['google', 'bing', 'duckduckgo'];
                break;

            case 'permission':
                strategy.parameters.usePortableVersion = true;
                strategy.parameters.installLocation = 'user_profile';
                break;

            case 'network':
                strategy.parameters.useProxy = true;
                strategy.parameters.retryDelay = 5000;
                break;

            case 'captcha':
                strategy.parameters.useStealthMode = true;
                strategy.parameters.randomizeUserAgent = true;
                break;

            case 'rate_limited':
                strategy.parameters.delayBetweenRequests = 10000;
                strategy.parameters.useRotatingProxies = true;
                break;
        }
    }

    /**
     * Apply research-based improvements
     */
    applyResearchImprovements(strategy, researchResult) {
        if (researchResult.bestResult) {
            const bestResult = researchResult.bestResult;

            if (bestResult.source === 'web' && bestResult.result.length > 0) {
                strategy.parameters.alternativeUrls = bestResult.result.slice(0, 3);
            }

            if (bestResult.source === 'browser' && bestResult.result.length > 0) {
                strategy.parameters.downloadLinks = bestResult.result.slice(0, 5);
            }

            if (bestResult.source === 'ai' && bestResult.result.command) {
                strategy.parameters.aiSuggestion = bestResult.result.command;
            }
        }
    }

    /**
     * Validate the correction
     */
    async validateCorrection(correctedStrategy, errorAnalysis) {
        try {
            const validation = {
                isValid: true,
                issues: [],
                warnings: [],
                suggestions: []
            };

            // Check if strategy addresses the original error
            if (!this.strategyAddressesError(correctedStrategy, errorAnalysis)) {
                validation.issues.push('Strategy does not address the original error');
                validation.isValid = false;
            }

            // Check if tools are appropriate
            if (correctedStrategy.tools.length === 0) {
                validation.issues.push('No tools specified');
                validation.isValid = false;
            }

            // Check parameter consistency
            if (correctedStrategy.parameters.timeout < 1000) {
                validation.warnings.push('Timeout seems too short');
            }

            // Check success rate reasonableness
            if (correctedStrategy.successRate < 0.1) {
                validation.warnings.push('Success rate is very low');
            }

            // Generate suggestions
            if (errorAnalysis.category === 'file_not_found') {
                validation.suggestions.push('Consider adding more alternative URLs');
            }

            if (errorAnalysis.category === 'permission') {
                validation.suggestions.push('Consider using portable or user-installable versions');
            }

            return validation;

        } catch (error) {
            return {
                isValid: false,
                issues: [`Validation failed: ${error.message}`],
                warnings: [],
                suggestions: []
            };
        }
    }

    /**
     * Check if strategy addresses the original error
     */
    strategyAddressesError(strategy, errorAnalysis) {
        const errorCategory = errorAnalysis.category;

        switch (errorCategory) {
            case 'file_not_found':
                return strategy.tools.includes('browser_automation') || 
                       strategy.parameters.useAlternativeUrls ||
                       strategy.parameters.alternativeUrls?.length > 0;

            case 'permission':
                return !strategy.tools.includes('system_tools') ||
                       strategy.parameters.usePortableVersion ||
                       strategy.parameters.installLocation === 'user_profile';

            case 'network':
                return strategy.parameters.timeout > 30000 ||
                       strategy.parameters.retries > 3 ||
                       strategy.parameters.useProxy;

            case 'captcha':
                return strategy.tools.includes('browser_automation') ||
                       strategy.parameters.useStealthMode;

            default:
                return true; // Assume it addresses unknown errors
        }
    }

    /**
     * Calculate strategy confidence
     */
    calculateStrategyConfidence(errorAnalysis, researchResult) {
        let confidence = 0.5; // Base confidence

        // Increase confidence based on error understanding
        if (errorAnalysis.category !== 'unknown') confidence += 0.2;
        if (errorAnalysis.suggestions.length > 0) confidence += 0.1;

        // Increase confidence based on research results
        if (researchResult.totalResults > 0) confidence += 0.1;
        if (researchResult.bestResult) confidence += 0.1;

        return Math.min(0.9, confidence);
    }

    /**
     * Calculate overall confidence
     */
    calculateConfidence(correctedStrategy, errorAnalysis) {
        return correctedStrategy.confidence || 0.5;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(errorAnalysis, correctedStrategy) {
        const recommendations = [];

        // Add error-specific recommendations
        recommendations.push(...errorAnalysis.suggestions);

        // Add strategy-specific recommendations
        if (correctedStrategy.confidence < 0.7) {
            recommendations.push('Consider manual verification before execution');
        }

        if (correctedStrategy.estimatedTime > 60000) {
            recommendations.push('This strategy may take longer than usual');
        }

        return recommendations;
    }

    /**
     * Learn from correction
     */
    learnFromCorrection(failureContext, errorAnalysis, correctedStrategy) {
        try {
            const learningKey = `${failureContext.originalCommand}_${errorAnalysis.category}`;
            
            const learningEntry = {
                timestamp: new Date(),
                originalCommand: failureContext.originalCommand,
                errorCategory: errorAnalysis.category,
                failedStrategy: failureContext.failedStrategy,
                correctedStrategy: correctedStrategy,
                success: false, // Will be updated when strategy is executed
                confidence: correctedStrategy.confidence
            };

            this.learningData.set(`${learningKey}_${Date.now()}`, learningEntry);

            // Update patterns
            this.updateFailurePatterns(failureContext, errorAnalysis);
            this.updateSuccessPatterns(correctedStrategy, errorAnalysis);

        } catch (error) {
            console.error('[SELF-CORRECTION] Learning failed:', error);
        }
    }

    /**
     * Update failure patterns
     */
    updateFailurePatterns(failureContext, errorAnalysis) {
        const patternKey = `${failureContext.originalCommand}_${errorAnalysis.category}`;
        
        if (!this.failurePatterns.has(patternKey)) {
            this.failurePatterns.set(patternKey, {
                count: 0,
                strategies: [],
                lastSeen: new Date()
            });
        }

        const pattern = this.failurePatterns.get(patternKey);
        pattern.count++;
        pattern.strategies.push(failureContext.failedStrategy.name);
        pattern.lastSeen = new Date();
    }

    /**
     * Update success patterns
     */
    updateSuccessPatterns(correctedStrategy, errorAnalysis) {
        const patternKey = `${errorAnalysis.category}_${correctedStrategy.tools.join('_')}`;
        
        if (!this.successfulPatterns.has(patternKey)) {
            this.successfulPatterns.set(patternKey, {
                count: 0,
                strategies: [],
                lastSeen: new Date()
            });
        }

        const pattern = this.successfulPatterns.get(patternKey);
        pattern.count++;
        pattern.strategies.push(correctedStrategy.name);
        pattern.lastSeen = new Date();
    }

    /**
     * Select best research result
     */
    selectBestResearchResult(researchResults) {
        if (researchResults.length === 0) return null;

        // Sort by confidence and source priority
        const sortedResults = researchResults.sort((a, b) => {
            const sourcePriority = { 'browser': 3, 'ai': 2, 'web': 1 };
            const aPriority = sourcePriority[a.source] || 0;
            const bPriority = sourcePriority[b.source] || 0;
            
            if (aPriority !== bPriority) return bPriority - aPriority;
            return b.confidence - a.confidence;
        });

        return sortedResults[0];
    }

    /**
     * Get fallback strategy when correction fails
     */
    getFallbackStrategy(failureContext) {
        return {
            id: `fallback_${Date.now()}`,
            name: 'Emergency Fallback',
            description: 'Manual intervention required',
            tools: ['manual'],
            priority: 100,
            successRate: 0.1,
            estimatedTime: 300000, // 5 minutes
            parameters: {
                requireHuman: true,
                escalationLevel: 'high'
            },
            fallbackTriggers: ['all_strategies_failed'],
            successCriteria: {
                requireConfirmation: true,
                minConfidence: 0.5
            }
        };
    }

    /**
     * Get correction statistics
     */
    getCorrectionStatistics() {
        return {
            totalCorrections: this.learningData.size,
            failurePatterns: Object.fromEntries(this.failurePatterns),
            successfulPatterns: Object.fromEntries(this.successfulPatterns),
            topErrorCategories: this.getTopErrorCategories(),
            correctionSuccessRate: this.calculateCorrectionSuccessRate()
        };
    }

    /**
     * Get top error categories
     */
    getTopErrorCategories() {
        const categories = {};
        
        for (const [key, pattern] of this.failurePatterns.entries()) {
            const category = key.split('_').pop();
            categories[category] = (categories[category] || 0) + pattern.count;
        }

        return Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    }

    /**
     * Calculate correction success rate
     */
    calculateCorrectionSuccessRate() {
        const entries = Array.from(this.learningData.values());
        if (entries.length === 0) return 0;

        const successful = entries.filter(entry => entry.success).length;
        return successful / entries.length;
    }
}

module.exports = SelfCorrectionEngine;
