import { Brain, BarChart3, Target, BookOpen, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

export default function AIInsightsSection() {
  const stats = {
    totalCommands: 1247,
    successRate: 96.8,
    avgStrategies: 3.2,
    improvements: 12
  };

  const strategies = [
    { id: 1, name: 'PowerShell Execution', priority: 'High', status: 'Success', successRate: 98, time: '1.2s', tools: 'PS, CMD' },
    { id: 2, name: 'Registry Query', priority: 'Medium', status: 'Running', successRate: 95, time: '0.8s', tools: 'REG' },
    { id: 3, name: 'File System Scan', priority: 'Low', status: 'Pending', successRate: 92, time: '2.1s', tools: 'FS' },
    { id: 4, name: 'Network Enumeration', priority: 'High', status: 'Success', successRate: 97, time: '1.5s', tools: 'NET' },
  ];

  const patterns = [
    { name: 'Direct PowerShell', successRate: 98.5, usage: 342 },
    { name: 'Batch Script Wrapper', successRate: 96.2, usage: 287 },
    { name: 'WMI Query', successRate: 94.8, usage: 198 },
    { name: 'Registry Automation', successRate: 93.1, usage: 156 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'border-green-500/50 bg-green-500/10 text-green-400';
      case 'Running':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'Pending':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'Failed':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      default:
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'Medium':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'Low':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      default:
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-3">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-slate-100">AI Insights Panel</CardTitle>
              <CardDescription className="text-slate-400">
                Real-time AI decision-making and learning analytics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 p-1 border border-slate-700">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="strategies" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <Target className="h-4 w-4" />
                Strategies
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <BookOpen className="h-4 w-4" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="research" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <Search className="h-4 w-4" />
                Research
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* AI Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Total Commands</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      {stats.totalCommands}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Success Rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {stats.successRate}%
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Avg Strategies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {stats.avgStrategies}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Improvements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                      +{stats.improvements}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Successful Patterns */}
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Top Successful Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patterns.map((pattern) => (
                    <div key={pattern.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{pattern.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{pattern.usage} uses</span>
                          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400">
                            {pattern.successRate}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={pattern.successRate} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Strategies Tab */}
            <TabsContent value="strategies" className="space-y-4 mt-6">
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="border-slate-700 bg-slate-900/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-slate-200">{strategy.name}</h3>
                          <Badge variant="outline" className={getPriorityColor(strategy.priority)}>
                            {strategy.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(strategy.status)}>
                            {strategy.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>Success Rate: {strategy.successRate}%</span>
                          <span>Time: {strategy.time}</span>
                          <span>Tools: {strategy.tools}</span>
                        </div>
                        <Progress value={strategy.successRate} className="h-2 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="space-y-6 mt-6">
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Learning Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <span className="text-sm text-slate-400">Commands Processed</span>
                      <div className="text-3xl text-slate-200">{stats.totalCommands}</div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-slate-400">Average Strategies</span>
                      <div className="text-3xl text-slate-200">{stats.avgStrategies}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Overall Success Rate</span>
                      <span className="text-sm text-green-400">{stats.successRate}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Recent Improvements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: 'Today', desc: 'Improved PowerShell execution strategy', impact: '+2.3%' },
                      { date: 'Yesterday', desc: 'Optimized registry query patterns', impact: '+1.8%' },
                      { date: '2 days ago', desc: 'Enhanced error recovery mechanisms', impact: '+1.5%' },
                    ].map((improvement, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                        <div>
                          <p className="text-sm text-slate-300">{improvement.desc}</p>
                          <p className="text-xs text-slate-500">{improvement.date}</p>
                        </div>
                        <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400">
                          {improvement.impact}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Research Tab */}
            <TabsContent value="research" className="mt-6">
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Research results will appear when the AI needs to find solutions</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}