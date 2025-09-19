import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-brand">
          <FaGraduationCap className="brand-icon" />
          <span>LEARNIT</span>
        </Link>
        
        <div className="header-auth">
          <Link to="/login" className="btn btn-outline">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
