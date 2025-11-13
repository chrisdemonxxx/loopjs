import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Brain, AlertTriangle, TrendingUp, Shield, Activity } from 'lucide-react';

export function AIInsights() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-slate-400">Real-time AI decision-making and learning analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">Threat Score</CardTitle>
            <Shield className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">6.5/10</div>
            <Badge className="bg-amber-500/10 text-amber-500 mt-2">Medium Risk</Badge>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">12</div>
            <p className="text-slate-500 text-xs mt-2">Detected today</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">Learning Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">94%</div>
            <p className="text-slate-500 text-xs mt-2">Model accuracy</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-slate-400 text-sm">Predictions</CardTitle>
            <Brain className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-100 text-2xl">1,247</div>
            <p className="text-slate-500 text-xs mt-2">This week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">AI Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  priority: 'high',
                  title: 'Suspicious Network Pattern',
                  description: 'Unusual outbound traffic detected on CLIENT-03',
                  action: 'Investigate network logs'
                },
                {
                  priority: 'medium',
                  title: 'Memory Usage Spike',
                  description: 'DESKTOP-5X2A showing abnormal memory consumption',
                  action: 'Review running processes'
                },
                {
                  priority: 'low',
                  title: 'Update Available',
                  description: 'Security patches available for 3 clients',
                  action: 'Schedule maintenance'
                }
              ].map((rec, i) => (
                <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-slate-100">{rec.title}</h4>
                    <Badge className={
                      rec.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                      rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{rec.description}</p>
                  <p className="text-cyan-400 text-sm">→ {rec.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-slate-100">Threat Intelligence</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  type: 'Malware',
                  count: 3,
                  status: 'blocked',
                  details: 'Trojan.Generic detected and quarantined'
                },
                {
                  type: 'Phishing',
                  count: 7,
                  status: 'blocked',
                  details: 'Email threats prevented'
                },
                {
                  type: 'Brute Force',
                  count: 2,
                  status: 'monitoring',
                  details: 'Failed login attempts tracked'
                },
                {
                  type: 'DDoS',
                  count: 0,
                  status: 'clear',
                  details: 'No attacks detected'
                }
              ].map((threat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100">{threat.type}</span>
                      <Badge className="bg-slate-700 text-slate-300">{threat.count}</Badge>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">{threat.details}</p>
                  </div>
                  <Badge className={
                    threat.status === 'blocked' ? 'bg-green-500/10 text-green-500' :
                    threat.status === 'monitoring' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  }>
                    {threat.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
