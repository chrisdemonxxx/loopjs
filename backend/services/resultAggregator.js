/**
 * Result Aggregator
 * Collects, analyzes, and processes results from multi-step commands
 */
class ResultAggregator {
    constructor() {
        this.results = new Map(); // Store aggregated results
        this.patterns = new Map(); // Store detected patterns
        this.analytics = new Map(); // Store analytics data
        this.anomalies = new Map(); // Store detected anomalies
    }

    /**
     * Collect results from multi-step command execution
     */
    async collectResults(executionId, commandResults, context = {}) {
        try {
            console.log('[RESULT AGGREGATOR] Collecting results for execution:', executionId);
            
            const aggregatedResult = {
                executionId: executionId,
                timestamp: new Date().toISOString(),
                context: context,
                commands: commandResults,
                summary: this.generateSummary(commandResults),
                patterns: await this.detectPatterns(commandResults),
                anomalies: await this.detectAnomalies(commandResults),
                analytics: this.generateAnalytics(commandResults),
                insights: await this.generateInsights(commandResults, context)
            };

            // Store aggregated result
            this.results.set(executionId, aggregatedResult);
            
            // Update pattern database
            this.updatePatternDatabase(aggregatedResult.patterns);
            
            // Update analytics
            this.updateAnalytics(aggregatedResult.analytics);
            
            return {
                success: true,
                executionId: executionId,
                aggregatedResult: aggregatedResult
            };

        } catch (error) {
            console.error('[RESULT AGGREGATOR] Error collecting results:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate summary of command results
     */
    generateSummary(commandResults) {
        const summary = {
            totalCommands: commandResults.length,
            successfulCommands: commandResults.filter(r => r.success).length,
            failedCommands: commandResults.filter(r => !r.success).length,
            totalExecutionTime: commandResults.reduce((sum, r) => sum + (r.executionTime || 0), 0),
            averageExecutionTime: 0,
            successRate: 0,
            outputSize: commandResults.reduce((sum, r) => sum + (r.output?.length || 0), 0),
            errorCount: commandResults.filter(r => !r.success).length,
            warnings: commandResults.filter(r => r.warnings && r.warnings.length > 0).length
        };

        summary.averageExecutionTime = summary.totalCommands > 0 ? 
            summary.totalExecutionTime / summary.totalCommands : 0;
        summary.successRate = summary.totalCommands > 0 ? 
            (summary.successfulCommands / summary.totalCommands) * 100 : 0;

        return summary;
    }

    /**
     * Detect patterns in command results
     */
    async detectPatterns(commandResults) {
        const patterns = {
            executionPatterns: this.detectExecutionPatterns(commandResults),
            outputPatterns: this.detectOutputPatterns(commandResults),
            errorPatterns: this.detectErrorPatterns(commandResults),
            performancePatterns: this.detectPerformancePatterns(commandResults),
            temporalPatterns: this.detectTemporalPatterns(commandResults)
        };

        return patterns;
    }

    /**
     * Detect execution patterns
     */
    detectExecutionPatterns(commandResults) {
        const patterns = [];
        
        // Success/failure patterns
        const successPattern = commandResults.map(r => r.success ? 'S' : 'F').join('');
        if (successPattern.includes('SSS')) {
            patterns.push({
                type: 'success_sequence',
                pattern: 'Consecutive successful commands',
                frequency: (successPattern.match(/SSS/g) || []).length
            });
        }
        
        if (successPattern.includes('FFF')) {
            patterns.push({
                type: 'failure_sequence',
                pattern: 'Consecutive failed commands',
                frequency: (successPattern.match(/FFF/g) || []).length
            });
        }
        
        // Alternating patterns
        if (successPattern.includes('SFSF')) {
            patterns.push({
                type: 'alternating',
                pattern: 'Alternating success/failure pattern',
                frequency: (successPattern.match(/SFSF/g) || []).length
            });
        }
        
        return patterns;
    }

    /**
     * Detect output patterns
     */
    detectOutputPatterns(commandResults) {
        const patterns = [];
        const outputs = commandResults.map(r => r.output || '').join(' ');
        
        // Common output patterns
        const commonPatterns = [
            { pattern: /error|Error|ERROR/g, type: 'error_keywords', description: 'Error keywords in output' },
            { pattern: /warning|Warning|WARNING/g, type: 'warning_keywords', description: 'Warning keywords in output' },
            { pattern: /success|Success|SUCCESS/g, type: 'success_keywords', description: 'Success keywords in output' },
            { pattern: /completed|Completed|COMPLETED/g, type: 'completion_keywords', description: 'Completion keywords in output' },
            { pattern: /\d+ files?/g, type: 'file_count', description: 'File count references' },
            { pattern: /\d+ MB|GB|KB/g, type: 'size_references', description: 'Size references' },
            { pattern: /\d+%\s*(complete|done|finished)/g, type: 'progress_references', description: 'Progress references' }
        ];
        
        for (const { pattern, type, description } of commonPatterns) {
            const matches = outputs.match(pattern);
            if (matches && matches.length > 0) {
                patterns.push({
                    type: type,
                    pattern: description,
                    frequency: matches.length,
                    examples: matches.slice(0, 3) // First 3 examples
                });
            }
        }
        
        return patterns;
    }

    /**
     * Detect error patterns
     */
    detectErrorPatterns(commandResults) {
        const patterns = [];
        const errors = commandResults.filter(r => !r.success).map(r => r.error || r.output || '');
        
        if (errors.length === 0) return patterns;
        
        // Common error patterns
        const errorPatterns = [
            { pattern: /permission denied/i, type: 'permission_error', description: 'Permission denied errors' },
            { pattern: /access denied/i, type: 'access_error', description: 'Access denied errors' },
            { pattern: /file not found/i, type: 'file_not_found', description: 'File not found errors' },
            { pattern: /network error/i, type: 'network_error', description: 'Network related errors' },
            { pattern: /timeout/i, type: 'timeout_error', description: 'Timeout errors' },
            { pattern: /out of memory/i, type: 'memory_error', description: 'Memory related errors' },
            { pattern: /disk space/i, type: 'disk_space_error', description: 'Disk space errors' }
        ];
        
        for (const { pattern, type, description } of errorPatterns) {
            const matchingErrors = errors.filter(error => pattern.test(error));
            if (matchingErrors.length > 0) {
                patterns.push({
                    type: type,
                    pattern: description,
                    frequency: matchingErrors.length,
                    examples: matchingErrors.slice(0, 2) // First 2 examples
                });
            }
        }
        
        return patterns;
    }

    /**
     * Detect performance patterns
     */
    detectPerformancePatterns(commandResults) {
        const patterns = [];
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        
        if (executionTimes.length === 0) return patterns;
        
        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
        const maxTime = Math.max(...executionTimes);
        const minTime = Math.min(...executionTimes);
        
        // Performance patterns
        if (maxTime > avgTime * 3) {
            patterns.push({
                type: 'slow_command',
                pattern: 'Commands with unusually long execution times',
                frequency: executionTimes.filter(time => time > avgTime * 2).length,
                averageTime: avgTime,
                maxTime: maxTime
            });
        }
        
        if (minTime < avgTime * 0.1) {
            patterns.push({
                type: 'fast_command',
                pattern: 'Commands with unusually short execution times',
                frequency: executionTimes.filter(time => time < avgTime * 0.2).length,
                averageTime: avgTime,
                minTime: minTime
            });
        }
        
        // Execution time trends
        const timeTrend = this.calculateTrend(executionTimes);
        if (Math.abs(timeTrend) > 0.1) {
            patterns.push({
                type: 'execution_trend',
                pattern: timeTrend > 0 ? 'Increasing execution times' : 'Decreasing execution times',
                trend: timeTrend,
                description: `Execution times are ${timeTrend > 0 ? 'increasing' : 'decreasing'} over time`
            });
        }
        
        return patterns;
    }

    /**
     * Detect temporal patterns
     */
    detectTemporalPatterns(commandResults) {
        const patterns = [];
        
        // Analyze execution timing
        const timestamps = commandResults.map(r => new Date(r.timestamp || Date.now()));
        const intervals = [];
        
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }
        
        if (intervals.length > 0) {
            const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
            
            // Detect regular intervals
            const regularIntervals = intervals.filter(interval => 
                Math.abs(interval - avgInterval) < avgInterval * 0.2
            );
            
            if (regularIntervals.length > intervals.length * 0.8) {
                patterns.push({
                    type: 'regular_intervals',
                    pattern: 'Commands executed at regular intervals',
                    averageInterval: avgInterval,
                    regularity: regularIntervals.length / intervals.length
                });
            }
            
            // Detect burst patterns
            const shortIntervals = intervals.filter(interval => interval < avgInterval * 0.5);
            if (shortIntervals.length > intervals.length * 0.3) {
                patterns.push({
                    type: 'burst_execution',
                    pattern: 'Commands executed in bursts',
                    burstCount: shortIntervals.length,
                    averageInterval: avgInterval
                });
            }
        }
        
        return patterns;
    }

    /**
     * Detect anomalies in results
     */
    async detectAnomalies(commandResults) {
        const anomalies = [];
        
        // Execution time anomalies
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        if (executionTimes.length > 0) {
            const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
            const stdDev = this.calculateStandardDeviation(executionTimes, avgTime);
            
            for (let i = 0; i < executionTimes.length; i++) {
                if (Math.abs(executionTimes[i] - avgTime) > stdDev * 2) {
                    anomalies.push({
                        type: 'execution_time_anomaly',
                        commandIndex: i,
                        command: commandResults[i],
                        expectedTime: avgTime,
                        actualTime: executionTimes[i],
                        deviation: Math.abs(executionTimes[i] - avgTime) / stdDev
                    });
                }
            }
        }
        
        // Success rate anomalies
        const successRate = commandResults.filter(r => r.success).length / commandResults.length;
        if (successRate < 0.5 && commandResults.length > 3) {
            anomalies.push({
                type: 'low_success_rate',
                successRate: successRate,
                description: 'Unusually low success rate detected',
                recommendation: 'Review failed commands for common issues'
            });
        }
        
        // Output size anomalies
        const outputSizes = commandResults.map(r => (r.output || '').length);
        if (outputSizes.length > 0) {
            const avgSize = outputSizes.reduce((sum, size) => sum + size, 0) / outputSizes.length;
            const stdDev = this.calculateStandardDeviation(outputSizes, avgSize);
            
            for (let i = 0; i < outputSizes.length; i++) {
                if (Math.abs(outputSizes[i] - avgSize) > stdDev * 2) {
                    anomalies.push({
                        type: 'output_size_anomaly',
                        commandIndex: i,
                        command: commandResults[i],
                        expectedSize: avgSize,
                        actualSize: outputSizes[i],
                        deviation: Math.abs(outputSizes[i] - avgSize) / stdDev
                    });
                }
            }
        }
        
        return anomalies;
    }

    /**
     * Generate analytics from results
     */
    generateAnalytics(commandResults) {
        const analytics = {
            performance: this.analyzePerformance(commandResults),
            reliability: this.analyzeReliability(commandResults),
            efficiency: this.analyzeEfficiency(commandResults),
            resourceUsage: this.analyzeResourceUsage(commandResults),
            trends: this.analyzeTrends(commandResults)
        };

        return analytics;
    }

    /**
     * Analyze performance metrics
     */
    analyzePerformance(commandResults) {
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        const successfulCommands = commandResults.filter(r => r.success);
        
        return {
            averageExecutionTime: executionTimes.length > 0 ? 
                executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : 0,
            totalExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0),
            fastestCommand: executionTimes.length > 0 ? Math.min(...executionTimes) : 0,
            slowestCommand: executionTimes.length > 0 ? Math.max(...executionTimes) : 0,
            throughput: successfulCommands.length / (executionTimes.reduce((sum, time) => sum + time, 0) / 1000), // commands per second
            performanceScore: this.calculatePerformanceScore(commandResults)
        };
    }

    /**
     * Analyze reliability metrics
     */
    analyzeReliability(commandResults) {
        const totalCommands = commandResults.length;
        const successfulCommands = commandResults.filter(r => r.success).length;
        const failedCommands = totalCommands - successfulCommands;
        
        return {
            successRate: totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0,
            failureRate: totalCommands > 0 ? (failedCommands / totalCommands) * 100 : 0,
            reliabilityScore: this.calculateReliabilityScore(commandResults),
            errorTypes: this.categorizeErrors(commandResults),
            retryEffectiveness: this.calculateRetryEffectiveness(commandResults)
        };
    }

    /**
     * Analyze efficiency metrics
     */
    analyzeEfficiency(commandResults) {
        const totalOutput = commandResults.reduce((sum, r) => sum + (r.output?.length || 0), 0);
        const totalExecutionTime = commandResults.reduce((sum, r) => sum + (r.executionTime || 0), 0);
        
        return {
            outputEfficiency: totalExecutionTime > 0 ? totalOutput / totalExecutionTime : 0, // characters per ms
            commandEfficiency: commandResults.length / (totalExecutionTime / 1000), // commands per second
            resourceEfficiency: this.calculateResourceEfficiency(commandResults),
            efficiencyScore: this.calculateEfficiencyScore(commandResults)
        };
    }

    /**
     * Analyze resource usage
     */
    analyzeResourceUsage(commandResults) {
        return {
            cpuUsage: this.estimateCPUUsage(commandResults),
            memoryUsage: this.estimateMemoryUsage(commandResults),
            diskUsage: this.estimateDiskUsage(commandResults),
            networkUsage: this.estimateNetworkUsage(commandResults),
            resourceScore: this.calculateResourceScore(commandResults)
        };
    }

    /**
     * Analyze trends
     */
    analyzeTrends(commandResults) {
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        const successRates = commandResults.map((r, i) => {
            const subset = commandResults.slice(0, i + 1);
            return subset.filter(s => s.success).length / subset.length;
        });
        
        return {
            executionTimeTrend: this.calculateTrend(executionTimes),
            successRateTrend: this.calculateTrend(successRates),
            performanceTrend: this.calculatePerformanceTrend(commandResults),
            trendScore: this.calculateTrendScore(commandResults)
        };
    }

    /**
     * Generate insights from results
     */
    async generateInsights(commandResults, context) {
        const insights = [];
        
        // Performance insights
        const avgTime = commandResults.reduce((sum, r) => sum + (r.executionTime || 0), 0) / commandResults.length;
        if (avgTime > 5000) {
            insights.push({
                type: 'performance',
                priority: 'high',
                insight: 'Commands are taking longer than expected',
                recommendation: 'Consider optimizing slow commands or breaking them into smaller steps',
                impact: 'High execution time may indicate performance issues'
            });
        }
        
        // Reliability insights
        const successRate = commandResults.filter(r => r.success).length / commandResults.length;
        if (successRate < 0.8) {
            insights.push({
                type: 'reliability',
                priority: 'high',
                insight: 'Low success rate detected',
                recommendation: 'Review failed commands and implement better error handling',
                impact: 'Low reliability may indicate system or configuration issues'
            });
        }
        
        // Pattern insights
        const patterns = await this.detectPatterns(commandResults);
        if (patterns.errorPatterns.length > 0) {
            insights.push({
                type: 'pattern',
                priority: 'medium',
                insight: 'Common error patterns detected',
                recommendation: 'Address recurring error types to improve overall reliability',
                impact: 'Pattern-based improvements can significantly enhance system stability'
            });
        }
        
        // Resource insights
        const resourceUsage = this.analyzeResourceUsage(commandResults);
        if (resourceUsage.resourceScore < 70) {
            insights.push({
                type: 'resource',
                priority: 'medium',
                insight: 'Resource usage could be optimized',
                recommendation: 'Review resource-intensive commands and consider optimization',
                impact: 'Better resource utilization can improve overall system performance'
            });
        }
        
        return insights;
    }

    /**
     * Calculate standard deviation
     */
    calculateStandardDeviation(values, mean) {
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    /**
     * Calculate trend
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, value) => sum + value, 0);
        const sumXY = values.reduce((sum, value, index) => sum + value * index, 0);
        const sumXX = values.reduce((sum, value, index) => sum + index * index, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    /**
     * Calculate performance score
     */
    calculatePerformanceScore(commandResults) {
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
        
        // Score based on execution time (lower is better)
        const timeScore = Math.max(0, 100 - (avgTime / 1000) * 10);
        
        // Score based on success rate
        const successRate = commandResults.filter(r => r.success).length / commandResults.length;
        const successScore = successRate * 100;
        
        return (timeScore + successScore) / 2;
    }

    /**
     * Calculate reliability score
     */
    calculateReliabilityScore(commandResults) {
        const successRate = commandResults.filter(r => r.success).length / commandResults.length;
        const errorCount = commandResults.filter(r => !r.success).length;
        
        // Base score on success rate
        let score = successRate * 100;
        
        // Penalize for high error count
        if (errorCount > commandResults.length * 0.2) {
            score -= 20;
        }
        
        return Math.max(0, score);
    }

    /**
     * Calculate efficiency score
     */
    calculateEfficiencyScore(commandResults) {
        const totalOutput = commandResults.reduce((sum, r) => sum + (r.output?.length || 0), 0);
        const totalExecutionTime = commandResults.reduce((sum, r) => sum + (r.executionTime || 0), 0);
        
        if (totalExecutionTime === 0) return 0;
        
        const outputEfficiency = totalOutput / totalExecutionTime;
        const commandEfficiency = commandResults.length / (totalExecutionTime / 1000);
        
        // Normalize scores (adjust thresholds based on typical values)
        const normalizedOutputScore = Math.min(100, outputEfficiency * 1000);
        const normalizedCommandScore = Math.min(100, commandEfficiency * 10);
        
        return (normalizedOutputScore + normalizedCommandScore) / 2;
    }

    /**
     * Calculate resource score
     */
    calculateResourceScore(commandResults) {
        // Simplified resource scoring based on execution patterns
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
        
        // Score based on execution time efficiency
        const timeScore = Math.max(0, 100 - (avgTime / 1000) * 5);
        
        // Score based on success rate (successful commands use resources more efficiently)
        const successRate = commandResults.filter(r => r.success).length / commandResults.length;
        const successScore = successRate * 100;
        
        return (timeScore + successScore) / 2;
    }

    /**
     * Calculate trend score
     */
    calculateTrendScore(commandResults) {
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        const trend = this.calculateTrend(executionTimes);
        
        // Positive trend (increasing times) is bad, negative trend (decreasing times) is good
        return Math.max(0, 100 - Math.abs(trend) * 1000);
    }

    /**
     * Categorize errors
     */
    categorizeErrors(commandResults) {
        const errors = commandResults.filter(r => !r.success);
        const categories = {};
        
        for (const error of errors) {
            const errorMessage = error.error || error.output || '';
            let category = 'unknown';
            
            if (/permission|access/i.test(errorMessage)) category = 'permission';
            else if (/network|connection/i.test(errorMessage)) category = 'network';
            else if (/file|path/i.test(errorMessage)) category = 'file_system';
            else if (/timeout/i.test(errorMessage)) category = 'timeout';
            else if (/memory/i.test(errorMessage)) category = 'memory';
            else if (/disk|space/i.test(errorMessage)) category = 'disk';
            
            categories[category] = (categories[category] || 0) + 1;
        }
        
        return categories;
    }

    /**
     * Calculate retry effectiveness
     */
    calculateRetryEffectiveness(commandResults) {
        // Simplified retry effectiveness calculation
        const retriedCommands = commandResults.filter(r => r.retryCount > 0);
        const successfulRetries = retriedCommands.filter(r => r.success);
        
        return retriedCommands.length > 0 ? 
            successfulRetries.length / retriedCommands.length : 0;
    }

    /**
     * Estimate resource usage (simplified)
     */
    estimateCPUUsage(commandResults) {
        const executionTimes = commandResults.map(r => r.executionTime || 0);
        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
        
        // Rough estimate based on execution time
        return Math.min(100, (avgTime / 1000) * 10);
    }

    estimateMemoryUsage(commandResults) {
        const outputSizes = commandResults.map(r => (r.output || '').length);
        const avgSize = outputSizes.reduce((sum, size) => sum + size, 0) / outputSizes.length;
        
        // Rough estimate based on output size
        return Math.min(100, avgSize / 1000);
    }

    estimateDiskUsage(commandResults) {
        const diskOperations = commandResults.filter(r => 
            /copy|move|delete|create|write/i.test(r.command?.action || '')
        );
        
        return diskOperations.length * 10; // Simplified estimate
    }

    estimateNetworkUsage(commandResults) {
        const networkOperations = commandResults.filter(r => 
            /download|upload|invoke-webrequest|ping/i.test(r.command?.action || '')
        );
        
        return networkOperations.length * 15; // Simplified estimate
    }

    /**
     * Update pattern database
     */
    updatePatternDatabase(patterns) {
        for (const [patternType, patternList] of Object.entries(patterns)) {
            if (!this.patterns.has(patternType)) {
                this.patterns.set(patternType, []);
            }
            
            const existingPatterns = this.patterns.get(patternType);
            for (const pattern of patternList) {
                const existingPattern = existingPatterns.find(p => p.type === pattern.type);
                if (existingPattern) {
                    existingPattern.frequency += pattern.frequency;
                    existingPattern.lastSeen = new Date().toISOString();
                } else {
                    pattern.firstSeen = new Date().toISOString();
                    pattern.lastSeen = new Date().toISOString();
                    existingPatterns.push(pattern);
                }
            }
        }
    }

    /**
     * Update analytics
     */
    updateAnalytics(analytics) {
        const timestamp = new Date().toISOString();
        
        for (const [metricType, metrics] of Object.entries(analytics)) {
            if (!this.analytics.has(metricType)) {
                this.analytics.set(metricType, []);
            }
            
            const existingMetrics = this.analytics.get(metricType);
            existingMetrics.push({
                timestamp: timestamp,
                metrics: metrics
            });
            
            // Keep only last 100 entries
            if (existingMetrics.length > 100) {
                existingMetrics.splice(0, existingMetrics.length - 100);
            }
        }
    }

    /**
     * Get aggregated result
     */
    getAggregatedResult(executionId) {
        return this.results.get(executionId);
    }

    /**
     * Get all aggregated results
     */
    getAllAggregatedResults() {
        return Array.from(this.results.values());
    }

    /**
     * Get pattern database
     */
    getPatternDatabase() {
        return Object.fromEntries(this.patterns);
    }

    /**
     * Get analytics data
     */
    getAnalyticsData() {
        return Object.fromEntries(this.analytics);
    }

    /**
     * Get aggregator statistics
     */
    getStatistics() {
        return {
            totalExecutions: this.results.size,
            totalPatterns: Array.from(this.patterns.values()).flat().length,
            totalAnalytics: Array.from(this.analytics.values()).flat().length,
            patternTypes: Array.from(this.patterns.keys()),
            analyticsTypes: Array.from(this.analytics.keys()),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ResultAggregator;
