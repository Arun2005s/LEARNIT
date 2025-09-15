import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGraduationCap, FaBars, FaTimes, FaUser, FaSignOutAlt, FaBook } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <FaGraduationCap className="brand-icon" />
          <span>LEARNIT</span>
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          
          {user && (
            <>
              <Link to="/notes" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Notes
              </Link>
              <Link to="/assignments" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <FaBook />
                Assignments
              </Link>
              
              {user.role === 'admin' && (
                <>
                  <Link to="/create-note" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Create Note
                  </Link>
                  <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Admin
                  </Link>
                  <Link to="/admin/assignments" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <FaBook />
                    Manage Assignments
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-profile">
                <FaUser className="user-icon" />
                <span className="user-name">{user.fullName}</span>
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
