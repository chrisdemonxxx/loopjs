/**
 * Learning System
 * Database-integrated pattern storage and learning from execution results
 */

const mongoose = require('mongoose');
const CommandPattern = require('../models/CommandPattern');

// Learning System Database Schemas
const CommandPatternSchema = new mongoose.Schema({
    intent: { type: String, required: true, index: true },
    originalInput: { type: String, required: true },
    complexity: { type: String, enum: ['simple', 'moderate', 'complex'], required: true },
    targetType: { type: String, enum: ['url', 'application', 'file', 'keyword'], required: true },
    targetValue: { type: String, required: true },
    
    // Strategy information
    successfulStrategy: {
        name: String,
        tools: [String],
        parameters: mongoose.Schema.Types.Mixed,
        executionTime: Number,
        successRate: Number
    },
    
    failedStrategies: [{
        name: String,
        tools: [String],
        error: String,
        errorCategory: String,
        attemptCount: Number
    }],
    
    // Execution metrics
    totalExecutionTime: Number,
    attemptsCount: Number,
    successCount: Number,
    failureCount: Number,
    
    // Learning data
    confidence: Number,
    lastUsed: { type: Date, default: Date.now },
    usageCount: { type: Number, default: 1 },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    clientInfo: mongoose.Schema.Types.Mixed
});

const ErrorPatternSchema = new mongoose.Schema({
    errorCategory: { type: String, required: true, index: true },
    errorMessage: { type: String, required: true },
    commandContext: String,
    
    // Resolution information
    successfulResolutions: [{
        strategy: String,
        tools: [String],
        parameters: mongoose.Schema.Types.Mixed,
        successRate: Number,
        lastUsed: Date
    }],
    
    // Statistics
    occurrenceCount: { type: Number, default: 1 },
    resolutionCount: { type: Number, default: 0 },
    avgResolutionTime: Number,
    
    // Learning
    lastSeen: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const StrategyPerformanceSchema = new mongoose.Schema({
    strategyName: { type: String, required: true, unique: true },
    tools: [String],
    
    // Performance metrics
    totalAttempts: { type: Number, default: 0 },
    successfulAttempts: { type: Number, default: 0 },
    failedAttempts: { type: Number, default: 0 },
    
    // Timing metrics
    avgExecutionTime: Number,
    minExecutionTime: Number,
    maxExecutionTime: Number,
    
    // Context performance
    contextPerformance: {
        simple: { attempts: Number, successes: Number, avgTime: Number },
        moderate: { attempts: Number, successes: Number, avgTime: Number },
        complex: { attempts: Number, successes: Number, avgTime: Number }
    },
    
    // Tool-specific performance
    toolPerformance: mongoose.Schema.Types.Mixed,
    
    // Learning
    lastUsed: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const LearningInsightSchema = new mongoose.Schema({
    insightType: { type: String, enum: ['pattern', 'optimization', 'prediction', 'recommendation'], required: true },
    title: { type: String, required: true },
    description: String,
    
    // Insight data
    data: mongoose.Schema.Types.Mixed,
    confidence: Number,
    impact: { type: String, enum: ['low', 'medium', 'high'] },
    
    // Context
    applicableContexts: [String],
    applicableIntents: [String],
    
    // Usage
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date, default: Date.now },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    source: String
});

// Create models
const CommandPattern = mongoose.model('CommandPattern', CommandPatternSchema);
const ErrorPattern = mongoose.model('ErrorPattern', ErrorPatternSchema);
const StrategyPerformance = mongoose.model('StrategyPerformance', StrategyPerformanceSchema);
const LearningInsight = mongoose.model('LearningInsight', LearningInsightSchema);

class LearningSystem {
    constructor() {
        this.isConnected = false;
        this.learningCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize learning system
     */
    async initialize() {
        try {
            if (!this.isConnected) {
                await this.connectToDatabase();
            }
            console.log('[LEARNING SYSTEM] Initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('[LEARNING SYSTEM] Initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Connect to MongoDB
     */
    async connectToDatabase() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loopjs-learning';
            await mongoose.connect(mongoUri);
            this.isConnected = true;
            console.log('[LEARNING SYSTEM] Connected to MongoDB');
        } catch (error) {
            console.error('[LEARNING SYSTEM] Database connection failed:', error);
            throw error;
        }
    }

    /**
     * Learn from command execution
     * @param {object} executionData - Command execution data
     */
    async learnFromExecution(executionData) {
        try {
            console.log('[LEARNING SYSTEM] Learning from execution...');

            const {
                userInput,
                analysis,
                strategies,
                result,
                executionTime,
                clientInfo
            } = executionData;

            // Store command pattern
            await this.storeCommandPattern({
                intent: analysis.intent,
                originalInput: userInput,
                complexity: analysis.complexity,
                targetType: analysis.targets[0]?.type || 'keyword',
                targetValue: analysis.targets[0]?.value || userInput,
                successfulStrategy: result.success ? {
                    name: result.strategy,
                    tools: strategies.find(s => s.name === result.strategy)?.tools || [],
                    parameters: strategies.find(s => s.name === result.strategy)?.parameters || {},
                    executionTime: executionTime,
                    successRate: 1.0
                } : null,
                failedStrategies: result.success ? [] : strategies.map(s => ({
                    name: s.name,
                    tools: s.tools,
                    error: result.error,
                    errorCategory: this.categorizeError(result.error),
                    attemptCount: 1
                })),
                totalExecutionTime: executionTime,
                attemptsCount: strategies.length,
                successCount: result.success ? 1 : 0,
                failureCount: result.success ? 0 : 1,
                confidence: analysis.confidence,
                clientInfo: clientInfo
            });

            // Update strategy performance
            for (const strategy of strategies) {
                await this.updateStrategyPerformance(strategy, result.success, executionTime, analysis.complexity);
            }

            // Store error patterns if failed
            if (!result.success) {
                await this.storeErrorPattern(result.error, userInput, strategies);
            }

            // Generate insights
            await this.generateInsights(executionData);

            console.log('[LEARNING SYSTEM] Learning completed');

        } catch (error) {
            console.error('[LEARNING SYSTEM] Learning failed:', error);
        }
    }

    /**
     * Store command pattern
     */
    async storeCommandPattern(patternData) {
        try {
            // Check if similar pattern exists
            const existingPattern = await CommandPattern.findOne({
                intent: patternData.intent,
                targetType: patternData.targetType,
                targetValue: patternData.targetValue
            });

            if (existingPattern) {
                // Update existing pattern
                existingPattern.usageCount++;
                existingPattern.lastUsed = new Date();
                existingPattern.updatedAt = new Date();

                if (patternData.successfulStrategy) {
                    existingPattern.successCount++;
                    existingPattern.successfulStrategy = patternData.successfulStrategy;
                } else {
                    existingPattern.failureCount++;
                    existingPattern.failedStrategies.push(...patternData.failedStrategies);
                }

                existingPattern.totalExecutionTime = (existingPattern.totalExecutionTime + patternData.totalExecutionTime) / 2;
                existingPattern.attemptsCount = Math.max(existingPattern.attemptsCount, patternData.attemptsCount);

                await existingPattern.save();
            } else {
                // Create new pattern
                const pattern = new CommandPattern(patternData);
                await pattern.save();
            }

        } catch (error) {
            console.error('[LEARNING SYSTEM] Failed to store command pattern:', error);
        }
    }

    /**
     * Update strategy performance
     */
    async updateStrategyPerformance(strategy, success, executionTime, complexity) {
        try {
            let performance = await StrategyPerformance.findOne({
                strategyName: strategy.name
            });

            if (!performance) {
                performance = new StrategyPerformance({
                    strategyName: strategy.name,
                    tools: strategy.tools,
                    contextPerformance: {
                        simple: { attempts: 0, successes: 0, avgTime: 0 },
                        moderate: { attempts: 0, successes: 0, avgTime: 0 },
                        complex: { attempts: 0, successes: 0, avgTime: 0 }
                    }
                });
            }

            // Update general metrics
            performance.totalAttempts++;
            if (success) {
                performance.successfulAttempts++;
            } else {
                performance.failedAttempts++;
            }

            // Update timing metrics
            if (!performance.avgExecutionTime) {
                performance.avgExecutionTime = executionTime;
                performance.minExecutionTime = executionTime;
                performance.maxExecutionTime = executionTime;
            } else {
                performance.avgExecutionTime = (performance.avgExecutionTime + executionTime) / 2;
                performance.minExecutionTime = Math.min(performance.minExecutionTime, executionTime);
                performance.maxExecutionTime = Math.max(performance.maxExecutionTime, executionTime);
            }

            // Update context-specific performance
            const contextPerf = performance.contextPerformance[complexity];
            contextPerf.attempts++;
            if (success) {
                contextPerf.successes++;
            }
            contextPerf.avgTime = contextPerf.avgTime ? (contextPerf.avgTime + executionTime) / 2 : executionTime;

            // Update tool-specific performance
            if (!performance.toolPerformance) {
                performance.toolPerformance = {};
            }

            for (const tool of strategy.tools) {
                if (!performance.toolPerformance[tool]) {
                    performance.toolPerformance[tool] = { attempts: 0, successes: 0, avgTime: 0 };
                }
                performance.toolPerformance[tool].attempts++;
                if (success) {
                    performance.toolPerformance[tool].successes++;
                }
                performance.toolPerformance[tool].avgTime = 
                    performance.toolPerformance[tool].avgTime ? 
                    (performance.toolPerformance[tool].avgTime + executionTime) / 2 : 
                    executionTime;
            }

            performance.lastUsed = new Date();
            performance.updatedAt = new Date();

            await performance.save();

        } catch (error) {
            console.error('[LEARNING SYSTEM] Failed to update strategy performance:', error);
        }
    }

    /**
     * Store error pattern
     */
    async storeErrorPattern(errorMessage, commandContext, strategies) {
        try {
            const errorCategory = this.categorizeError(errorMessage);

            let errorPattern = await ErrorPattern.findOne({
                errorCategory: errorCategory,
                errorMessage: errorMessage
            });

            if (!errorPattern) {
                errorPattern = new ErrorPattern({
                    errorCategory: errorCategory,
                    errorMessage: errorMessage,
                    commandContext: commandContext
                });
            }

            errorPattern.occurrenceCount++;
            errorPattern.lastSeen = new Date();

            // Add successful resolution if available
            const successfulStrategy = strategies.find(s => s.successRate > 0.7);
            if (successfulStrategy) {
                errorPattern.resolutionCount++;
                errorPattern.successfulResolutions.push({
                    strategy: successfulStrategy.name,
                    tools: successfulStrategy.tools,
                    parameters: successfulStrategy.parameters,
                    successRate: successfulStrategy.successRate,
                    lastUsed: new Date()
                });
            }

            await errorPattern.save();

        } catch (error) {
            console.error('[LEARNING SYSTEM] Failed to store error pattern:', error);
        }
    }

    /**
     * Generate learning insights
     */
    async generateInsights(executionData) {
        try {
            const insights = [];

            // Pattern insights
            const patternInsight = await this.generatePatternInsight(executionData);
            if (patternInsight) {
                insights.push(patternInsight);
            }

            // Optimization insights
            const optimizationInsight = await this.generateOptimizationInsight(executionData);
            if (optimizationInsight) {
                insights.push(optimizationInsight);
            }

            // Prediction insights
            const predictionInsight = await this.generatePredictionInsight(executionData);
            if (predictionInsight) {
                insights.push(predictionInsight);
            }

            // Store insights
            for (const insight of insights) {
                await this.storeInsight(insight);
            }

        } catch (error) {
            console.error('[LEARNING SYSTEM] Failed to generate insights:', error);
        }
    }

    /**
     * Generate pattern insight
     */
    async generatePatternInsight(executionData) {
        try {
            const { analysis, result } = executionData;

            // Check for recurring patterns
            const similarPatterns = await CommandPattern.find({
                intent: analysis.intent,
                complexity: analysis.complexity
            }).limit(10);

            if (similarPatterns.length >= 3) {
                const successRate = similarPatterns.reduce((sum, p) => sum + (p.successCount / (p.successCount + p.failureCount)), 0) / similarPatterns.length;

                if (successRate > 0.8) {
                    return {
                        insightType: 'pattern',
                        title: `High Success Pattern: ${analysis.intent}`,
                        description: `Commands with intent "${analysis.intent}" and complexity "${analysis.complexity}" have ${(successRate * 100).toFixed(1)}% success rate`,
                        data: {
                            intent: analysis.intent,
                            complexity: analysis.complexity,
                            successRate: successRate,
                            sampleSize: similarPatterns.length
                        },
                        confidence: 0.8,
                        impact: 'high',
                        applicableContexts: [analysis.complexity],
                        applicableIntents: [analysis.intent],
                        source: 'pattern_analysis'
                    };
                }
            }

            return null;

        } catch (error) {
            console.error('[LEARNING SYSTEM] Pattern insight generation failed:', error);
            return null;
        }
    }

    /**
     * Generate optimization insight
     */
    async generateOptimizationInsight(executionData) {
        try {
            const { strategies, executionTime } = executionData;

            // Check for slow strategies
            const slowStrategies = strategies.filter(s => s.estimatedTime > executionTime * 2);
            if (slowStrategies.length > 0) {
                return {
                    insightType: 'optimization',
                    title: 'Strategy Performance Optimization',
                    description: `Some strategies are taking longer than expected. Consider optimizing or deprioritizing slow strategies.`,
                    data: {
                        slowStrategies: slowStrategies.map(s => ({
                            name: s.name,
                            estimatedTime: s.estimatedTime,
                            actualTime: executionTime
                        }))
                    },
                    confidence: 0.7,
                    impact: 'medium',
                    applicableContexts: ['performance'],
                    applicableIntents: ['all'],
                    source: 'performance_analysis'
                };
            }

            return null;

        } catch (error) {
            console.error('[LEARNING SYSTEM] Optimization insight generation failed:', error);
            return null;
        }
    }

    /**
     * Generate prediction insight
     */
    async generatePredictionInsight(executionData) {
        try {
            const { analysis, result } = executionData;

            // Predict success probability for similar commands
            const similarCommands = await CommandPattern.find({
                intent: analysis.intent,
                targetType: analysis.targetType
            }).limit(20);

            if (similarCommands.length >= 5) {
                const avgSuccessRate = similarCommands.reduce((sum, c) => sum + (c.successCount / (c.successCount + c.failureCount)), 0) / similarCommands.length;

                return {
                    insightType: 'prediction',
                    title: `Success Prediction: ${analysis.intent}`,
                    description: `Similar commands have ${(avgSuccessRate * 100).toFixed(1)}% success rate`,
                    data: {
                        predictedSuccessRate: avgSuccessRate,
                        confidence: Math.min(0.9, similarCommands.length / 20),
                        sampleSize: similarCommands.length
                    },
                    confidence: Math.min(0.9, similarCommands.length / 20),
                    impact: 'medium',
                    applicableContexts: ['prediction'],
                    applicableIntents: [analysis.intent],
                    source: 'prediction_analysis'
                };
            }

            return null;

        } catch (error) {
            console.error('[LEARNING SYSTEM] Prediction insight generation failed:', error);
            return null;
        }
    }

    /**
     * Store insight
     */
    async storeInsight(insight) {
        try {
            const insightDoc = new LearningInsight(insight);
            await insightDoc.save();
        } catch (error) {
            console.error('[LEARNING SYSTEM] Failed to store insight:', error);
        }
    }

    /**
     * Get recommendations for command
     */
    async getRecommendations(userInput, analysis) {
        try {
            const recommendations = [];

            // Get similar successful patterns
            const similarPatterns = await CommandPattern.find({
                intent: analysis.intent,
                complexity: analysis.complexity
            }).sort({ successCount: -1 }).limit(5);

            for (const pattern of similarPatterns) {
                if (pattern.successfulStrategy) {
                    recommendations.push({
                        type: 'strategy',
                        strategy: pattern.successfulStrategy,
                        confidence: pattern.confidence,
                        usageCount: pattern.usageCount,
                        successRate: pattern.successCount / (pattern.successCount + pattern.failureCount)
                    });
                }
            }

            // Get error-specific recommendations
            const errorPatterns = await ErrorPattern.find({
                commandContext: { $regex: analysis.intent, $options: 'i' }
            }).sort({ resolutionCount: -1 }).limit(3);

            for (const errorPattern of errorPatterns) {
                if (errorPattern.successfulResolutions.length > 0) {
                    const bestResolution = errorPattern.successfulResolutions.sort((a, b) => b.successRate - a.successRate)[0];
                    recommendations.push({
                        type: 'error_resolution',
                        errorCategory: errorPattern.errorCategory,
                        resolution: bestResolution,
                        confidence: bestResolution.successRate
                    });
                }
            }

            return recommendations;

        } catch (error) {
            console.error('[LEARNING SYSTEM] Failed to get recommendations:', error);
            return [];
        }
    }

    /**
     * Get learning statistics
     */
    async getLearningStatistics() {
        try {
            const stats = {
                commandPatterns: await CommandPattern.countDocuments(),
                errorPatterns: await ErrorPattern.countDocuments(),
                strategyPerformances: await StrategyPerformance.countDocuments(),
                learningInsights: await LearningInsight.countDocuments(),
                
                // Performance metrics
                avgSuccessRate: 0,
                topStrategies: [],
                topErrors: [],
                recentInsights: []
            };

            // Calculate average success rate
            const patterns = await CommandPattern.find({});
            if (patterns.length > 0) {
                const totalSuccess = patterns.reduce((sum, p) => sum + p.successCount, 0);
                const totalAttempts = patterns.reduce((sum, p) => sum + p.successCount + p.failureCount, 0);
                stats.avgSuccessRate = totalAttempts > 0 ? totalSuccess / totalAttempts : 0;
            }

            // Get top strategies
            const topStrategies = await StrategyPerformance.find({})
                .sort({ successfulAttempts: -1 })
                .limit(5);
            stats.topStrategies = topStrategies.map(s => ({
                name: s.strategyName,
                successRate: s.totalAttempts > 0 ? s.successfulAttempts / s.totalAttempts : 0,
                totalAttempts: s.totalAttempts,
                avgTime: s.avgExecutionTime
            }));

            // Get top errors
            const topErrors = await ErrorPattern.find({})
                .sort({ occurrenceCount: -1 })
                .limit(5);
            stats.topErrors = topErrors.map(e => ({
                category: e.errorCategory,
                message: e.errorMessage,
                occurrences: e.occurrenceCount,
                resolutions: e.resolutionCount
            }));

            // Get recent insights
            const recentInsights = await LearningInsight.find({})
                .sort({ createdAt: -1 })
                .limit(5);
            stats.recentInsights = recentInsights.map(i => ({
                type: i.insightType,
                title: i.title,
                confidence: i.confidence,
                impact: i.impact,
                createdAt: i.createdAt
            }));

            return stats;

        } catch (error) {
            console.error('[LEARNING SYSTEM] Failed to get statistics:', error);
            return {
                error: error.message,
                commandPatterns: 0,
                errorPatterns: 0,
                strategyPerformances: 0,
                learningInsights: 0
            };
        }
    }

    /**
     * Categorize error message
     */
    categorizeError(errorMessage) {
        const errorMessageLower = errorMessage.toLowerCase();

        if (errorMessageLower.includes('404') || errorMessageLower.includes('not found')) {
            return 'file_not_found';
        } else if (errorMessageLower.includes('timeout') || errorMessageLower.includes('connection')) {
            return 'network';
        } else if (errorMessageLower.includes('permission') || errorMessageLower.includes('access denied')) {
            return 'permission';
        } else if (errorMessageLower.includes('captcha')) {
            return 'captcha';
        } else if (errorMessageLower.includes('rate limit') || errorMessageLower.includes('too many')) {
            return 'rate_limited';
        } else {
            return 'unknown';
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            if (this.isConnected) {
                await mongoose.connection.close();
                this.isConnected = false;
            }
            console.log('[LEARNING SYSTEM] Cleanup completed');
        } catch (error) {
            console.error('[LEARNING SYSTEM] Cleanup failed:', error);
        }
    }
}

module.exports = LearningSystem;
