import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import BookDetail from './pages/BookDetail';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import { useUser } from './hooks/useUser';

function App() {
  const { user, loading } = useUser();

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Home /> : <Navigate to="/onboarding" />} 
          />
          <Route 
            path="/onboarding" 
            element={!user ? <Onboarding /> : <Navigate to="/" />} 
          />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
