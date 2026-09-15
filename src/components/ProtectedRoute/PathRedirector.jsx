import { Navigate, Outlet } from "react-router";
import { IsTokenValid } from "../../../src/apiReader";

export default function ProtectedRoute() {

  
  const token = localStorage.getItem("jwtToken");
  const tokenIsValid = IsTokenValid(token);

  
  if (!token) {
    console.log("No token found. Redirecting to login page.");
    return <Navigate to="/auth/login" replace />;

    } else if (!tokenIsValid) {
      console.log("Token is invalid. Redirecting to login page.");
      return <Navigate to="/auth/login" replace />;
    }
  
  return <Outlet />;
}