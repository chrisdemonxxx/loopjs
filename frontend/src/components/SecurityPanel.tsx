import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Shield, Lock, Key, AlertTriangle } from 'lucide-react';

export function SecurityPanel() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-slate-400">Configure security settings and monitor threats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Security Features</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Two-Factor Authentication', enabled: true, description: 'Require 2FA for all users' },
              { name: 'Encryption', enabled: true, description: 'End-to-end encrypted communications' },
              { name: 'Auto-Lock', enabled: false, description: 'Lock after 15 minutes of inactivity' },
              { name: 'IP Whitelisting', enabled: true, description: 'Only allow trusted IP addresses' }
            ].map((feature, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-slate-800/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-100">{feature.name}</span>
                    {feature.enabled && <Badge className="bg-green-500/10 text-green-500 text-xs">Active</Badge>}
                  </div>
                  <p className="text-slate-500 text-xs">{feature.description}</p>
                </div>
                <Switch checked={feature.enabled} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-slate-100">Active Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  severity: 'high',
                  title: 'Unauthorized Access Attempt',
                  description: 'Failed login from 203.0.113.45',
                  time: '2m ago'
                },
                {
                  severity: 'medium',
                  title: 'Suspicious File Activity',
                  description: 'Unknown executable detected on CLIENT-03',
                  time: '15m ago'
                },
                {
                  severity: 'low',
                  title: 'Password Expiration',
                  description: '3 users need to update passwords',
                  time: '1h ago'
                }
              ].map((alert, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50 border-l-2 border-amber-500">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-slate-100 text-sm">{alert.title}</span>
                    <Badge className={
                      alert.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                      alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-xs mb-2">{alert.description}</p>
                  <span className="text-slate-500 text-xs">{alert.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Access Control</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <h4 className="text-slate-100 mb-2">Session Timeout</h4>
                <p className="text-slate-400 text-sm mb-3">Auto-logout after inactivity</p>
                <select className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                </select>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50">
                <h4 className="text-slate-100 mb-2">Max Login Attempts</h4>
                <p className="text-slate-400 text-sm mb-3">Before account lockout</p>
                <select className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm">
                  <option>3 attempts</option>
                  <option>5 attempts</option>
                  <option>10 attempts</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Password Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rule: 'Minimum length: 8 characters', met: true },
                { rule: 'Require uppercase letters', met: true },
                { rule: 'Require lowercase letters', met: true },
                { rule: 'Require numbers', met: true },
                { rule: 'Require special characters', met: false },
                { rule: 'Password expiration: 90 days', met: true }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <span className="text-slate-400 text-sm">{item.rule}</span>
                  <div className={`h-2 w-2 rounded-full ${item.met ? 'bg-green-500' : 'bg-slate-600'}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
