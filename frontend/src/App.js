import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Subscribe from './pages/Subscribe';
import Browse from './pages/Browse';
import Favorites from './pages/Favorites';
import Collections from './pages/Collections';
import Creator from './pages/Creator';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './components/auth/AuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id (Auth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/browse" element={<Browse />} />
      
      <Route 
        path="/favorites" 
        element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/collections" 
        element={
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/creator" 
        element={
          <ProtectedRoute>
            <Creator />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireRole="admin">
            <Admin />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin-dashboard" 
        element={<AdminDashboard />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
