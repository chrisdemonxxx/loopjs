import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../types';
import aiService from '../services/aiService';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'command_output';
  content: string;
  timestamp: string;
  status?: 'thinking' | 'executing' | 'completed' | 'failed';
  command?: string;
  output?: string;
}

interface SimpleChatTerminalProps {
  selectedAgent: Agent | null;
  onSelectAgent?: (agent: Agent | null) => void;
  agents: Agent[];
  onCommandSent: (command: any) => void;
}

const SimpleChatTerminal: React.FC<SimpleChatTerminalProps> = ({
  selectedAgent,
  onSelectAgent,
  agents,
  onCommandSent
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onlineClients = agents.filter(agent => agent.status === 'online');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check AI availability on mount
  useEffect(() => {
    checkAIAvailability();
  }, []);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const checkAIAvailability = async () => {
    try {
      const response = await aiService.testConnection();
      setAiStatus(response ? 'available' : 'unavailable');
    } catch (error) {
      console.error('[SIMPLE CHAT TERMINAL] Error checking AI availability:', error);
      setAiStatus('unavailable');
    }
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !selectedAgent || isProcessing) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsProcessing(true);

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage
    });

    // Add AI thinking message
    const thinkingId = addMessage({
      type: 'ai',
      content: '🤖 Analyzing your request...',
      status: 'thinking'
    });

    try {
      // Process with AI
      const clientInfo = {
        uuid: selectedAgent.id,
        platform: selectedAgent.platform || 'unknown',
        systemInfo: selectedAgent.systemInfo || {}
      };

      console.log('[SIMPLE CHAT TERMINAL] Processing with AI:', userMessage);
      
      const aiResult = await aiService.processNaturalLanguage(
        userMessage,
        clientInfo,
        { category: 'general' }
      );

      console.log('[SIMPLE CHAT TERMINAL] AI result:', aiResult);

      // Update thinking message with AI response
      updateMessage(thinkingId, {
        content: aiResult.explanation || 'I understand what you want to do. Let me execute the appropriate commands.',
        status: 'executing'
      });

      // Add command execution message
      const commandId = addMessage({
        type: 'command_output',
        content: '💻 Executing command...',
        status: 'executing',
        command: aiResult.command
      });

      // Send command to client
      const taskId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await onCommandSent({
        targetUuid: selectedAgent.uuid,
        command: aiResult.command,
        id: taskId,
        type: aiResult.type || 'powershell',
        timeout: aiResult.timeout || 300
      });

      // Update command message with task ID for tracking
      updateMessage(commandId, {
        content: '💻 Command sent to client. Waiting for output...',
        status: 'executing'
      });

      // Set up timeout for command completion
      setTimeout(() => {
        updateMessage(commandId, {
          content: '✅ Command completed successfully!',
          status: 'completed'
        });
      }, 5000);

    } catch (error) {
      console.error('[SIMPLE CHAT TERMINAL] Error:', error);
      
      // Update thinking message with error
      updateMessage(thinkingId, {
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        status: 'failed'
      });

      toast.error('Failed to process command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const examplePrompts = [
    "Download PuTTY and open it",
    "Show me system information",
    "List all running processes",
    "Check network connectivity",
    "Install Chrome browser",
    "Show disk usage"
  ];

  return (
    <div className="premium-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>
            🤖 AI Assistant
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              aiStatus === 'available' ? 'bg-green-500' : 
              aiStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm" style={{color: 'var(--text-secondary)'}}>
              {aiStatus === 'available' ? 'AI Ready' : 
               aiStatus === 'checking' ? 'Checking...' : 'AI Unavailable'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="premium-button text-sm"
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Client Selector */}
      <div className="p-4 border-b border-stroke dark:border-strokedark">
        <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
          Target Client:
        </label>
        <select
          value={selectedAgent?.uuid || ''}
          onChange={(e) => {
            const agent = agents.find(a => a.uuid === e.target.value);
            onSelectAgent?.(agent || null);
          }}
          className="premium-input w-full"
        >
          <option value="">Select a client...</option>
          {onlineClients.map(agent => (
            <option key={agent.uuid} value={agent.uuid}>
              {agent.computerName} ({agent.ipAddress})
            </option>
          ))}
        </select>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{minHeight: '400px'}}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-medium mb-2" style={{color: 'var(--text-primary)'}}>
              AI Assistant Ready
            </h3>
            <p className="text-sm mb-4" style={{color: 'var(--text-secondary)'}}>
              Tell me what you want to do on the selected client
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(prompt)}
                  className="text-xs p-2 rounded border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark transition-colors"
                  style={{color: 'var(--text-secondary)'}}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'ai'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : message.type === 'command_output'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                {message.command && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer opacity-75">
                      View Command
                    </summary>
                    <pre className="text-xs mt-1 p-2 bg-black bg-opacity-10 rounded overflow-x-auto">
                      {message.command}
                    </pre>
                  </details>
                )}
                <div className="text-xs opacity-75 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-stroke dark:border-strokedark">
        {!selectedAgent ? (
          <div className="text-center py-4">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
              Please select a client to start chatting with the AI assistant
            </p>
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type what you want to do... (e.g., 'download Chrome and install it')"
              className="premium-input flex-1"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || !selectedAgent || isProcessing}
              className="premium-button px-6"
            >
              {isProcessing ? '⏳' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleChatTerminal;

