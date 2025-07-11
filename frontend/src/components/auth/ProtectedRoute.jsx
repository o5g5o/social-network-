import { useAuth } from "./Authorization";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
