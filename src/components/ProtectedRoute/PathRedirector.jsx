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
    return <Navigate to="/auth/login" replace />;
  }

  if (tokenIsValid === null) {
    return null; // or a loading spinner, while we wait for the check
  }

  if (!tokenIsValid) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
