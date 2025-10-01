import { useState, useEffect } from "react";
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiTerminal, FiWifi, FiCpu, FiZap, FiActivity, FiGlobe } from "react-icons/fi";
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
    } catch (err) {
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
      case 'hacker': return 'HACKER TERMINAL';
      case 'matrix': return 'MATRIX ACCESS';
      case 'cyberpunk': return 'CYBERPUNK 2077';
      case 'synthwave': return 'RETRO WAVE';
      case 'void': return 'THE VOID';
      case 'neon-punk': return 'NEON PUNK';
      case 'ai-core': return 'AI CORE';
      case 'blood': return 'BLOOD RED';
      case 'glass': return 'GLASS MORPHISM';
      case 'hologram': return 'HOLOGRAPHIC';
      default: return 'C2 COMMAND PANEL';
    }
  };

  const getThemeSubtitle = () => {
    switch (mode) {
      case 'hacker': return 'Access the underground network';
      case 'matrix': return 'Enter the digital realm';
      case 'cyberpunk': return 'Welcome to Night City';
      case 'synthwave': return 'Step into the 80s future';
      case 'void': return 'Enter the infinite darkness';
      case 'neon-punk': return 'Join the electric rebellion';
      case 'ai-core': return 'Connect to machine consciousness';
      case 'blood': return 'Enter the crimson domain';
      case 'glass': return 'Transparent security protocol';
      case 'hologram': return 'Futuristic authentication';
      default: return 'Secure command and control';
    }
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'hacker': return '💚';
      case 'matrix': return '🔋';
      case 'cyberpunk': return '🌆';
      case 'synthwave': return '🌅';
      case 'void': return '🌌';
      case 'neon-punk': return '⚡';
      case 'ai-core': return '🤖';
      case 'blood': return '🩸';
      case 'glass': return '🔮';
      case 'hologram': return '🌈';
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
        {(mode === 'hacker' || mode === 'matrix' || mode === 'cyberpunk' || mode === 'ai-core') && (
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
        
        {/* Holographic effects */}
        {mode === 'hologram' && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 animate-pulse"></div>
        )}
        
        {/* Glass morphism overlay */}
        {mode === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm"></div>
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
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="h-5 w-5 text-primary" />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-primary" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-12 py-3 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5 text-bodydark2 hover:text-primary transition-colors" />
              ) : (
                <FiEye className="h-5 w-5 text-bodydark2 hover:text-primary transition-colors" />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiShield className="h-5 w-5 mr-2" />
                Access System
              </div>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-bodydark2">
            <div className="flex items-center">
              <FiTerminal className="h-4 w-4 mr-1" />
              Terminal Ready
            </div>
            <div className="flex items-center">
              <FiWifi className="h-4 w-4 mr-1" />
              Network Active
            </div>
            <div className="flex items-center">
              <FiShield className="h-4 w-4 mr-1" />
              Secure Protocol
            </div>
          </div>
        </div>

        {/* Theme-specific decorations */}
        {mode === 'hacker' && (
          <div className="absolute top-4 left-4 text-green-400 font-mono text-xs animate-pulse">
            root@system:~$
          </div>
        )}
        
        {mode === 'matrix' && (
          <div className="absolute top-4 right-4 text-green-500 font-mono text-xs">
            <div className="animate-pulse">01010101</div>
            <div>01101001</div>
          </div>
        )}
        
        {mode === 'cyberpunk' && (
          <div className="absolute top-4 right-4 text-cyan-400 font-bold text-xs">
            <div className="animate-pulse">NEON</div>
            <div>CITY</div>
          </div>
        )}
        
        {mode === 'synthwave' && (
          <div className="absolute top-4 right-4 text-pink-400 font-bold text-xs">
            <div className="animate-pulse">RETRO</div>
            <div>WAVE</div>
          </div>
        )}
        
        {mode === 'void' && (
          <div className="absolute top-4 right-4 text-white font-bold text-xs">
            <div className="animate-pulse">VOID</div>
            <div>∞</div>
          </div>
        )}
        
        {mode === 'neon-punk' && (
          <div className="absolute top-4 right-4 text-yellow-400 font-bold text-xs">
            <div className="animate-pulse">PUNK</div>
            <div>⚡</div>
          </div>
        )}
        
        {mode === 'ai-core' && (
          <div className="absolute top-4 right-4 text-cyan-300 font-bold text-xs">
            <div className="animate-pulse">AI</div>
            <div>🤖</div>
          </div>
        )}
      </div>
    </div>
  );
}