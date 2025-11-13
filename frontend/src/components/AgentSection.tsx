import { useState } from 'react';
import { Bot, Rocket, Settings, Package, FileText, RefreshCw, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

export default function AgentSection() {
  const [agentName, setAgentName] = useState('SystemService');
  const [serviceName, setServiceName] = useState('WindowsDefender');
  const [description, setDescription] = useState('Background system service');

  const generateRandomName = () => {
    const names = ['SystemService', 'WindowsDefender', 'UpdateChecker', 'SecurityMonitor', 'BackgroundTask'];
    return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#00d9b5]/20 p-3 backdrop-blur-sm ring-1 ring-white/10">
              <Bot className="h-6 w-6 text-[#00d9b5] drop-shadow-[0_0_8px_rgba(0,217,181,0.5)]" />
            </div>
            <div>
              <CardTitle className="text-slate-100">Agent Management</CardTitle>
              <CardDescription className="text-slate-400">
                Generate polymorphic MSI agents with advanced evasion techniques
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-[#0f1420]/50 p-1 border border-[#00d9b5]/20">
              <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Rocket className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="configuration" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="builds" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Package className="h-4 w-4" />
                Builds
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6 mt-6">
              {/* Coming Soon Notice */}
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-6">
                <div className="flex items-start gap-3">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Coming Soon
                  </Badge>
                  <div className="flex-1">
                    <h3 className="text-slate-100 mb-2">Advanced Agent Builder</h3>
                    <p className="text-sm text-slate-400">
                      We're working on an advanced polymorphic agent builder with MSI packaging, evasion techniques, and stealth capabilities. Stay tuned!
                    </p>
                  </div>
                </div>
              </div>

              {/* Generate Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="agentName" className="text-slate-300">Agent Name</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="agentName"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="border-slate-600 bg-slate-900/50 text-slate-200"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAgentName(generateRandomName())}
                      className="border-slate-600 bg-slate-900/50 hover:bg-slate-700"
                    >
                      <RefreshCw className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="serviceName" className="text-slate-300">Service Name</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="border-slate-600 bg-slate-900/50 text-slate-200"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setServiceName(generateRandomName())}
                      className="border-slate-600 bg-slate-900/50 hover:bg-slate-700"
                    >
                      <RefreshCw className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                  />
                </div>

                <Button className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30 h-12">
                  <Zap className="h-5 w-5" />
                  Generate Agent
                </Button>
              </div>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Basic Configuration */}
                <div className="space-y-4">
                  <h3 className="text-slate-200">Basic Configuration</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-slate-300">Agent Name</Label>
                      <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Service Name</Label>
                      <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Evasion Settings */}
                <div className="space-y-3">
                  <h3 className="text-slate-200">Evasion Settings</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['Polymorphic naming', 'UAC bypass', 'Defender exclusion', 'Process hollowing', 'Memory evasion'].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox id={item} className="border-slate-600" />
                        <label htmlFor={item} className="text-sm text-slate-300 cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stealth Settings */}
                <div className="space-y-3">
                  <h3 className="text-slate-200">Stealth Settings</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['Anti-debug', 'Anti-VM', 'Anti-sandbox', 'Code obfuscation', 'String encryption'].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox id={item} className="border-slate-600" />
                        <label htmlFor={item} className="text-sm text-slate-300 cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Persistence Settings */}
                <div className="space-y-3">
                  <h3 className="text-slate-200">Persistence Settings</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['Service installation', 'Registry persistence', 'Scheduled task', 'Startup folder'].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox id={item} className="border-slate-600" />
                        <label htmlFor={item} className="text-sm text-slate-300 cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Communication Settings */}
                <div className="space-y-3">
                  <h3 className="text-slate-200">Communication Settings</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-300">Server URL</Label>
                      <Input placeholder="https://c2.example.com" className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Server Port</Label>
                      <Input placeholder="443" className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Heartbeat Interval (seconds)</Label>
                      <Input placeholder="60" type="number" className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Reconnect Attempts</Label>
                      <Input placeholder="5" type="number" className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Advanced Features */}
                <div className="space-y-3">
                  <h3 className="text-slate-200">Advanced Features</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['Keylogger', 'Screen capture', 'File manager', 'Process manager', 'Network monitor', 'System info'].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox id={item} className="border-slate-600" />
                        <label htmlFor={item} className="text-sm text-slate-300 cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600">
                  Save Configuration
                </Button>
              </div>
            </TabsContent>

            {/* Builds Tab */}
            <TabsContent value="builds" className="mt-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No builds yet. Generate your first agent to see it here.</p>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No templates saved. Create a template from your configuration.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}