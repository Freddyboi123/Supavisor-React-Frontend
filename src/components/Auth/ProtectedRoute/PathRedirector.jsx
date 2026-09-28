import { Navigate, Outlet } from "react-router";
import { IsTokenValid } from "../../../apiReader.js";
import { useState, useEffect } from "react";
import { getUserFromToken } from "../../Utils/GetUser.jsx";

export default function ProtectedRoute() {
  const [token] = useState(localStorage.getItem('jwtToken'));
  const [tokenIsValid, setTokenIsValid] = useState(null); // null = "still checking"
  const [currentUser] = useState(getUserFromToken());


  useEffect(() => {
    if (!token) return;

    IsTokenValid(token).then((isValid) => {
      setTokenIsValid(isValid);
      console.log('Token validity check result:', isValid); // Debugging line
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
