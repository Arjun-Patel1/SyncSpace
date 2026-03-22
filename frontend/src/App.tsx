import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';
import BoardView from './BoardView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is already logged in when the app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* If logged in, go to Dashboard. Otherwise, go to Login */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} 
        />
        
        {/* The Authentication Screen */}
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <Auth onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />} 
        />
        
        {/* The actual Board Workspace */}
        <Route 
          path="/board/:boardId" 
          element={isAuthenticated ? <BoardView /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </Router>
  );
}