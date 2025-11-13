import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Palette, Sliders, Lock, Users, Database, Send, Waves, Zap, Crown, Radio, Check, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { useTheme, themes, type ThemeType } from '../contexts/ThemeContext';
import { soundManager } from '../utils/sounds';

interface SettingsSectionProps {
  panelName: string;
  setPanelName: (name: string) => void;
  panelIcon: string;
  setPanelIcon: (icon: string) => void;
}

export default function SettingsSection({ panelName, setPanelName, panelIcon, setPanelIcon }: SettingsSectionProps) {
  const { theme: currentTheme, setTheme } = useTheme();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(() => soundManager.isEnabled());
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [require2FA, setRequire2FA] = useState(false);
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [autoClearLogs, setAutoClearLogs] = useState(true);
  const [logRetention, setLogRetention] = useState('30');

  const handleSoundsToggle = (enabled: boolean) => {
    setSoundsEnabled(enabled);
    soundManager.setEnabled(enabled);
    if (enabled) {
      soundManager.playSuccess();
    }
  };

  const themeOptions = [
    { 
      id: 'obsidian-black' as ThemeType, 
      icon: Crown, 
      preview: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
      particles: ['◆', '◇', '◈']
    },
    { 
      id: 'neon-purple' as ThemeType, 
      icon: Zap, 
      preview: 'linear-gradient(135deg, #c026d3 0%, #ec4899 100%)',
      particles: ['◆', '◇', '◈']
    },
    { 
      id: 'quantum-gold' as ThemeType, 
      icon: Crown, 
      preview: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      particles: ['◆', '◇', '◈']
    },
    { 
      id: 'matrix-green' as ThemeType, 
      icon: Radio, 
      preview: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
      particles: ['◆', '◇', '◈']
    },
  ];

  useEffect(() => {
    if (notifications) {
      soundManager.playNotification();
    }
  }, [notifications]);

  return (
    <div className="space-y-6">
      <Card className="border-[#00d9b5]/30 bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#00d9b5]/20 p-3 backdrop-blur-sm ring-1 ring-white/10">
              <SettingsIcon className="h-6 w-6 text-[#00d9b5] drop-shadow-[0_0_8px_rgba(0,217,181,0.5)]" />
            </div>
            <div>
              <CardTitle className="text-slate-100">Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure your C2 Panel
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-[#0f1420]/50 p-1 border border-[#00d9b5]/20">
              <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Sliders className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Database</span>
              </TabsTrigger>
              <TabsTrigger value="telegram" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a]">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Telegram</span>
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-slate-200">Theme Selection</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {themeOptions.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setTheme(theme.id)}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:scale-105 ${
                        currentTheme === theme.id
                          ? 'border-[#00d9b5] bg-[#00d9b5]/10'
                          : 'border-slate-700 bg-[#131824]/50 hover:border-slate-600'
                      }`}
                    >
                      {currentTheme === theme.id && (
                        <div className="absolute top-2 right-2">
                          <div className="rounded-full bg-[#00d9b5] p-1">
                            <Check className="h-3 w-3 text-[#0a0e1a]" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2 ${currentTheme === theme.id ? 'bg-[#00d9b5]/20' : 'bg-slate-800'}`}>
                          <theme.icon className={`h-5 w-5 ${currentTheme === theme.id ? 'text-[#00d9b5]' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-slate-200">{theme.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">A modern and sleek design</p>
                          <Badge variant="outline" className="mt-2 border-slate-600 bg-slate-700/50 text-slate-300 text-xs">
                            Professional
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-slate-200">Panel Customization</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="panelName" className="text-slate-300">Panel Name</Label>
                    <Input
                      id="panelName"
                      value={panelName}
                      onChange={(e) => setPanelName(e.target.value)}
                      className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="panelIcon" className="text-slate-300">Panel Icon (emoji or icon)</Label>
                    <Input
                      id="panelIcon"
                      value={panelIcon}
                      onChange={(e) => setPanelIcon(e.target.value)}
                      className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-[#00d9b5] to-[#00b894] text-[#0a0e1a] hover:from-[#00c4a3] hover:to-[#00a082]">
                Save Appearance Settings
              </Button>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-slate-200">Auto-refresh</Label>
                    <p className="text-sm text-slate-400">Automatically refresh data</p>
                  </div>
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-slate-200">Notifications</Label>
                    <p className="text-sm text-slate-400">Show system notifications</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-slate-200">Sounds</Label>
                    <p className="text-sm text-slate-400">Enable sound effects</p>
                  </div>
                  <Switch checked={soundsEnabled} onCheckedChange={handleSoundsToggle} />
                </div>

                <div>
                  <Label htmlFor="refreshInterval" className="text-slate-300">Refresh Interval (seconds)</Label>
                  <Input
                    id="refreshInterval"
                    type="number"
                    defaultValue="5"
                    className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                  />
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-[#00d9b5] to-[#00b894] text-[#0a0e1a] hover:from-[#00c4a3] hover:to-[#00a082]">
                Save General Settings
              </Button>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-slate-200">Session Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="sessionTimeout" className="text-slate-300">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts" className="text-slate-300">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(e.target.value)}
                      className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-slate-200">Two-Factor Authentication</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="require2FA" checked={require2FA} onCheckedChange={(checked) => setRequire2FA(checked as boolean)} />
                  <label htmlFor="require2FA" className="text-sm text-slate-300 cursor-pointer">
                    Require 2FA for all users
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-slate-200">Password Policy</h3>
                <div>
                  <Label htmlFor="minPasswordLength" className="text-slate-300">Minimum Length</Label>
                  <Input
                    id="minPasswordLength"
                    type="number"
                    value={minPasswordLength}
                    onChange={(e) => setMinPasswordLength(e.target.value)}
                    className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  {['Require special characters', 'Require numbers', 'Require uppercase letters'].map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox id={item} />
                      <label htmlFor={item} className="text-sm text-slate-300 cursor-pointer">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-[#00d9b5] to-[#00b894] text-[#0a0e1a] hover:from-[#00c4a3] hover:to-[#00a082]">
                Save Security Settings
              </Button>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-slate-200">User Management</h3>
                  <Button className="gap-2 bg-gradient-to-r from-[#00d9b5] to-[#00b894] text-[#0a0e1a] hover:from-[#00c4a3] hover:to-[#00a082]">
                    <Users className="h-4 w-4" />
                    Create User
                  </Button>
                </div>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No users configured. Create your first user to get started.</p>
                </div>
              </div>
            </TabsContent>

            {/* Database Tab */}
            <TabsContent value="database" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-slate-200">Database Settings</h3>
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-slate-200">Auto-clear logs</Label>
                    <p className="text-sm text-slate-400">Automatically clear old logs</p>
                  </div>
                  <Switch checked={autoClearLogs} onCheckedChange={setAutoClearLogs} />
                </div>

                <div>
                  <Label htmlFor="logRetention" className="text-slate-300">Log Retention (days)</Label>
                  <Input
                    id="logRetention"
                    type="number"
                    value={logRetention}
                    onChange={(e) => setLogRetention(e.target.value)}
                    className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-slate-200">Database Actions</h3>
                <Button variant="outline" className="w-full border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700">
                  Clear All Logs
                </Button>
                <Button variant="outline" className="w-full border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700">
                  Backup Database
                </Button>
                <Button variant="outline" className="w-full border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700">
                  Restore Database
                </Button>
              </div>
            </TabsContent>

            {/* Telegram Tab */}
            <TabsContent value="telegram" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div>
                    <Label className="text-slate-200">Enable Telegram</Label>
                    <p className="text-sm text-slate-400">Connect to Telegram bot</p>
                  </div>
                  <Switch checked={telegramEnabled} onCheckedChange={setTelegramEnabled} />
                </div>

                {telegramEnabled && (
                  <>
                    <div>
                      <Label htmlFor="botToken" className="text-slate-300">Bot Token</Label>
                      <Input
                        id="botToken"
                        type="password"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder="Enter your bot token"
                        className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="chatId" className="text-slate-300">Chat ID</Label>
                      <Input
                        id="chatId"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        placeholder="Enter your chat ID"
                        className="mt-2 border-slate-600 bg-slate-900/50 text-slate-200"
                      />
                    </div>

                    <Button variant="outline" className="w-full border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700">
                      Test Connection
                    </Button>

                    <div className="space-y-3">
                      <h3 className="text-slate-200">Notification Settings</h3>
                      {['New connection', 'Disconnection', 'Task completion', 'System alerts'].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox id={item} defaultChecked />
                          <label htmlFor={item} className="text-sm text-slate-300 cursor-pointer">
                            {item}
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {telegramEnabled && (
                <Button className="w-full bg-gradient-to-r from-[#00d9b5] to-[#00b894] text-[#0a0e1a] hover:from-[#00c4a3] hover:to-[#00a082]">
                  Save Telegram Settings
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}