import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/Authorization";
import Login from "./components/auth/Login";
import Registration from "./components/auth/Register";
import Homepage from "./components/Homepage/Homepage";
import Profile from "./components/profile/profile";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ViewGroups } from "./components/groups/LeftBarGroup";
import "./App.css"

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />

    <Route path="/groups" element={
            <ProtectedRoute>
              <ViewGroups />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId?" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;