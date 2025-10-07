const EventEmitter = require('events');

/**
 * Command Queue Manager
 * Handles complex command queues, dependencies, and execution orchestration
 */
class CommandQueueManager extends EventEmitter {
    constructor() {
        super();
        this.queues = new Map(); // Store command queues
        this.executingQueues = new Set(); // Track currently executing queues
        this.queueHistory = new Map(); // Store queue execution history
        this.dependencyGraph = new Map(); // Track command dependencies
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2
        };
    }

    /**
     * Create a new command queue
     */
    createQueue(queueId, commands, options = {}) {
        try {
            console.log('[QUEUE MANAGER] Creating queue:', queueId, 'with', commands.length, 'commands');
            
            const queue = {
                id: queueId,
                commands: commands,
                status: 'pending',
                createdAt: new Date().toISOString(),
                options: {
                    maxConcurrent: options.maxConcurrent || 1,
                    retryPolicy: options.retryPolicy || this.retryConfig,
                    timeout: options.timeout || 300000, // 5 minutes default
                    priority: options.priority || 'normal',
                    dependencies: options.dependencies || [],
                    ...options
                },
                execution: {
                    currentStep: 0,
                    completedSteps: [],
                    failedSteps: [],
                    retryCount: 0,
                    startTime: null,
                    endTime: null,
                    results: []
                }
            };

            // Build dependency graph
            this.buildDependencyGraph(queue);
            
            // Store queue
            this.queues.set(queueId, queue);
            
            this.emit('queueCreated', { queueId, queue });
            
            return {
                success: true,
                queueId: queueId,
                queue: queue
            };

        } catch (error) {
            console.error('[QUEUE MANAGER] Error creating queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute a command queue
     */
    async executeQueue(queueId, clientInfo) {
        try {
            const queue = this.queues.get(queueId);
            if (!queue) {
                throw new Error('Queue not found');
            }

            if (this.executingQueues.has(queueId)) {
                throw new Error('Queue is already executing');
            }

            console.log('[QUEUE MANAGER] Executing queue:', queueId);
            
            // Mark queue as executing
            this.executingQueues.add(queueId);
            queue.status = 'executing';
            queue.execution.startTime = new Date().toISOString();
            
            this.emit('queueStarted', { queueId, queue });

            // Execute commands based on dependencies
            const executionResult = await this.executeCommands(queue, clientInfo);
            
            // Update queue status
            queue.status = executionResult.success ? 'completed' : 'failed';
            queue.execution.endTime = new Date().toISOString();
            queue.execution.results = executionResult.results;
            
            // Store in history
            this.queueHistory.set(queueId, {
                queueId: queueId,
                queue: queue,
                executionResult: executionResult,
                executedAt: new Date().toISOString()
            });

            this.emit('queueCompleted', { queueId, queue, executionResult });
            
            return executionResult;

        } catch (error) {
            console.error('[QUEUE MANAGER] Error executing queue:', error);
            
            const queue = this.queues.get(queueId);
            if (queue) {
                queue.status = 'failed';
                queue.execution.endTime = new Date().toISOString();
            }
            
            this.emit('queueFailed', { queueId, error: error.message });
            
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.executingQueues.delete(queueId);
        }
    }

    /**
     * Execute commands in the queue
     */
    async executeCommands(queue, clientInfo) {
        const results = [];
        const executionOrder = this.getExecutionOrder(queue);
        
        for (const commandGroup of executionOrder) {
            if (commandGroup.type === 'sequential') {
                // Execute commands sequentially
                for (const command of commandGroup.commands) {
                    const result = await this.executeCommand(command, clientInfo, queue);
                    results.push(result);
                    
                    if (!result.success && queue.options.stopOnError) {
                        return {
                            success: false,
                            results: results,
                            error: 'Stopped on error'
                        };
                    }
                }
            } else if (commandGroup.type === 'parallel') {
                // Execute commands in parallel
                const parallelResults = await Promise.allSettled(
                    commandGroup.commands.map(command => 
                        this.executeCommand(command, clientInfo, queue)
                    )
                );
                
                for (const result of parallelResults) {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        results.push({
                            success: false,
                            error: result.reason.message,
                            command: commandGroup.commands[0] // Approximate
                        });
                    }
                }
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        return {
            success: successCount === totalCount,
            results: results,
            successCount: successCount,
            totalCount: totalCount
        };
    }

    /**
     * Execute a single command
     */
    async executeCommand(command, clientInfo, queue) {
        try {
            console.log('[QUEUE MANAGER] Executing command:', command.id || command.action);
            
            // Update queue progress
            queue.execution.currentStep++;
            const progress = (queue.execution.currentStep / queue.commands.length) * 100;
            
            this.emit('commandStarted', { 
                queueId: queue.id, 
                command: command, 
                progress: progress 
            });

            // Simulate command execution (replace with actual execution logic)
            const executionResult = await this.simulateCommandExecution(command, clientInfo);
            
            // Update queue state
            if (executionResult.success) {
                queue.execution.completedSteps.push(command.id || command.action);
            } else {
                queue.execution.failedSteps.push(command.id || command.action);
            }
            
            this.emit('commandCompleted', { 
                queueId: queue.id, 
                command: command, 
                result: executionResult 
            });
            
            return executionResult;

        } catch (error) {
            console.error('[QUEUE MANAGER] Error executing command:', error);
            
            const errorResult = {
                success: false,
                error: error.message,
                command: command
            };
            
            queue.execution.failedSteps.push(command.id || command.action);
            
            this.emit('commandFailed', { 
                queueId: queue.id, 
                command: command, 
                error: error.message 
            });
            
            return errorResult;
        }
    }

    /**
     * Simulate command execution (replace with actual execution)
     */
    async simulateCommandExecution(command, clientInfo) {
        // Simulate execution time
        const executionTime = command.estimatedTime || 1000;
        await new Promise(resolve => setTimeout(resolve, executionTime));
        
        // Simulate success/failure based on command properties
        const success = Math.random() > 0.1; // 90% success rate
        
        return {
            success: success,
            command: command,
            executionTime: executionTime,
            output: success ? `Command ${command.action} completed successfully` : 'Command failed',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Build dependency graph for the queue
     */
    buildDependencyGraph(queue) {
        const graph = new Map();
        
        for (const command of queue.commands) {
            graph.set(command.id || command.action, {
                command: command,
                dependencies: command.dependsOn || [],
                dependents: []
            });
        }
        
        // Build dependents
        for (const command of queue.commands) {
            const dependencies = command.dependsOn || [];
            for (const dep of dependencies) {
                if (graph.has(dep)) {
                    graph.get(dep).dependents.push(command.id || command.action);
                }
            }
        }
        
        this.dependencyGraph.set(queue.id, graph);
    }

    /**
     * Get execution order based on dependencies
     */
    getExecutionOrder(queue) {
        const graph = this.dependencyGraph.get(queue.id);
        if (!graph) {
            return [{
                type: 'sequential',
                commands: queue.commands
            }];
        }

        const visited = new Set();
        const executionGroups = [];
        const remainingCommands = new Set(Object.keys(graph));
        
        while (remainingCommands.size > 0) {
            const readyCommands = [];
            
            // Find commands with no unmet dependencies
            for (const [commandId, node] of graph) {
                if (remainingCommands.has(commandId)) {
                    const unmetDeps = node.dependencies.filter(dep => 
                        remainingCommands.has(dep) && !visited.has(dep)
                    );
                    
                    if (unmetDeps.length === 0) {
                        readyCommands.push(node.command);
                    }
                }
            }
            
            if (readyCommands.length === 0) {
                // Circular dependency or error - execute remaining sequentially
                const remaining = Array.from(remainingCommands).map(id => graph.get(id).command);
                executionGroups.push({
                    type: 'sequential',
                    commands: remaining
                });
                break;
            }
            
            // Mark commands as visited
            for (const command of readyCommands) {
                visited.add(command.id || command.action);
                remainingCommands.delete(command.id || command.action);
            }
            
            // Determine if commands can run in parallel
            if (readyCommands.length === 1) {
                executionGroups.push({
                    type: 'sequential',
                    commands: readyCommands
                });
            } else {
                executionGroups.push({
                    type: 'parallel',
                    commands: readyCommands
                });
            }
        }
        
        return executionGroups;
    }

    /**
     * Retry failed commands
     */
    async retryFailedCommands(queueId, clientInfo) {
        try {
            const queue = this.queues.get(queueId);
            if (!queue) {
                throw new Error('Queue not found');
            }

            const failedCommands = queue.execution.failedSteps;
            if (failedCommands.length === 0) {
                return {
                    success: true,
                    message: 'No failed commands to retry'
                };
            }

            console.log('[QUEUE MANAGER] Retrying', failedCommands.length, 'failed commands');
            
            // Reset failed steps
            queue.execution.failedSteps = [];
            queue.execution.retryCount++;
            
            // Retry failed commands
            const retryResults = [];
            for (const commandId of failedCommands) {
                const command = queue.commands.find(c => (c.id || c.action) === commandId);
                if (command) {
                    const result = await this.executeCommand(command, clientInfo, queue);
                    retryResults.push(result);
                }
            }
            
            return {
                success: true,
                retryResults: retryResults,
                retryCount: queue.execution.retryCount
            };

        } catch (error) {
            console.error('[QUEUE MANAGER] Error retrying commands:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pause queue execution
     */
    pauseQueue(queueId) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            return { success: false, error: 'Queue not found' };
        }

        if (queue.status !== 'executing') {
            return { success: false, error: 'Queue is not executing' };
        }

        queue.status = 'paused';
        this.emit('queuePaused', { queueId, queue });
        
        return { success: true, queueId: queueId };
    }

    /**
     * Resume queue execution
     */
    async resumeQueue(queueId, clientInfo) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            return { success: false, error: 'Queue not found' };
        }

        if (queue.status !== 'paused') {
            return { success: false, error: 'Queue is not paused' };
        }

        queue.status = 'executing';
        this.emit('queueResumed', { queueId, queue });
        
        // Continue execution from where it left off
        return await this.executeQueue(queueId, clientInfo);
    }

    /**
     * Cancel queue execution
     */
    cancelQueue(queueId) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            return { success: false, error: 'Queue not found' };
        }

        queue.status = 'cancelled';
        queue.execution.endTime = new Date().toISOString();
        
        this.executingQueues.delete(queueId);
        this.emit('queueCancelled', { queueId, queue });
        
        return { success: true, queueId: queueId };
    }

    /**
     * Get queue status
     */
    getQueueStatus(queueId) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            return { success: false, error: 'Queue not found' };
        }

        const progress = queue.commands.length > 0 ? 
            (queue.execution.completedSteps.length / queue.commands.length) * 100 : 0;

        return {
            success: true,
            queueId: queueId,
            status: queue.status,
            progress: progress,
            completedSteps: queue.execution.completedSteps.length,
            totalSteps: queue.commands.length,
            failedSteps: queue.execution.failedSteps.length,
            retryCount: queue.execution.retryCount,
            startTime: queue.execution.startTime,
            endTime: queue.execution.endTime,
            isExecuting: this.executingQueues.has(queueId)
        };
    }

    /**
     * Get all queues
     */
    getAllQueues() {
        const queues = [];
        
        for (const [queueId, queue] of this.queues) {
            const status = this.getQueueStatus(queueId);
            queues.push({
                queueId: queueId,
                ...status,
                createdAt: queue.createdAt,
                options: queue.options
            });
        }
        
        return {
            success: true,
            queues: queues,
            totalQueues: queues.length,
            executingQueues: this.executingQueues.size
        };
    }

    /**
     * Clear completed queues
     */
    clearCompletedQueues() {
        const toDelete = [];
        
        for (const [queueId, queue] of this.queues) {
            if (['completed', 'failed', 'cancelled'].includes(queue.status)) {
                toDelete.push(queueId);
            }
        }
        
        for (const queueId of toDelete) {
            this.queues.delete(queueId);
            this.dependencyGraph.delete(queueId);
        }
        
        return {
            success: true,
            clearedCount: toDelete.length,
            clearedQueues: toDelete
        };
    }

    /**
     * Get queue manager statistics
     */
    getStatistics() {
        const queues = Array.from(this.queues.values());
        const history = Array.from(this.queueHistory.values());
        
        const statusCounts = queues.reduce((counts, queue) => {
            counts[queue.status] = (counts[queue.status] || 0) + 1;
            return counts;
        }, {});
        
        const averageExecutionTime = history.length > 0 ?
            history.reduce((sum, entry) => {
                const start = new Date(entry.queue.execution.startTime);
                const end = new Date(entry.queue.execution.endTime);
                return sum + (end - start);
            }, 0) / history.length : 0;
        
        return {
            totalQueues: this.queues.size,
            executingQueues: this.executingQueues.size,
            completedQueues: history.length,
            statusDistribution: statusCounts,
            averageExecutionTime: averageExecutionTime,
            totalCommands: queues.reduce((sum, queue) => sum + queue.commands.length, 0),
            successfulCommands: queues.reduce((sum, queue) => sum + queue.execution.completedSteps.length, 0),
            failedCommands: queues.reduce((sum, queue) => sum + queue.execution.failedSteps.length, 0),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = CommandQueueManager;
