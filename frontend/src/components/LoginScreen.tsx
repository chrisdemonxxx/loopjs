import { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, Fingerprint, Zap } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useTheme } from '../contexts/ThemeContext';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{
      background: `linear-gradient(to bottom right, var(--theme-bg-from), var(--theme-bg-to))`
    }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d9b5]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#8b5cf6]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00d9b5 1px, transparent 1px),
            linear-gradient(to bottom, #00d9b5 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 border border-[#00d9b5]/20 rotate-45 animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-20 right-20 w-40 h-40 border border-[#3b82f6]/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute top-40 right-40 w-24 h-24 border border-[#8b5cf6]/20 animate-bounce" style={{ animationDuration: '4s' }} />

      {/* Main login container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d9b5] to-[#00b894] rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-[#131824]/90 to-[#1e2538]/90 backdrop-blur-2xl rounded-2xl p-4 border border-[#00d9b5]/30"
              style={{
                boxShadow: '0 8px 32px 0 rgba(0, 217, 181, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
              <Shield className="w-12 h-12 text-[#00d9b5] drop-shadow-[0_0_12px_rgba(0,217,181,0.8)]" />
            </div>
          </div>
          <h1 className="text-4xl bg-gradient-to-r from-[#00d9b5] via-[#00f5d0] to-[#00d9b5] bg-clip-text text-transparent mb-2 animate-gradient bg-[length:200%_auto]">
            LoopJS C2 Panel
          </h1>
          <p className="text-slate-400">Secure Command & Control System</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-1 w-1 rounded-full bg-[#00d9b5] animate-pulse" />
            <span className="text-xs text-[#00d9b5]">ENCRYPTED CONNECTION</span>
            <div className="h-1 w-1 rounded-full bg-[#00d9b5] animate-pulse" />
          </div>
        </div>

        {/* Login Card */}
        <div className="relative animate-in fade-in slide-in-from-bottom duration-700"
          style={{ animationDelay: '200ms' }}>
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00d9b5] via-[#3b82f6] to-[#8b5cf6] rounded-2xl blur-xl opacity-20 animate-pulse" />
          
          {/* Main card */}
          <div className="relative bg-gradient-to-br from-[#131824]/95 to-[#1e2538]/95 backdrop-blur-2xl rounded-2xl border border-[#00d9b5]/30 overflow-hidden"
            style={{
              boxShadow: '0 20px 60px 0 rgba(0, 217, 181, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
            
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-transparent via-[#00d9b5] to-transparent" />
            
            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00d9b5]" />
                    Username
                  </Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="pl-10 border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-200 placeholder:text-slate-500 focus:border-[#00d9b5] focus:ring-[#00d9b5] transition-all backdrop-blur-sm h-12"
                      required
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#00d9b5] transition-colors" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#00d9b5]" />
                    Password
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-200 placeholder:text-slate-500 focus:border-[#00d9b5] focus:ring-[#00d9b5] transition-all backdrop-blur-sm h-12"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#00d9b5] transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#00d9b5] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-[#00d9b5]/30 data-[state=checked]:bg-[#00d9b5] data-[state=checked]:border-[#00d9b5]"
                    />
                    <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                      Remember me
                    </label>
                  </div>
                  <button 
                    type="button"
                    className="text-sm text-[#00d9b5] hover:text-[#00f5d0] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#00d9b5] to-[#00b894] text-[#0a0e1a] hover:from-[#00f5d0] hover:to-[#00d9b5] shadow-lg shadow-[#00d9b5]/50 hover:shadow-[#00d9b5]/70 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Login
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#00d9b5]/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#131824] px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                {/* Alternative login methods */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-300 hover:bg-[#1e2538]/50 hover:border-[#00d9b5]/40 transition-all backdrop-blur-sm group"
                  >
                    <Fingerprint className="w-5 h-5 mr-2 text-[#00d9b5] group-hover:scale-110 transition-transform" />
                    Biometric
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-[#00d9b5]/20 bg-[#0f1420]/50 text-slate-300 hover:bg-[#1e2538]/50 hover:border-[#00d9b5]/40 transition-all backdrop-blur-sm group"
                  >
                    <Zap className="w-5 h-5 mr-2 text-[#00d9b5] group-hover:scale-110 transition-transform" />
                    SSO
                  </Button>
                </div>
              </form>

              {/* Security notice */}
              <div className="mt-6 p-3 rounded-lg bg-[#00d9b5]/5 border border-[#00d9b5]/20">
                <p className="text-xs text-center text-slate-400">
                  <Lock className="w-3 h-3 inline mr-1 text-[#00d9b5]" />
                  Your connection is secured with end-to-end encryption
                </p>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-1 bg-gradient-to-r from-transparent via-[#00d9b5] to-transparent" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2 animate-in fade-in duration-700" style={{ animationDelay: '400ms' }}>
          <p className="text-sm text-slate-500">
            Don't have an account? 
            <button className="ml-1 text-[#00d9b5] hover:text-[#00f5d0] transition-colors">
              Request Access
            </button>
          </p>
          <p className="text-xs text-slate-600">
            © 2024 LoopJS C2 Panel. All rights reserved.
          </p>
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d9b5]/30 to-transparent animate-scan" />
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>
    </div>
  );
}