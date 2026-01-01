import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Subscribe from './pages/Subscribe';
import Browse from './pages/Browse';
import Sync from './pages/Sync';
import Favorites from './pages/Favorites';
import Collections from './pages/Collections';
import Creator from './pages/Creator';
import AdminDashboard from './pages/AdminDashboard';
import PackDetail from './pages/PackDetail';
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
      <Route path="/sync" element={<Sync />} />
      <Route path="/pack/:packId" element={<PackDetail />} />
      
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
      
      {/* Admin routes - both /admin and /admin-dashboard go to the full dashboard */}
      <Route 
        path="/admin" 
        element={<AdminDashboard />}
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
