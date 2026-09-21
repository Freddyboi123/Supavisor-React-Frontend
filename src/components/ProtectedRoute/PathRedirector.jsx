import { Navigate, Outlet } from "react-router";
import { IsTokenValid } from "../../../src/apiReader";
import { useState, useEffect } from "react";

export default function ProtectedRoute() {
  const [token] = useState(localStorage.getItem('jwtToken'));
  const [tokenIsValid, setTokenIsValid] = useState(null); // null = "still checking"


  useEffect(() => {
    if (!token) return;

    IsTokenValid(token).then((isValid) => {
      setTokenIsValid(isValid);
    });
  }, [token]);


  
  if (!token) {
    alert("Du skal være logget ind for at få adgang til denne side. Log ind for at fortsætte.");
    return <Navigate to="/auth/login" replace />;
    
  }

  if (tokenIsValid === null) {
    return null; // or a loading spinner, while we wait for the check
  }

  if (!tokenIsValid) {
    alert("Din session er udløbet. Log ind igen for at fortsætte.");
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
