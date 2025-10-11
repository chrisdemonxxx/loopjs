import React from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'user' | 'ai' | 'system' | 'command_output';
    content: string;
    timestamp: string;
    status?: 'thinking' | 'executing' | 'completed' | 'failed';
    command?: string;
    output?: string;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const getMessageStyles = () => {
    switch (message.type) {
      case 'user':
        return 'bg-blue-500 text-white';
      case 'ai':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'command_output':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'system':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'thinking':
        return '🤔';
      case 'executing':
        return '⚡';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '';
    }
  };

  const getAlignment = () => {
    return message.type === 'user' ? 'justify-end' : 'justify-start';
  };

  return (
    <div className={`flex ${getAlignment()}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyles()}`}>
        {/* Status Icon */}
        {message.status && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm">{getStatusIcon()}</span>
            <span className="text-xs opacity-75 capitalize">
              {message.status}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="text-sm">{message.content}</div>

        {/* Command Details */}
        {message.command && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
              View Command
            </summary>
            <pre className="text-xs mt-1 p-2 bg-black bg-opacity-10 rounded overflow-x-auto whitespace-pre-wrap">
              {message.command}
            </pre>
          </details>
        )}

        {/* Command Output */}
        {message.output && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
              View Output
            </summary>
            <pre className="text-xs mt-1 p-2 bg-black bg-opacity-10 rounded overflow-x-auto whitespace-pre-wrap">
              {message.output}
            </pre>
          </details>
        )}

        {/* Timestamp */}
        <div className="text-xs opacity-75 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

