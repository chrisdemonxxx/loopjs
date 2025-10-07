import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import aiService from '../services/aiService';

interface NaturalLanguageTerminalProps {
  selectedAgent: any;
  onCommandSent: (command: any) => void;
  commandHistory: any[];
  setCommandHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

interface CommandHistory {
  id: string;
  userInput: string;
  aiResponse: any;
  timestamp: string;
  status: 'pending' | 'success' | 'error';
  output?: string;
}

const NaturalLanguageTerminal: React.FC<NaturalLanguageTerminalProps> = ({ selectedAgent, onCommandSent, commandHistory, setCommandHistory }) => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  // Check AI availability on mount
  useEffect(() => {
    checkAIAvailability();
  }, []);

  const checkAIAvailability = async () => {
    try {
      const response = await aiService.testConnection();
      setAiStatus(response ? 'available' : 'unavailable');
    } catch (error) {
      console.error('[NATURAL LANGUAGE TERMINAL] Error checking AI availability:', error);
      setAiStatus('unavailable');
    }
  };

  const handleNaturalLanguageCommand = async () => {
    if (!selectedAgent) {
      toast.error('No agent selected');
      return;
    }

    if (!userInput.trim()) {
      toast.error('Please enter a command');
      return;
    }

    setIsProcessing(true);
    const commandId = `nl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to command history
    const commandEntry: CommandHistory = {
      id: commandId,
      userInput: userInput.trim(),
      aiResponse: null,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    setCommandHistory(prev => [commandEntry, ...prev]);

    try {
      // Process with True AI
      const clientInfo = {
        uuid: selectedAgent.id,
        platform: selectedAgent.platform || 'unknown',
        systemInfo: selectedAgent.systemInfo || {}
      };

      console.log('[NATURAL LANGUAGE TERMINAL] Starting AI processing...');
      console.log('[NATURAL LANGUAGE TERMINAL] User input:', userInput.trim());
      console.log('[NATURAL LANGUAGE TERMINAL] Selected agent:', selectedAgent);
      
      const aiResult = await aiService.processNaturalLanguage(
        userInput.trim(),
        clientInfo,
        { category: 'general' }
      );
      
      console.log('[NATURAL LANGUAGE TERMINAL] Raw AI result:', aiResult);
      
      // Handle intelligent agent response format
      let processedResult;
      if (aiResult.success !== undefined) {
        // Backend returned { success: true, data: result } format
        if (!aiResult.success) {
          console.error('[NATURAL LANGUAGE TERMINAL] AI processing failed:', aiResult.error);
          throw new Error(aiResult.error || 'AI processing failed');
        }
        processedResult = aiResult.data;
      } else if (aiResult.data) {
        // Backend returned { data: result } format (from Hugging Face)
        processedResult = aiResult.data;
      } else {
        // Direct result format
        processedResult = aiResult;
      }

      console.log('[NATURAL LANGUAGE TERMINAL] Processed AI response:', processedResult);

      // Update command history with AI response
      setCommandHistory(prev => prev.map(cmd => 
        cmd.id === commandId 
          ? { ...cmd, aiResponse: processedResult, status: 'success' }
          : cmd
      ));

      // Send command via callback (like Terminal component)
      if (onCommandSent) {
        // Handle intelligent agent response format
        let commandData;
        
        if (processedResult.command) {
          // Direct command from intelligent agent
          commandData = {
            command: processedResult.command,
            type: processedResult.type || 'batch',
            timeout: processedResult.timeout || 30,
            category: processedResult.category || 'natural_language',
            action: processedResult.action || 'execute',
            explanation: processedResult.explanation || processedResult.message || 'AI processed command',
            analysis: processedResult.analysis,
            strategies: processedResult.strategies,
            execution: processedResult.execution,
            multiStage: processedResult.multiStage,
            stages: processedResult.stages
          };
        } else if (processedResult.optimizedCommand) {
          // Traditional AI response format
          commandData = processedResult.optimizedCommand;
        } else {
          // Fallback
          commandData = processedResult;
        }
        
        onCommandSent({
          id: commandId,
          command: commandData.command,
          type: commandData.type || 'cmd',
          timeout: commandData.timeout || 30,
          category: commandData.category || 'natural_language',
          action: commandData.action || 'execute',
          userInput: userInput,
          aiCommand: commandData.command,
          aiExplanation: commandData.explanation || 'AI processed command',
          aiAnalysis: commandData.analysis,
          aiStrategies: commandData.strategies,
          aiExecution: commandData.execution,
          aiMultiStage: commandData.multiStage,
          aiStages: commandData.stages,
          timestamp: new Date().toISOString()
        });
        console.log('[NATURAL LANGUAGE TERMINAL] Command sent via callback');
        toast.success('AI processed command and sent successfully');
      } else {
        throw new Error('No command callback provided');
      }

      // Clear input
      setUserInput('');

    } catch (error) {
      console.error('[NATURAL LANGUAGE TERMINAL] Error processing command:', error);
      toast.error(`Failed to process command: ${error.message}`);
      
      // Update command history with error
      setCommandHistory(prev => prev.map(cmd => 
        cmd.id === commandId 
          ? { ...cmd, status: 'error', output: error.message }
          : cmd
      ));
      
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNaturalLanguageCommand();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="natural-language-terminal bg-gray-900 text-white p-6 rounded-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🧠 AI-Powered Natural Language Terminal</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              aiStatus === 'available' ? 'bg-green-500' : 
              aiStatus === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm">
              {aiStatus === 'available' ? 'AI Available' : 
               aiStatus === 'unavailable' ? 'AI Unavailable' : 'Checking AI...'}
            </span>
          </div>
        </div>
        
        <p className="text-gray-400 mb-4">
          Just type what you want to do in plain English. The AI will understand and execute the appropriate commands.
        </p>
        
        {selectedAgent && (
          <div className="bg-blue-900 p-3 rounded mb-4">
            <span className="text-blue-200">Target Agent: </span>
            <span className="font-semibold">{selectedAgent.computerName}</span>
            <span className="text-gray-400 ml-2">({selectedAgent.ipAddress})</span>
          </div>
        )}

        {aiStatus === 'unavailable' && (
          <div className="bg-yellow-900 p-3 rounded mb-4">
            <span className="text-yellow-200">⚠️ AI Mode Unavailable: </span>
            <span className="text-gray-300">
              OpenAI API key not configured. Using rule-based fallback. 
              <a href="#" className="text-blue-400 underline ml-1">Configure OpenAI API</a>
            </span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your command in natural language... (e.g., 'Download PuTTY from the internet and run it', 'Show me system information', 'List all files in C drive')"
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isProcessing}
            />
          </div>
          <button
            onClick={handleNaturalLanguageCommand}
            disabled={isProcessing || !userInput.trim()}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isProcessing ? '⏳ Processing...' : '🚀 Execute'}
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-400">
          💡 Examples: "Download Chrome", "Show CPU info", "List running processes", "Ping google.com"
        </div>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">📋 Command History</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {commandHistory.map((cmd) => (
              <div key={cmd.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={getStatusColor(cmd.status)}>
                      {getStatusIcon(cmd.status)}
                    </span>
                    <span className="text-blue-400 font-semibold">
                      {cmd.userInput}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(cmd.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                {cmd.aiResponse && (
                  <div className="mt-3 p-3 bg-gray-900 rounded">
                    <div className="text-sm text-green-400 mb-2">
                      <strong>AI Response:</strong>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      <strong>Command:</strong> <code className="bg-gray-700 px-2 py-1 rounded">{cmd.aiResponse.command}</code>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      <strong>Explanation:</strong> {cmd.aiResponse.explanation}
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      <strong>Safety Level:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        cmd.aiResponse.safety_level === 'safe' ? 'bg-green-800 text-green-200' :
                        cmd.aiResponse.safety_level === 'moderate' ? 'bg-yellow-800 text-yellow-200' :
                        'bg-red-800 text-red-200'
                      }`}>
                        {cmd.aiResponse.safety_level}
                      </span>
                    </div>
                    {cmd.aiResponse.alternatives && cmd.aiResponse.alternatives.length > 0 && (
                      <div className="text-sm text-gray-300">
                        <strong>Alternatives:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {cmd.aiResponse.alternatives.map((alt: string, index: number) => (
                            <li key={index} className="text-xs">{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {cmd.output && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold mb-1">
                      Output:
                    </div>
                    <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                      {cmd.output}
                    </pre>
                  </div>
                )}
                
                {cmd.status === 'pending' && (
                  <div className="flex items-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="ml-2 text-blue-400">AI is processing your request...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NaturalLanguageTerminal;
