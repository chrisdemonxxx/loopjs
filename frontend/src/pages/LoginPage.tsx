import { useState } from "react";
import request from "../axios";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await request({
        method: "POST",
        url: "/login",
        data: { username, password },
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.status === 200) {
        const accessToken = res.data.accessToken;
        localStorage.setItem("isAuthenticated", "true");
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        onLogin();
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
      <div className="max-w-md w-full space-y-8 animate-scale-in">
        <h2 className="mb-4 text-xl font-semibold">Login</h2>
      <input
        className="border px-3 py-2 w-full mb-2"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="border px-3 py-2 w-full mb-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
        <button
          type="submit"
          disabled={false}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover-scale focus-ring"
          onClick={handleLogin}
        >
          Login
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
