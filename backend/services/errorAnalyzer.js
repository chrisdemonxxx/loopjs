/**
 * Error Analyzer
 * Categorizes errors and suggests alternative approaches
 */

class ErrorAnalyzer {
    constructor() {
        this.errorPatterns = {
            network: {
                patterns: [
                    /timeout/i,
                    /connection.*refused/i,
                    /network.*error/i,
                    /dns.*error/i,
                    /host.*unreachable/i,
                    /socket.*hang.*up/i,
                    /econnreset/i,
                    /enotfound/i
                ],
                category: 'network',
                severity: 'medium',
                suggestions: [
                    'Try alternative URLs or mirrors',
                    'Use browser automation to bypass network restrictions',
                    'Check internet connectivity',
                    'Retry with increased timeout'
                ]
            },
            
            permission: {
                patterns: [
                    /permission.*denied/i,
                    /access.*denied/i,
                    /unauthorized/i,
                    /forbidden/i,
                    /403/i,
                    /401/i,
                    /eacces/i,
                    /eperm/i
                ],
                category: 'permission',
                severity: 'high',
                suggestions: [
                    'Run with elevated privileges',
                    'Use GUI installation instead of silent',
                    'Check file/folder permissions',
                    'Try portable version'
                ]
            },
            
            file_not_found: {
                patterns: [
                    /404/i,
                    /not.*found/i,
                    /file.*not.*found/i,
                    /enoent/i,
                    /path.*not.*found/i,
                    /does.*not.*exist/i
                ],
                category: 'file_not_found',
                severity: 'medium',
                suggestions: [
                    'Search for alternative download URLs',
                    'Use browser automation to find correct links',
                    'Check if URL is still valid',
                    'Try different file versions'
                ]
            },
            
            invalid_url: {
                patterns: [
                    /invalid.*url/i,
                    /malformed.*url/i,
                    /url.*parse.*error/i,
                    /invalid.*uri/i
                ],
                category: 'invalid_url',
                severity: 'low',
                suggestions: [
                    'Validate and fix URL format',
                    'Use URL resolution service',
                    'Search for correct URL format'
                ]
            },
            
            rate_limited: {
                patterns: [
                    /rate.*limit/i,
                    /too.*many.*requests/i,
                    /429/i,
                    /throttled/i,
                    /quota.*exceeded/i
                ],
                category: 'rate_limited',
                severity: 'medium',
                suggestions: [
                    'Wait and retry after delay',
                    'Use browser automation with delays',
                    'Try different IP or user agent',
                    'Use alternative download sources'
                ]
            },
            
            captcha: {
                patterns: [
                    /captcha/i,
                    /recaptcha/i,
                    /hcaptcha/i,
                    /verification.*required/i,
                    /robot.*check/i
                ],
                category: 'captcha',
                severity: 'high',
                suggestions: [
                    'Use browser automation to handle captcha',
                    'Try alternative download sources',
                    'Use different user agent',
                    'Implement captcha solving service'
                ]
            },
            
            javascript_required: {
                patterns: [
                    /javascript.*required/i,
                    /js.*disabled/i,
                    /dynamic.*content/i,
                    /spa.*application/i
                ],
                category: 'javascript_required',
                severity: 'medium',
                suggestions: [
                    'Use browser automation (Puppeteer/Selenium)',
                    'Enable JavaScript execution',
                    'Use headless browser for dynamic content'
                ]
            },
            
            ssl_tls: {
                patterns: [
                    /ssl.*error/i,
                    /tls.*error/i,
                    /certificate.*error/i,
                    /https.*error/i,
                    /cert.*verify.*failed/i
                ],
                category: 'ssl_tls',
                severity: 'medium',
                suggestions: [
                    'Ignore SSL certificate errors',
                    'Use HTTP instead of HTTPS',
                    'Update certificates',
                    'Use browser automation with SSL bypass'
                ]
            },
            
            disk_space: {
                patterns: [
                    /disk.*space/i,
                    /no.*space.*left/i,
                    /enospc/i,
                    /quota.*exceeded/i
                ],
                category: 'disk_space',
                severity: 'high',
                suggestions: [
                    'Free up disk space',
                    'Use different output directory',
                    'Clean temporary files',
                    'Use streaming download'
                ]
            },
            
            antivirus: {
                patterns: [
                    /antivirus/i,
                    /security.*scan/i,
                    /malware.*detected/i,
                    /virus.*detected/i,
                    /blocked.*by.*security/i
                ],
                category: 'antivirus',
                severity: 'high',
                suggestions: [
                    'Temporarily disable antivirus',
                    'Add exception for download directory',
                    'Use trusted sources only',
                    'Verify file integrity'
                ]
            }
        };

        this.errorHistory = [];
        this.learningData = new Map();
    }

    /**
     * Analyze error and provide suggestions
     * @param {Error|string} error - Error object or error message
     * @param {object} context - Additional context about the error
     * @returns {object} Analysis result
     */
    async analyzeError(error, context = {}) {
        try {
            const errorMessage = typeof error === 'string' ? error : error.message;
            const errorStack = typeof error === 'object' ? error.stack : null;
            
            console.log(`[ERROR ANALYZER] Analyzing error: ${errorMessage}`);
            
            const analysis = {
                timestamp: new Date(),
                originalError: errorMessage,
                errorStack: errorStack,
                context: context,
                
                // Analysis results
                category: this.categorizeError(errorMessage),
                severity: this.assessSeverity(errorMessage),
                suggestions: this.generateSuggestions(errorMessage),
                
                // Learning data
                similarErrors: this.findSimilarErrors(errorMessage),
                successRate: this.calculateSuccessRate(errorMessage),
                
                // Recovery strategies
                immediateActions: this.getImmediateActions(errorMessage),
                fallbackStrategies: this.getFallbackStrategies(errorMessage),
                
                // Learning
                shouldLearn: this.shouldLearnFromError(errorMessage),
                learningPriority: this.getLearningPriority(errorMessage)
            };

            // Store error for learning
            this.storeErrorForLearning(analysis);
            
            return analysis;
        } catch (analyzeError) {
            console.error('[ERROR ANALYZER] Error analysis failed:', analyzeError);
            return this.getDefaultAnalysis(error, context);
        }
    }

    /**
     * Categorize error based on patterns
     */
    categorizeError(errorMessage) {
        for (const [category, config] of Object.entries(this.errorPatterns)) {
            for (const pattern of config.patterns) {
                if (pattern.test(errorMessage)) {
                    return config.category;
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * Assess error severity
     */
    assessSeverity(errorMessage) {
        for (const [category, config] of Object.entries(this.errorPatterns)) {
            for (const pattern of config.patterns) {
                if (pattern.test(errorMessage)) {
                    return config.severity;
                }
            }
        }
        
        return 'medium';
    }

    /**
     * Generate suggestions based on error category
     */
    generateSuggestions(errorMessage) {
        const category = this.categorizeError(errorMessage);
        
        if (this.errorPatterns[category]) {
            return [...this.errorPatterns[category].suggestions];
        }
        
        return [
            'Try alternative approach',
            'Check system requirements',
            'Verify input parameters',
            'Use different tool or method'
        ];
    }

    /**
     * Find similar errors from history
     */
    findSimilarErrors(errorMessage) {
        const similar = [];
        const errorWords = errorMessage.toLowerCase().split(/\s+/);
        
        for (const historicalError of this.errorHistory) {
            const historicalWords = historicalError.originalError.toLowerCase().split(/\s+/);
            const commonWords = errorWords.filter(word => historicalWords.includes(word));
            
            if (commonWords.length > 0) {
                const similarity = commonWords.length / Math.max(errorWords.length, historicalWords.length);
                if (similarity > 0.3) {
                    similar.push({
                        error: historicalError.originalError,
                        similarity: similarity,
                        timestamp: historicalError.timestamp,
                        resolution: historicalError.resolution
                    });
                }
            }
        }
        
        return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    }

    /**
     * Calculate success rate for similar errors
     */
    calculateSuccessRate(errorMessage) {
        const similar = this.findSimilarErrors(errorMessage);
        
        if (similar.length === 0) {
            return 0.5; // Default 50% success rate
        }
        
        const successful = similar.filter(s => s.resolution === 'success').length;
        return successful / similar.length;
    }

    /**
     * Get immediate actions to take
     */
    getImmediateActions(errorMessage) {
        const category = this.categorizeError(errorMessage);
        
        const actions = {
            network: [
                'Check internet connection',
                'Verify URL accessibility',
                'Try alternative mirror'
            ],
            permission: [
                'Check user privileges',
                'Verify file permissions',
                'Try different installation method'
            ],
            file_not_found: [
                'Validate URL',
                'Search for alternative sources',
                'Check file availability'
            ],
            captcha: [
                'Switch to browser automation',
                'Try different user agent',
                'Use alternative download source'
            ],
            javascript_required: [
                'Enable JavaScript execution',
                'Use browser automation',
                'Try static download link'
            ]
        };
        
        return actions[category] || ['Retry with different parameters'];
    }

    /**
     * Get fallback strategies
     */
    getFallbackStrategies(errorMessage) {
        const category = this.categorizeError(errorMessage);
        
        const strategies = {
            network: [
                'web_fetch_with_retry',
                'browser_automation',
                'curl_fallback',
                'mirror_search'
            ],
            permission: [
                'gui_installation',
                'portable_version',
                'package_manager',
                'elevated_execution'
            ],
            file_not_found: [
                'url_resolution',
                'search_and_scrape',
                'browser_automation',
                'alternative_sources'
            ],
            captcha: [
                'browser_automation',
                'selenium_with_delays',
                'alternative_sources',
                'manual_intervention'
            ],
            javascript_required: [
                'puppeteer_automation',
                'selenium_automation',
                'static_content_extraction',
                'api_endpoints'
            ]
        };
        
        return strategies[category] || ['alternative_approach'];
    }

    /**
     * Determine if error should be learned from
     */
    shouldLearnFromError(errorMessage) {
        const category = this.categorizeError(errorMessage);
        const severity = this.assessSeverity(errorMessage);
        
        // Learn from high-severity errors and common categories
        return severity === 'high' || 
               ['network', 'permission', 'file_not_found', 'captcha'].includes(category);
    }

    /**
     * Get learning priority
     */
    getLearningPriority(errorMessage) {
        const category = this.categorizeError(errorMessage);
        const severity = this.assessSeverity(errorMessage);
        
        if (severity === 'high') return 'high';
        if (['network', 'permission'].includes(category)) return 'medium';
        return 'low';
    }

    /**
     * Store error for learning
     */
    storeErrorForLearning(analysis) {
        const errorRecord = {
            timestamp: analysis.timestamp,
            originalError: analysis.originalError,
            category: analysis.category,
            severity: analysis.severity,
            context: analysis.context,
            resolution: null, // Will be updated when resolved
            strategies: [],
            successCount: 0,
            failureCount: 0
        };
        
        this.errorHistory.push(errorRecord);
        
        // Keep only last 1000 errors
        if (this.errorHistory.length > 1000) {
            this.errorHistory = this.errorHistory.slice(-1000);
        }
        
        // Update learning data
        this.updateLearningData(analysis);
    }

    /**
     * Update learning data
     */
    updateLearningData(analysis) {
        const category = analysis.category;
        
        if (!this.learningData.has(category)) {
            this.learningData.set(category, {
                totalErrors: 0,
                successfulResolutions: 0,
                commonPatterns: [],
                bestStrategies: []
            });
        }
        
        const data = this.learningData.get(category);
        data.totalErrors++;
        
        // Extract common patterns
        const words = analysis.originalError.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length > 3) {
                const existingPattern = data.commonPatterns.find(p => p.word === word);
                if (existingPattern) {
                    existingPattern.count++;
                } else {
                    data.commonPatterns.push({ word: word, count: 1 });
                }
            }
        }
        
        // Sort patterns by frequency
        data.commonPatterns.sort((a, b) => b.count - a.count);
        data.commonPatterns = data.commonPatterns.slice(0, 20); // Keep top 20
    }

    /**
     * Update error resolution
     */
    updateErrorResolution(errorMessage, resolution, strategy) {
        const errorRecord = this.errorHistory.find(e => 
            e.originalError === errorMessage && e.resolution === null
        );
        
        if (errorRecord) {
            errorRecord.resolution = resolution;
            errorRecord.resolutionStrategy = strategy;
            errorRecord.resolvedAt = new Date();
            
            if (resolution === 'success') {
                errorRecord.successCount++;
                
                // Update learning data
                const category = errorRecord.category;
                if (this.learningData.has(category)) {
                    const data = this.learningData.get(category);
                    data.successfulResolutions++;
                    
                    // Track successful strategies
                    const existingStrategy = data.bestStrategies.find(s => s.name === strategy);
                    if (existingStrategy) {
                        existingStrategy.successCount++;
                    } else {
                        data.bestStrategies.push({ name: strategy, successCount: 1 });
                    }
                }
            } else {
                errorRecord.failureCount++;
            }
        }
    }

    /**
     * Get learning statistics
     */
    getLearningStatistics() {
        const stats = {
            totalErrors: this.errorHistory.length,
            categories: {},
            topPatterns: [],
            bestStrategies: []
        };
        
        // Category statistics
        for (const [category, data] of this.learningData.entries()) {
            stats.categories[category] = {
                totalErrors: data.totalErrors,
                successRate: data.totalErrors > 0 ? 
                    data.successfulResolutions / data.totalErrors : 0,
                commonPatterns: data.commonPatterns.slice(0, 5),
                bestStrategies: data.bestStrategies
                    .sort((a, b) => b.successCount - a.successCount)
                    .slice(0, 5)
            };
        }
        
        // Overall top patterns
        const allPatterns = [];
        for (const data of this.learningData.values()) {
            allPatterns.push(...data.commonPatterns);
        }
        
        stats.topPatterns = allPatterns
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        return stats;
    }

    /**
     * Get default analysis when parsing fails
     */
    getDefaultAnalysis(error, context) {
        return {
            timestamp: new Date(),
            originalError: typeof error === 'string' ? error : error.message,
            errorStack: typeof error === 'object' ? error.stack : null,
            context: context,
            category: 'unknown',
            severity: 'medium',
            suggestions: ['Try alternative approach', 'Check system requirements'],
            similarErrors: [],
            successRate: 0.5,
            immediateActions: ['Retry with different parameters'],
            fallbackStrategies: ['alternative_approach'],
            shouldLearn: false,
            learningPriority: 'low'
        };
    }
}

module.exports = ErrorAnalyzer;
