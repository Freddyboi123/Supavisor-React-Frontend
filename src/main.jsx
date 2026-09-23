import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'

import './index.css'
import Admin from './components/Admin.jsx'
import ProtectedRoute from './components/ProtectedRoute/PathRedirector.jsx'
import AdminOnly from './components/ProtectedRoute/AdminOnly.jsx'
import Employee from './components/ProtectedRoute/Employee.jsx'
import Auth from './components/Auth/AuthLayout.jsx'
import Login from './components/Login/Login.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <BrowserRouter>

        
      <Routes>

        <Route path="/auth" element={<Auth />}>
          <Route path="login" element={<Login />}/>
        
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminOnly />} >
          <Route path="*" element={<Admin />} /> 
          </Route>
          <Route element={<Employee />} >
          
          </Route>

        </Route>

      </Routes>

    </BrowserRouter>
    
  </StrictMode>,
)
