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
        localStorage.setItem("isAuthenticated", "true");
        onLogin();
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
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
      <button className="bg-blue-600 text-white px-4 py-2 w-full" onClick={handleLogin}>
        Login
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
