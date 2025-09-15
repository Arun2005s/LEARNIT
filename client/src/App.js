import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import CreateNote from './pages/CreateNote';
import EditNote from './pages/EditNote';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminAssignments from './pages/AdminAssignments';
import Assignments from './pages/Assignments';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/" /> : <Register />} 
          />
          <Route 
            path="/auth/callback" 
            element={<AuthCallback />} 
          />
          <Route 
            path="/notes" 
            element={user ? <Notes /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/notes/:id" 
            element={user ? <NoteDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/create-note" 
            element={user?.role === 'admin' ? <CreateNote /> : <Navigate to="/" />} 
          />
          <Route 
            path="/notes/:id/edit" 
            element={user ? <EditNote /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/assignments" 
            element={user?.role === 'admin' ? <AdminAssignments /> : <Navigate to="/" />} 
          />
          <Route 
            path="/assignments" 
            element={user ? <Assignments /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
