/**
 * Smart Execution Orchestrator
 * Executes strategies with intelligent fallback and error recovery
 */

const WebFetchService = require('./webFetchService');
const BrowserAutomationService = require('./browserAutomationService');
const ErrorAnalyzer = require('./errorAnalyzer');
const WebSearchService = require('./webSearchService');
const URLValidator = require('./urlValidator');
const CommandVerifier = require('./commandVerifier');

class SmartExecutionOrchestrator {
    constructor() {
        this.webFetchService = new WebFetchService();
        this.browserAutomationService = new BrowserAutomationService();
        this.errorAnalyzer = new ErrorAnalyzer();
        this.webSearchService = new WebSearchService();
        this.urlValidator = new URLValidator();
        this.commandVerifier = new CommandVerifier();
        
        this.executionHistory = [];
        this.strategyPerformance = new Map();
        this.activeExecutions = new Map();
    }

    /**
     * Execute command with intelligent fallback strategies
     * @param {string} userInput - Original user command
     * @param {Array} strategies - Array of strategies to try
     * @param {object} clientInfo - Client information
     * @returns {object} Execution result
     */
    async executeWithFallback(userInput, strategies, clientInfo = {}) {
        const executionId = this.generateExecutionId();
        const startTime = Date.now();
        
        console.log(`[ORCHESTRATOR] Starting execution ${executionId} with ${strategies.length} strategies`);
        
        const execution = {
            id: executionId,
            userInput: userInput,
            strategies: strategies,
            clientInfo: clientInfo,
            startTime: startTime,
            attempts: [],
            currentStrategyIndex: 0,
            status: 'running'
        };
        
        this.activeExecutions.set(executionId, execution);
        
        try {
            for (let i = 0; i < strategies.length; i++) {
                const strategy = strategies[i];
                execution.currentStrategyIndex = i;
                
                console.log(`[ORCHESTRATOR] Attempting strategy ${i + 1}/${strategies.length}: ${strategy.name}`);
                
                const attempt = {
                    strategyIndex: i,
                    strategyName: strategy.name,
                    startTime: Date.now(),
                    success: false,
                    result: null,
                    error: null,
                    duration: 0
                };
                
                try {
                    // Execute the strategy
                    const result = await this.executeStrategy(strategy, userInput, clientInfo);
                    
                    attempt.success = result.success;
                    attempt.result = result;
                    attempt.duration = Date.now() - attempt.startTime;
                    
                    if (result.success) {
                        console.log(`[ORCHESTRATOR] Strategy ${strategy.name} succeeded in ${attempt.duration}ms`);
                        
                        // Update strategy performance
                        this.updateStrategyPerformance(strategy.name, true, attempt.duration);
                        
                        // Update error resolution
                        this.errorAnalyzer.updateErrorResolution(
                            userInput, 
                            'success', 
                            strategy.name
                        );
                        
                        execution.status = 'success';
                        execution.endTime = Date.now();
                        execution.totalDuration = execution.endTime - execution.startTime;
                        execution.successfulStrategy = strategy;
                        execution.successfulAttempt = attempt;
                        
                        this.activeExecutions.delete(executionId);
                        this.executionHistory.push(execution);
                        
                        return {
                            success: true,
                            executionId: executionId,
                            strategy: strategy.name,
                            result: result,
                            duration: execution.totalDuration,
                            attempts: execution.attempts.length,
                            message: `Successfully executed using strategy: ${strategy.name}`
                        };
                    } else {
                        console.log(`[ORCHESTRATOR] Strategy ${strategy.name} failed: ${result.error}`);
                        attempt.error = result.error;
                        
                        // Analyze the error
                        const errorAnalysis = await this.errorAnalyzer.analyzeError(result.error, {
                            strategy: strategy.name,
                            userInput: userInput,
                            clientInfo: clientInfo
                        });
                        
                        attempt.errorAnalysis = errorAnalysis;
                        
                        // Update strategy performance
                        this.updateStrategyPerformance(strategy.name, false, attempt.duration);
                        
                        // Adjust next strategy based on error analysis
                        if (i < strategies.length - 1) {
                            strategies[i + 1] = this.adjustStrategyBasedOnError(
                                strategies[i + 1], 
                                errorAnalysis
                            );
                        }
                    }
                } catch (error) {
                    console.error(`[ORCHESTRATOR] Strategy ${strategy.name} threw error: ${error.message}`);
                    attempt.error = error.message;
                    attempt.duration = Date.now() - attempt.startTime;
                    
                    // Analyze the error
                    const errorAnalysis = await this.errorAnalyzer.analyzeError(error, {
                        strategy: strategy.name,
                        userInput: userInput,
                        clientInfo: clientInfo
                    });
                    
                    attempt.errorAnalysis = errorAnalysis;
                    
                    // Update strategy performance
                    this.updateStrategyPerformance(strategy.name, false, attempt.duration);
                }
                
                execution.attempts.push(attempt);
            }
            
            // All strategies failed
            console.log(`[ORCHESTRATOR] All ${strategies.length} strategies failed`);
            
            execution.status = 'failed';
            execution.endTime = Date.now();
            execution.totalDuration = execution.endTime - execution.startTime;
            
            this.activeExecutions.delete(executionId);
            this.executionHistory.push(execution);
            
            return {
                success: false,
                executionId: executionId,
                error: 'All strategies failed',
                duration: execution.totalDuration,
                attempts: execution.attempts.length,
                lastError: execution.attempts[execution.attempts.length - 1]?.error,
                suggestions: this.generateFailureSuggestions(execution)
            };
            
        } catch (error) {
            console.error(`[ORCHESTRATOR] Execution ${executionId} failed: ${error.message}`);
            
            execution.status = 'error';
            execution.endTime = Date.now();
            execution.totalDuration = execution.endTime - execution.startTime;
            execution.error = error.message;
            
            this.activeExecutions.delete(executionId);
            this.executionHistory.push(execution);
            
            return {
                success: false,
                executionId: executionId,
                error: error.message,
                duration: execution.totalDuration,
                attempts: execution.attempts.length
            };
        }
    }

    /**
     * Execute a single strategy
     */
    async executeStrategy(strategy, userInput, clientInfo) {
        try {
            console.log(`[ORCHESTRATOR] Executing strategy: "${strategy.name}"`);
            
            switch (strategy.name.toLowerCase()) {
                case 'direct download':
                case 'mirror/cdn download':
                    console.log('[ORCHESTRATOR] Using web fetch strategy');
                    return await this.executeWebFetchStrategy(strategy, userInput, clientInfo);
                
                case 'browser automation':
                    console.log('[ORCHESTRATOR] Using browser automation strategy');
                    return await this.executeBrowserAutomationStrategy(strategy, userInput, clientInfo);
                
                case 'package manager':
                    console.log('[ORCHESTRATOR] Using package manager strategy');
                    return await this.executePackageManagerStrategy(strategy, userInput, clientInfo);
                
                case 'search and scrape':
                    console.log('[ORCHESTRATOR] Using search and scrape strategy');
                    return await this.executeSearchAndScrapeStrategy(strategy, userInput, clientInfo);
                
                case 'ai research strategy':
                    console.log('[ORCHESTRATOR] Using AI research strategy');
                    return await this.executeAIResearchStrategy(strategy, userInput, clientInfo);
                
                case 'direct network command':
                case 'alternative network tool':
                case 'script wrapper':
                    console.log('[ORCHESTRATOR] Using network command strategy');
                    return await this.executeNetworkCommandStrategy(strategy, userInput, clientInfo);
                
                default:
                    console.log(`[ORCHESTRATOR] Using generic strategy for: "${strategy.name}"`);
                    return await this.executeGenericStrategy(strategy, userInput, clientInfo);
            }
        } catch (error) {
            console.error(`[ORCHESTRATOR] Strategy execution error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                strategy: strategy.name
            };
        }
    }

    /**
     * Execute web fetch strategy
     */
    async executeWebFetchStrategy(strategy, userInput, clientInfo) {
        try {
            // Extract URL from user input
            const url = this.extractUrlFromInput(userInput);
            if (!url) {
                return {
                    success: false,
                    error: 'No URL found in user input'
                };
            }
            
            const options = {
                outputDir: strategy.parameters?.outputDir || process.cwd(),
                timeout: strategy.parameters?.timeout || 30000
            };
            
            const result = await this.webFetchService.smartDownload(url, options);
            
            return {
                success: result.success,
                result: result,
                error: result.error,
                strategy: 'web_fetch'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'web_fetch'
            };
        }
    }

    /**
     * Execute browser automation strategy
     */
    async executeBrowserAutomationStrategy(strategy, userInput, clientInfo) {
        try {
            // Initialize browser if not already done
            const initResult = await this.browserAutomationService.initialize();
            if (!initResult.success) {
                return {
                    success: false,
                    error: `Browser initialization failed: ${initResult.error}`
                };
            }
            
            // Extract URL or search query
            const url = this.extractUrlFromInput(userInput);
            const searchQuery = this.extractSearchQuery(userInput);
            
            if (url) {
                // Navigate to URL
                const navResult = await this.browserAutomationService.navigateToUrl(url);
                if (!navResult.success) {
                    return {
                        success: false,
                        error: `Navigation failed: ${navResult.error}`
                    };
                }
                
                // Look for download links
                const downloadResult = await this.browserAutomationService.findAndClickDownload();
                if (downloadResult.success) {
                    return {
                        success: true,
                        result: downloadResult,
                        strategy: 'browser_automation'
                    };
                }
            } else if (searchQuery) {
                // Search for download links
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' download')}`;
                const navResult = await this.browserAutomationService.navigateToUrl(searchUrl);
                
                if (navResult.success) {
                    const linksResult = await this.browserAutomationService.extractDownloadLinks();
                    if (linksResult.success && linksResult.links.length > 0) {
                        return {
                            success: true,
                            result: linksResult,
                            strategy: 'browser_automation'
                        };
                    }
                }
            }
            
            return {
                success: false,
                error: 'No download links found via browser automation'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'browser_automation'
            };
        }
    }

    /**
     * Execute package manager strategy
     */
    async executePackageManagerStrategy(strategy, userInput, clientInfo) {
        try {
            // Extract application name
            const appName = this.extractApplicationName(userInput);
            if (!appName) {
                return {
                    success: false,
                    error: 'No application name found'
                };
            }
            
            console.log(`[ORCHESTRATOR] Attempting to install ${appName} via package managers`);
            
            // Try different package managers in order of preference
            const packageManagers = ['winget', 'choco', 'scoop', 'npm', 'pip'];
            
            for (const manager of packageManagers) {
                try {
                    // Check if package manager is available first
                    const available = await this.checkPackageManagerAvailable(manager);
                    if (!available) {
                        console.log(`[ORCHESTRATOR] Package manager ${manager} not available, skipping`);
                        continue;
                    }
                    
                    const command = this.generatePackageManagerCommand(manager, appName);
                    const result = await this.executeCommand(command);
                    
                    if (result.success) {
                        return {
                            success: true,
                            result: result,
                            strategy: 'package_manager',
                            manager: manager
                        };
                    }
                } catch (error) {
                    console.log(`[ORCHESTRATOR] Package manager ${manager} failed: ${error.message}`);
                    continue;
                }
            }
            
            return {
                success: false,
                error: 'All package managers failed'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'package_manager'
            };
        }
    }

    /**
     * Execute search and scrape strategy
     */
    async executeSearchAndScrapeStrategy(strategy, userInput, clientInfo) {
        try {
            // Extract software name from user input
            const softwareName = this.extractApplicationName(userInput);
            if (!softwareName) {
                return {
                    success: false,
                    error: 'No software name found in user input'
                };
            }
            
            console.log(`[ORCHESTRATOR] Searching for ${softwareName} download URLs...`);
            
            // Use web search service to find download URLs
            const searchResult = await this.webSearchService.searchForSoftware(softwareName, 'windows');
            
            if (!searchResult.success || searchResult.urls.length === 0) {
                return {
                    success: false,
                    error: 'No download URLs found via search'
                };
            }
            
            console.log(`[ORCHESTRATOR] Found ${searchResult.urls.length} potential download URLs`);
            
            // Try downloading from found URLs (in order of confidence)
            for (const urlInfo of searchResult.urls.slice(0, 3)) { // Try top 3 URLs
                try {
                    console.log(`[ORCHESTRATOR] Attempting download from ${urlInfo.url} (confidence: ${urlInfo.confidence})`);
                    
                    // Validate URL first
                    const validation = await this.urlValidator.validateDownloadUrl(urlInfo.url);
                    if (!validation.valid) {
                        console.log(`[ORCHESTRATOR] URL validation failed: ${validation.errors.join(', ')}`);
                        continue;
                    }
                    
                    // If URL requires extraction (e.g., download page, not direct link)
                    if (urlInfo.requiresExtraction) {
                        console.log(`[ORCHESTRATOR] URL requires extraction, using browser automation`);
                        const extractResult = await this.extractDownloadLinkFromPage(urlInfo.url, softwareName);
                        if (extractResult.success && extractResult.directUrl) {
                            urlInfo.url = extractResult.directUrl;
                        }
                    }
                    
                    // Attempt download
                    const result = await this.webFetchService.smartDownload(urlInfo.url);
                    if (result.success) {
                        console.log(`[ORCHESTRATOR] Successfully downloaded from ${urlInfo.url}`);
                        return {
                            success: true,
                            result: result,
                            strategy: 'search_and_scrape',
                            sourceUrl: urlInfo.url,
                            confidence: urlInfo.confidence
                        };
                    }
                } catch (error) {
                    console.log(`[ORCHESTRATOR] Download from ${urlInfo.url} failed: ${error.message}`);
                    continue;
                }
            }
            
            return {
                success: false,
                error: 'All found URLs failed to download',
                attemptedUrls: searchResult.urls.slice(0, 3).map(u => u.url)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'search_and_scrape'
            };
        }
    }
    
    /**
     * Extract direct download link from a download page
     */
    async extractDownloadLinkFromPage(pageUrl, softwareName) {
        try {
            // Use browser automation to find and extract download link
            const initResult = await this.browserAutomationService.initialize();
            if (!initResult.success) {
                return { success: false, error: 'Browser initialization failed' };
            }
            
            const navResult = await this.browserAutomationService.navigateToUrl(pageUrl);
            if (!navResult.success) {
                return { success: false, error: 'Navigation failed' };
            }
            
            const downloadResult = await this.browserAutomationService.findAndClickDownload();
            if (downloadResult.success && downloadResult.downloadUrl) {
                return {
                    success: true,
                    directUrl: downloadResult.downloadUrl
                };
            }
            
            return { success: false, error: 'Could not extract download link' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute AI research strategy
     */
    async executeAIResearchStrategy(strategy, userInput, clientInfo) {
        try {
            // This would integrate with the Ollama AI processor
            // For now, return a placeholder
            return {
                success: false,
                error: 'AI research strategy not yet implemented',
                strategy: 'ai_research'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'ai_research'
            };
        }
    }

    /**
     * Execute network command strategy
     */
    async executeNetworkCommandStrategy(strategy, userInput, clientInfo) {
        try {
            // Generate appropriate network command based on user input
            const commandObj = this.generateNetworkCommand(userInput, strategy);
            if (!commandObj) {
                return {
                    success: false,
                    error: 'Could not generate network command'
                };
            }
            
            // Verify command before execution
            const verification = await this.commandVerifier.verifyCommand(commandObj.command, {
                intent: 'network',
                userInput: userInput
            });
            
            if (!verification.valid) {
                console.log(`[ORCHESTRATOR] Command verification failed: ${verification.errors.join(', ')}`);
                return {
                    success: false,
                    error: `Command verification failed: ${verification.errors.join(', ')}`,
                    verification: verification
                };
            }
            
            if (verification.warnings.length > 0) {
                console.log(`[ORCHESTRATOR] Command warnings: ${verification.warnings.join(', ')}`);
            }
            
            // Return the command object for execution by the client
            return {
                success: true,
                command: commandObj.command,
                type: commandObj.type,
                timeout: commandObj.timeout,
                category: commandObj.category,
                action: commandObj.action,
                explanation: commandObj.explanation,
                strategy: strategy.name,
                verification: verification
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: strategy.name
            };
        }
    }

    /**
     * Generate network command from user input
     */
    generateNetworkCommand(userInput, strategy) {
        const input = userInput.toLowerCase().trim();
        
        // Handle ping commands
        if (input.includes('ping')) {
            const target = this.extractTargetFromInput(userInput);
            const targetHost = target || 'google.com';
            return {
                command: `ping ${targetHost}`,
                type: 'batch',
                timeout: 30,
                category: 'network',
                action: 'ping',
                explanation: `Pinging ${targetHost} to test network connectivity`
            };
        }
        
        // Handle nslookup commands
        if (input.includes('nslookup') || input.includes('dns')) {
            const target = this.extractTargetFromInput(userInput);
            const targetHost = target || 'google.com';
            return {
                command: `nslookup ${targetHost}`,
                type: 'batch',
                timeout: 30,
                category: 'network',
                action: 'nslookup',
                explanation: `Looking up DNS records for ${targetHost}`
            };
        }
        
        // Handle ipconfig commands
        if (input.includes('ipconfig') || input.includes('ip config')) {
            return {
                command: 'ipconfig /all',
                type: 'batch',
                timeout: 30,
                category: 'network',
                action: 'ipconfig',
                explanation: 'Displaying all network configuration information'
            };
        }
        
        // Handle netstat commands
        if (input.includes('netstat') || input.includes('net stat')) {
            return {
                command: 'netstat -an',
                type: 'batch',
                timeout: 30,
                category: 'network',
                action: 'netstat',
                explanation: 'Displaying all active network connections'
            };
        }
        
        // Handle tracert commands
        if (input.includes('tracert') || input.includes('trace route')) {
            const target = this.extractTargetFromInput(userInput);
            const targetHost = target || 'google.com';
            return {
                command: `tracert ${targetHost}`,
                type: 'batch',
                timeout: 60,
                category: 'network',
                action: 'tracert',
                explanation: `Tracing route to ${targetHost}`
            };
        }
        
        // Default to ping if no specific command detected
        return {
            command: 'ping google.com',
            type: 'batch',
            timeout: 30,
            category: 'network',
            action: 'ping',
            explanation: 'Pinging google.com to test network connectivity'
        };
    }

    /**
     * Extract target from user input
     */
    extractTargetFromInput(userInput) {
        const words = userInput.split(/\s+/);
        
        // Look for domain names or IP addresses
        for (const word of words) {
            if (word.includes('.') && !word.includes(' ')) {
                return word;
            }
        }
        
        return null;
    }

    /**
     * Execute generic strategy
     */
    async executeGenericStrategy(strategy, userInput, clientInfo) {
        try {
            // Try to extract a command from the strategy
            const command = this.generateCommandFromStrategy(strategy, userInput);
            if (!command) {
                return {
                    success: false,
                    error: 'Could not generate command from strategy'
                };
            }
            
            // Return the command object for execution by the client
            return {
                success: true,
                command: command.command,
                type: command.type,
                timeout: command.timeout,
                category: command.category,
                action: command.action,
                explanation: command.explanation,
                strategy: strategy.name
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'generic'
            };
        }
    }

    /**
     * Generate command from strategy
     */
    generateCommandFromStrategy(strategy, userInput) {
        console.log('[ORCHESTRATOR] Method called with strategy:', strategy.name);
        
        // Simple test - just return a basic command
        return {
            command: `ping google.com`,
            type: 'batch',
            timeout: 30,
            category: 'network',
            action: 'ping',
            explanation: `Generated ping command for ${userInput}`
        };
    }

    /**
     * Adjust strategy based on error analysis
     */
    adjustStrategyBasedOnError(strategy, errorAnalysis) {
        const adjustedStrategy = { ...strategy };
        
        // Adjust based on error category
        switch (errorAnalysis.category) {
            case 'network':
                adjustedStrategy.parameters.timeout = (adjustedStrategy.parameters.timeout || 30000) * 2;
                adjustedStrategy.parameters.retries = (adjustedStrategy.parameters.retries || 3) + 1;
                break;
                
            case 'permission':
                if (adjustedStrategy.tools.includes('system_tools')) {
                    adjustedStrategy.tools = adjustedStrategy.tools.filter(tool => tool !== 'system_tools');
                    adjustedStrategy.tools.push('browser_automation');
                }
                break;
                
            case 'file_not_found':
                if (!adjustedStrategy.tools.includes('browser_automation')) {
                    adjustedStrategy.tools.push('browser_automation');
                }
                break;
                
            case 'captcha':
                adjustedStrategy.tools = ['browser_automation'];
                adjustedStrategy.parameters.headless = false; // Might need visual mode
                break;
        }
        
        // Add error-specific parameters
        adjustedStrategy.parameters.lastError = errorAnalysis.category;
        adjustedStrategy.parameters.adaptationCount = (adjustedStrategy.parameters.adaptationCount || 0) + 1;
        
        return adjustedStrategy;
    }

    /**
     * Extract URL from user input
     */
    extractUrlFromInput(userInput) {
        const urlPattern = /(https?:\/\/[^\s]+)/gi;
        const matches = userInput.match(urlPattern);
        return matches ? matches[0] : null;
    }

    /**
     * Extract search query from user input
     */
    extractSearchQuery(userInput) {
        // Remove common words and extract meaningful terms
        const words = userInput.toLowerCase().split(/\s+/);
        const meaningfulWords = words.filter(word => 
            word.length > 2 && 
            !['the', 'and', 'or', 'but', 'for', 'with', 'from', 'to', 'in', 'on', 'at', 'by', 'download', 'install'].includes(word)
        );
        
        return meaningfulWords.join(' ');
    }

    /**
     * Extract application name from user input
     */
    extractApplicationName(userInput) {
        const appPattern = /\b(chrome|firefox|opera|edge|vscode|notepad|calculator|word|excel|powerpoint|vlc|spotify|discord|telegram)\b/gi;
        const matches = userInput.match(appPattern);
        return matches ? matches[0].toLowerCase() : null;
    }

    /**
     * Generate package manager command
     */
    generatePackageManagerCommand(manager, appName) {
        const commands = {
            winget: `winget install --id ${this.getWingetPackageId(appName)} -e --silent --accept-package-agreements --accept-source-agreements`,
            choco: `choco install ${this.getChocoPackageName(appName)} -y --no-progress`,
            scoop: `scoop install ${appName}`,
            npm: `npm install -g ${appName}`,
            pip: `pip install ${appName}`
        };
        
        return commands[manager] || `choco install ${appName} -y`;
    }

    /**
     * Check if package manager is available
     */
    async checkPackageManagerAvailable(manager) {
        try {
            const commands = {
                winget: 'winget --version',
                choco: 'choco --version',
                scoop: 'scoop --version',
                npm: 'npm --version',
                pip: 'pip --version'
            };
            
            const command = commands[manager];
            if (!command) return false;
            
            const result = await this.executeCommand(command);
            return result.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get winget package ID for common applications
     */
    getWingetPackageId(appName) {
        const packageMap = {
            'chrome': 'Google.Chrome',
            'firefox': 'Mozilla.Firefox',
            'opera': 'Opera.Opera',
            'edge': 'Microsoft.Edge',
            'brave': 'Brave.Brave',
            'vscode': 'Microsoft.VisualStudioCode',
            'notepad': 'Microsoft.WindowsNotepad',
            'vlc': 'VideoLAN.VLC',
            'spotify': 'Spotify.Spotify',
            'discord': 'Discord.Discord',
            'telegram': 'Telegram.Telegram'
        };
        
        return packageMap[appName.toLowerCase()] || appName;
    }

    /**
     * Get chocolatey package name for common applications
     */
    getChocoPackageName(appName) {
        const packageMap = {
            'chrome': 'googlechrome',
            'firefox': 'firefox',
            'opera': 'opera',
            'edge': 'microsoft-edge',
            'brave': 'brave',
            'vscode': 'vscode',
            'notepad': 'notepadplusplus',
            'vlc': 'vlc',
            'spotify': 'spotify',
            'discord': 'discord',
            'telegram': 'telegram'
        };
        
        return packageMap[appName.toLowerCase()] || appName;
    }

    /**
     * Generate command from strategy
     */
    generateCommandFromStrategy(strategy, userInput) {
        // This is a simplified implementation
        // In a real system, this would be more sophisticated
        if (strategy.description.includes('download')) {
            const url = this.extractUrlFromInput(userInput);
            if (url) {
                return `Invoke-WebRequest -Uri "${url}" -OutFile "download.exe"`;
            }
        }
        
        return null;
    }

    /**
     * Execute command
     */
    async executeCommand(command) {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
            const { stdout, stderr } = await execAsync(command);
            return {
                success: true,
                stdout: stdout,
                stderr: stderr
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stdout: error.stdout,
                stderr: error.stderr
            };
        }
    }

    /**
     * Update strategy performance
     */
    updateStrategyPerformance(strategyName, success, duration) {
        if (!this.strategyPerformance.has(strategyName)) {
            this.strategyPerformance.set(strategyName, {
                attempts: 0,
                successes: 0,
                failures: 0,
                totalDuration: 0,
                averageDuration: 0
            });
        }
        
        const performance = this.strategyPerformance.get(strategyName);
        performance.attempts++;
        performance.totalDuration += duration;
        performance.averageDuration = performance.totalDuration / performance.attempts;
        
        if (success) {
            performance.successes++;
        } else {
            performance.failures++;
        }
    }

    /**
     * Generate failure suggestions
     */
    generateFailureSuggestions(execution) {
        const suggestions = [];
        
        // Analyze all errors
        const errorCategories = execution.attempts
            .map(attempt => attempt.errorAnalysis?.category)
            .filter(category => category);
        
        const uniqueCategories = [...new Set(errorCategories)];
        
        for (const category of uniqueCategories) {
            const errorAnalysis = execution.attempts.find(a => a.errorAnalysis?.category === category)?.errorAnalysis;
            if (errorAnalysis) {
                suggestions.push(...errorAnalysis.suggestions);
            }
        }
        
        // Add general suggestions
        suggestions.push(
            'Try manual intervention',
            'Check system requirements',
            'Verify network connectivity',
            'Contact support if issue persists'
        );
        
        return [...new Set(suggestions)]; // Remove duplicates
    }

    /**
     * Generate execution ID
     */
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get execution statistics
     */
    getExecutionStatistics() {
        const stats = {
            totalExecutions: this.executionHistory.length,
            activeExecutions: this.activeExecutions.size,
            successRate: 0,
            averageDuration: 0,
            strategyPerformance: {},
            errorCategories: {}
        };
        
        if (this.executionHistory.length > 0) {
            const successful = this.executionHistory.filter(e => e.status === 'success').length;
            stats.successRate = successful / this.executionHistory.length;
            
            const totalDuration = this.executionHistory.reduce((sum, e) => sum + (e.totalDuration || 0), 0);
            stats.averageDuration = totalDuration / this.executionHistory.length;
        }
        
        // Strategy performance
        for (const [strategy, performance] of this.strategyPerformance.entries()) {
            stats.strategyPerformance[strategy] = {
                attempts: performance.attempts,
                successRate: performance.attempts > 0 ? performance.successes / performance.attempts : 0,
                averageDuration: performance.averageDuration
            };
        }
        
        // Error categories
        for (const execution of this.executionHistory) {
            for (const attempt of execution.attempts) {
                if (attempt.errorAnalysis?.category) {
                    const category = attempt.errorAnalysis.category;
                    if (!stats.errorCategories[category]) {
                        stats.errorCategories[category] = 0;
                    }
                    stats.errorCategories[category]++;
                }
            }
        }
        
        return stats;
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            await this.browserAutomationService.close();
            console.log('[ORCHESTRATOR] Cleanup completed');
        } catch (error) {
            console.error('[ORCHESTRATOR] Cleanup failed:', error);
        }
    }
}

module.exports = SmartExecutionOrchestrator;
