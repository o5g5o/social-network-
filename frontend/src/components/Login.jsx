import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Authorization";

function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth();
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
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username or Email"
           value={username}   
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>
        {loginMutation.isError && (
          <p style={{ color: "red" }}>
            {loginMutation.error.response?.data || "Login failed"}
          </p>
        )}
      </form>
    </div>
  );
}

export default Login;
