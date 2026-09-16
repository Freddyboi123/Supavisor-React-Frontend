import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'

import './index.css'
import App from './App.jsx'
import ProtectedRoute from './components/ProtectedRoute/PathRedirector.jsx'
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
          
          <Route path="*" element={<App />} />

        </Route>

      </Routes>

    </BrowserRouter>
    
  </StrictMode>,
)
