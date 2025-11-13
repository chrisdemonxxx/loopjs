import { useState, useEffect } from 'react';
import { Activity, Users, Bot, Terminal, Brain, FileText, CheckSquare, Settings, Shield, ChevronDown, Circle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Badge } from './components/ui/badge';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import LoginScreen from './components/LoginScreen';
import OverviewSection from './components/OverviewSection';
import ClientsSection from './components/ClientsSection';
import AgentSection from './components/AgentSection';
import AITerminalSection from './components/AITerminalSection';
import AIInsightsSection from './components/AIInsightsSection';
import LogsSection from './components/LogsSection';
import TasksSection from './components/TasksSection';
import SettingsSection from './components/SettingsSection';

function AppContent() {
  const { colors } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Changed to true to bypass login
  const [activeTab, setActiveTab] = useState('overview');
  const [operationalStatus, setOperationalStatus] = useState(true);
  const [panelName, setPanelName] = useState('C2 Panel');
  const [panelIcon, setPanelIcon] = useState('Shield');
  const [userRole, setUserRole] = useState('Admin');

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Pulse animation for operational status
  useEffect(() => {
    const interval = setInterval(() => {
      setOperationalStatus(prev => prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen" style={{
      background: `linear-gradient(to bottom right, var(--theme-bg-from), var(--theme-bg-to))`
    }}>
      {/* Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{
        borderBottom: `1px solid var(--theme-border)`,
        backgroundColor: `${colors.cardGradientFrom}cc`
      }}>
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Side - Logo & Name */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{panelIcon}</div>
              <div>
                <h1 className="text-xl bg-gradient-to-r bg-clip-text text-transparent" style={{
                  backgroundImage: `linear-gradient(to right, var(--theme-primary), var(--theme-primary-light))`
                }}>
                  {panelName}
                </h1>
                <p className="text-xs text-slate-400">Command & Control Panel</p>
              </div>
            </div>
          </div>

          {/* Right Side - Status & User */}
          <div className="flex items-center gap-4">
            {/* Operational Status */}
            <div className="flex items-center gap-2 rounded-lg px-4 py-2 backdrop-blur" style={{
              backgroundColor: `${colors.cardGradientFrom}80`,
              border: `1px solid var(--theme-border)`
            }}>
              <Circle className={`h-2 w-2 animate-pulse`} style={{
                fill: colors.primary,
                color: colors.primary
              }} />
              <span className="text-sm text-slate-300">
                {operationalStatus ? 'OPERATIONAL' : 'OFFLINE'}
              </span>
            </div>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-lg hover:bg-[#1e2538]/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[#0a0e1a]" style={{
                      background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-primary-dark))`
                    }}>
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm text-slate-200">Admin User</p>
                    <p className="text-xs text-slate-400">{userRole}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" style={{
                backgroundColor: colors.cardGradientFrom,
                borderColor: colors.border
              }}>
                <DropdownMenuItem className="text-slate-200 focus:bg-[#1e2538] focus:text-white">
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-200 focus:bg-[#1e2538] focus:text-white">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs */}
          <TabsList className="mb-6 grid w-full grid-cols-8 gap-2 bg-[#131824]/50 p-2 backdrop-blur-xl border border-[#00d9b5]/20 rounded-2xl">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="clients"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger 
              value="agent"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Agent</span>
            </TabsTrigger>
            <TabsTrigger 
              value="terminal"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <Terminal className="h-4 w-4" />
              <span className="hidden sm:inline">AI Terminal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9b5] data-[state=active]:to-[#00b894] data-[state=active]:text-[#0a0e1a] rounded-xl transition-all hover:bg-[#1e2538]/30"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview" className="mt-0">
            <OverviewSection />
          </TabsContent>
          
          <TabsContent value="clients" className="mt-0">
            <ClientsSection />
          </TabsContent>
          
          <TabsContent value="agent" className="mt-0">
            <AgentSection />
          </TabsContent>
          
          <TabsContent value="terminal" className="mt-0">
            <AITerminalSection />
          </TabsContent>
          
          <TabsContent value="insights" className="mt-0">
            <AIInsightsSection />
          </TabsContent>
          
          <TabsContent value="logs" className="mt-0">
            <LogsSection />
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-0">
            <TasksSection />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <SettingsSection 
              panelName={panelName}
              setPanelName={setPanelName}
              panelIcon={panelIcon}
              setPanelIcon={setPanelIcon}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#00d9b5]/20 bg-[#0f1420]/50 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-[#00d9b5] text-[#00d9b5] animate-pulse" />
              Connected
            </span>
            <span>Last updated: Just now</span>
          </div>
          <span>LoopJS C2 Panel v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}