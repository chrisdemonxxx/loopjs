import React, { useState } from 'react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  successRate: number;
  estimatedTime: number;
  tools: string[];
  errorMessage?: string;
}

interface AIAnalysis {
  intent: string;
  complexity: 'low' | 'medium' | 'high';
  confidence: number;
  requiredTools: string[];
  estimatedStrategies: number;
}

interface LearningStats {
  totalCommands: number;
  successRate: number;
  averageStrategies: number;
  topSuccessfulPatterns: Array<{
    pattern: string;
    successRate: number;
    usage: number;
  }>;
  recentImprovements: Array<{
    date: string;
    improvement: string;
    impact: number;
  }>;
}

interface AIInsightsPanelProps {
  commandHistory: Array<{
    id: string;
    userInput: string;
    analysis?: AIAnalysis;
    strategies?: Strategy[];
    currentStrategy?: Strategy;
    executionProgress?: {
      currentStep: number;
      totalSteps: number;
      stepDescription: string;
    };
    researchResults?: Array<{
      source: string;
      solution: string;
      confidence: number;
    }>;
    timestamp: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }>;
  learningStats?: LearningStats;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ 
  commandHistory, 
  learningStats 
}) => {
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'learning' | 'research'>('overview');

  const currentCommand = commandHistory.find(cmd => cmd.id === selectedCommand);
  const recentCommands = commandHistory.slice(-5).reverse();

  const getStatusIcon = (status: string) => {
    const base = 'inline-block w-2 h-2 rounded-full';
    if (status === 'success' || status === 'completed') return <span className={`${base} bg-green-500`} />;
    if (status === 'failed') return <span className={`${base} bg-red-500`} />;
    if (status === 'running') return <span className={`${base} bg-blue-500 animate-pulse`} />;
    return <span className={`${base} bg-gray-400`} />;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="inline-block w-5 h-5 bg-blue-600 rounded"></span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights Panel</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time AI decision-making and learning analytics</p>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Simple Tabs */}
        <div className="grid grid-cols-4 gap-2 mx-4 mt-4">
          {(['overview','strategies','learning','research'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-3 rounded border text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4 h-full overflow-y-auto">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Recent Commands</div>
                <div className="p-4">
                  <div className="space-y-2">
                      {recentCommands.map((cmd) => (
                        <div
                          key={cmd.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCommand === cmd.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => setSelectedCommand(cmd.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {cmd.userInput}
                              </p>
                              {cmd.analysis && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getComplexityColor(cmd.analysis.complexity)}`}>
                                    {cmd.analysis.complexity}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {cmd.analysis.confidence}% confidence
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(cmd.status)}
                              <span className="text-xs text-gray-500">
                                {new Date(cmd.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              </div>

              {learningStats && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Learning Statistics</div>
                  <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {learningStats.successRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Success Rate
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {learningStats.averageStrategies.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Avg Strategies
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Total Commands Processed
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {learningStats.totalCommands}
                        </div>
                      </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="space-y-4 h-full overflow-y-auto">
              {currentCommand?.strategies ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Execution Strategies</div>
                    <div className="p-4">
                        <div className="space-y-3">
                          {currentCommand.strategies.map((strategy, index) => (
                            <div
                              key={strategy.id}
                              className={`p-4 rounded-lg border ${
                                strategy.status === 'success'
                                  ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                                  : strategy.status === 'failed'
                                  ? 'border-red-200 bg-red-50 dark:bg-red-900/20'
                                  : strategy.status === 'running'
                                  ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      Strategy {index + 1}: {strategy.name}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded border border-gray-300">Priority {strategy.priority}</span>
                                    {getStatusIcon(strategy.status)}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {strategy.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Success Rate: {strategy.successRate}%</span>
                                    <span>Est. Time: {strategy.estimatedTime}s</span>
                                    <span>Tools: {strategy.tools.join(', ')}</span>
                                  </div>
                                  {strategy.errorMessage && (
                                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                                      Error: {strategy.errorMessage}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>

                  {currentCommand.currentStrategy && currentCommand.executionProgress && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Current Execution</div>
                      <div className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {currentCommand.currentStrategy.name}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Step {currentCommand.executionProgress.currentStep} of {currentCommand.executionProgress.totalSteps}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded">
                              <div
                                className="h-2 bg-blue-500 rounded"
                                style={{ width: `${(currentCommand.executionProgress.currentStep / currentCommand.executionProgress.totalSteps) * 100}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {currentCommand.executionProgress.stepDescription}
                            </p>
                          </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
                  Select a command to view its execution strategies
                </div>
              )}
            </div>
          )}

          {activeTab === 'learning' && (
            <div className="space-y-4 h-full overflow-y-auto">
              {learningStats ? (
                <>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Top Successful Patterns</div>
                    <div className="p-4">
                        <div className="space-y-3">
                          {learningStats.topSuccessfulPatterns.map((pattern, index) => (
                            <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pattern.pattern}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded border border-gray-300">{pattern.successRate}% success</span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Used {pattern.usage} times
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Recent Improvements</div>
                    <div className="p-4">
                        <div className="space-y-3">
                          {learningStats.recentImprovements.map((improvement, index) => (
                            <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {improvement.improvement}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">+{improvement.impact}%</span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(improvement.date).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
                  Learning statistics will appear as the AI processes more commands
                </div>
              )}
            </div>
          )}

          {activeTab === 'research' && (
            <div className="space-y-4 h-full overflow-y-auto">
              {currentCommand?.researchResults ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Research Results</div>
                  <div className="p-4">
                      <div className="space-y-3">
                        {currentCommand.researchResults.map((result, index) => (
                          <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {result.source}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded border border-gray-300">{result.confidence}% confidence</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {result.solution}
                            </p>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
                  Research results will appear when the AI needs to find solutions
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;