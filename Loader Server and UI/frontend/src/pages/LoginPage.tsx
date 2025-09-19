import { useState } from "react";
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiTerminal, FiWifi } from "react-icons/fi";
import request from "../axios";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (!username || !password) {
        setError("Please enter both username and password");
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
        onLogin();
      } else {
        setError("Login failed: Invalid server response");
        console.error("Invalid login response:", res);
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid username or password");
        } else {
          setError(`Login failed: ${err.response.data?.error || 'Server error'}`); 
        }
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Scanning Lines Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-scan-vertical"></div>
        <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-blue-500/50 to-transparent animate-scan-horizontal"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl mb-4 shadow-lg shadow-red-500/25">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              LoopJS
            </span>
          </h1>
          <p className="text-gray-400 text-sm">Command & Control Interface</p>
          <div className="flex items-center justify-center mt-2 text-xs text-green-400">
            <FiWifi className="w-3 h-3 mr-1" />
            <span>Secure Connection Established</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center">
                <FiUser className="w-4 h-4 mr-2" />
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                  placeholder="Enter your username"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center">
                <FiLock className="w-4 h-4 mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center text-red-400 text-sm">
                <FiShield className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || !username || !password}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <FiTerminal className="w-5 h-5 mr-2" />
                  Access System
                </>
              )}
            </button>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-700/50">
              <p className="text-xs text-gray-500">
                Authorized Personnel Only • Secure Access Required
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-6 flex justify-center space-x-4 text-xs">
          <div className="flex items-center text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            System Online
          </div>
          <div className="flex items-center text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse delay-500"></div>
            Secure Channel
          </div>
          <div className="flex items-center text-yellow-400">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse delay-1000"></div>
            Encrypted
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes scan-vertical {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes scan-horizontal {
          0% { left: -2px; }
          100% { left: 100%; }
        }
        .animate-scan-vertical {
          animation: scan-vertical 3s linear infinite;
        }
        .animate-scan-horizontal {
          animation: scan-horizontal 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
