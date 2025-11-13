import { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Shield, Terminal, Wifi, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "../contexts/ThemeContext";
import { toastService } from "../services/toastService";
import request from "../axios";

export default function ThemeLoginPage({ onLogin }: { onLogin: () => void }) {
  const { mode } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Play theme-specific login sound on component mount
  useEffect(() => {
    toastService.info("System initialized - Ready for authentication", { playSound: true, soundType: 'info' });
  }, [mode]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (!username || !password) {
        setError("Please enter both username and password");
        toastService.error("Authentication credentials required", { soundType: 'error' });
        return;
      }
      
      const res = await request({
        method: "POST",
        url: "/login",
        data: { username, password },
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (res.status === 200 && res.data && res.data.accessToken) {
        const accessToken = res.data.accessToken;
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("userRole", res.data.user?.role || "");
        console.log('Token stored in localStorage:', accessToken);
        
        toastService.success("Access granted - Welcome to the system", { soundType: 'connection' });
        onLogin();
      } else {
        setError("Login failed: Invalid server response");
        toastService.error("Authentication failed - Access denied", { soundType: 'error' });
        console.error("Invalid login response:", res);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid username or password");
          toastService.error("Access denied - Invalid credentials", { soundType: 'error' });
        } else {
          setError(`Login failed: ${err.response.data?.error || 'Server error'}`); 
          toastService.error("System error - Connection failed", { soundType: 'error' });
        }
      } else if (err.request) {
        setError("Network error. Please check your connection.");
        toastService.error("Network failure - Check connection", { soundType: 'error' });
      } else {
        setError("Login failed. Please try again.");
        toastService.error("Authentication failed - Try again", { soundType: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const getThemeTitle = () => {
    switch (mode) {
      case 'hacker-elite': return 'HACKER TERMINAL';
      case 'premium-cyber': return 'CYBERPUNK 2077';
      default: return 'C2 COMMAND PANEL';
    }
  };

  const getThemeSubtitle = () => {
    switch (mode) {
      case 'hacker-elite': return 'Access the underground network';
      case 'premium-cyber': return 'Welcome to Night City';
      default: return 'Secure command and control';
    }
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'hacker-elite': return '💚';
      case 'premium-cyber': return '🌆';
      default: return '🎯';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary/30 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-accent/40 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-primary/25 rounded-full animate-pulse"></div>
        
        {/* Grid lines for tech themes */}
        {(mode === 'hacker-elite' || mode === 'premium-cyber') && (
          <>
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
                {Array.from({ length: 400 }).map((_, i) => (
                  <div key={i} className="border border-primary/20"></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Login Container */}
      <div className="login-container w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">
            {getThemeIcon()}
          </div>
          <h1 className="text-3xl font-bold mb-2 text-primary">
            {getThemeTitle()}
          </h1>
          <p className="text-sm text-bodydark2">
            {getThemeSubtitle()}
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Shield className="h-4 w-4 mr-2" />
                Access System
              </div>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Terminal className="h-4 w-4 mr-1" />
              Terminal Ready
            </div>
            <div className="flex items-center">
              <Wifi className="h-4 w-4 mr-1" />
              Network Active
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Secure Protocol
            </div>
          </div>
        </div>

        {/* Theme-specific decorations */}
        {mode === 'hacker-elite' && (
          <div className="absolute top-4 left-4 text-green-400 font-mono text-xs animate-pulse">
            root@system:~$
          </div>
        )}
        
        {mode === 'premium-cyber' && (
          <div className="absolute top-4 right-4 text-cyan-400 font-bold text-xs">
            <div className="animate-pulse flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              NEON
            </div>
            <div>CITY</div>
          </div>
        )}
      </div>
    </div>
  );
}