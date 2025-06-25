

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Authorization";

function Login() {
  const navigate = useNavigate()
  const {setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (userdata) => {
      const res = await axios.post("http://localhost:8080/login", userdata, {withCredentials: true});
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      setUser(data);
      navigate("/")
    },
    onError: (error) => {
      console.error("Login failed:", error.response?.data || error.message);
      setUser(null)
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
<div className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
    <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="username"
        placeholder="Username or Email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition duration-200"
      >
        {loginMutation.isPending ? "Logging in..." : "Login"}
      </button>

      {loginMutation.isError && (
        <p className="text-red-500 text-sm text-center">
          {loginMutation.error.response?.data || "Login failed"}
        </p>
      )}
      <div className="flex justify-center">
          <p>
            Don't have an account? {" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:underline font-medium"
              >
              Create an account
            </Link>
          </p>
        </div>
    </form>
  </div>
</div>

  );
}

export default Login;

