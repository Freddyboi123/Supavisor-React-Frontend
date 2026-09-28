import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'

import './index.css'
import Admin from './components/Users/Admin/Admin.jsx'
import ProtectedRoute from './components/Auth/ProtectedRoute/PathRedirector.jsx'
import AdminOnly from './components/Auth/ProtectedRoute/AdminOnly.jsx'
import Employee from './components/Auth/ProtectedRoute/Employee.jsx'
import Auth from './components/Auth/AuthLayout.jsx'
import Login from './components/Auth/Login/Login.jsx'
import EmployeeDashboard from './components/Users/Admin/EmployeeDashboard/EmployeeDashboard.jsx'
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
          <Route path="/admin/employeeDashboard" element={<EmployeeDashboard />} />
          </Route>
          <Route element={<Employee />} >
          
          <Route path="*" element={<Employee />} />
          </Route>

        </Route>

      </Routes>

    </BrowserRouter>
    
  </StrictMode>,
)
