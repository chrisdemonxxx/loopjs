import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Settings, Palette, Database, Bell, Download } from 'lucide-react';

export function SettingsPanel() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-slate-400">Configure your C2 panel preferences and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {['Professional', 'Hacker', 'Cyberpunk'].map((theme) => (
                  <button
                    key={theme}
                    className={`p-3 rounded-lg border text-sm ${
                      theme === 'Professional' 
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500' 
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div>
                <p className="text-slate-100 text-sm">Compact Mode</p>
                <p className="text-slate-500 text-xs">Reduce spacing and padding</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div>
                <p className="text-slate-100 text-sm">Animations</p>
                <p className="text-slate-500 text-xs">Enable UI animations</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Client Connect/Disconnect', enabled: true },
              { name: 'Security Alerts', enabled: true },
              { name: 'Task Completion', enabled: true },
              { name: 'System Updates', enabled: false }
            ].map((notif, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-slate-300 text-sm">{notif.name}</span>
                <Switch defaultChecked={notif.enabled} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">General</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Panel Name</label>
              <Input 
                defaultValue="C2 Command Panel"
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">Panel Icon</label>
              <Input 
                defaultValue="shield"
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">Refresh Interval</label>
              <select className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2">
                <option>1 second</option>
                <option>3 seconds</option>
                <option>5 seconds</option>
                <option>10 seconds</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Database</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Database Size</span>
                <Badge className="bg-blue-500/10 text-blue-500">2.4 GB</Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Total Records</span>
                <span className="text-slate-400 text-sm">14,523</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Last Backup</span>
                <span className="text-slate-400 text-sm">2 hours ago</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/20">
                <Download className="h-4 w-4 mr-2" />
                Backup Now
              </Button>
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-slate-100">
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-slate-100 mb-2">System Information</h3>
              <div className="space-y-1 text-sm">
                <p className="text-slate-400">Version: 2.0.1</p>
                <p className="text-slate-400">Build: 20241113</p>
                <p className="text-slate-400">License: Professional</p>
              </div>
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              Check Updates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
