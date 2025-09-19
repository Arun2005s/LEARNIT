import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaGraduationCap, 
  FaHome, 
  FaStickyNote, 
  FaBook, 
  FaPlus, 
  FaUser, 
  FaSignOutAlt, 
  FaCog, 
  FaBars, 
  FaTimes,
  FaUsers,
  FaChartBar,
  FaFileAlt,
  FaClipboardList
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getNavItems = () => {
    if (!user) {
      return [
        { path: '/', label: 'Home', icon: FaHome },
        { path: '/login', label: 'Login', icon: FaUser },
        { path: '/register', label: 'Register', icon: FaUser }
      ];
    }

    const baseItems = [
      { path: '/', label: 'Home', icon: FaHome },
      { path: '/notes', label: 'Notes', icon: FaStickyNote },
      { path: '/assignments', label: 'Assignments', icon: FaBook }
    ];

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { path: '/admin', label: 'Dashboard', icon: FaChartBar },
        { path: '/admin/users', label: 'Users', icon: FaUsers },
        { path: '/admin/courses', label: 'Courses', icon: FaGraduationCap },
        { path: '/admin/assignments', label: 'Manage Assignments', icon: FaClipboardList },
        { path: '/create-note', label: 'Create Note', icon: FaPlus },
        { path: '/profile', label: 'Profile', icon: FaUser },
        { path: '/admin/settings', label: 'Settings', icon: FaCog }
      ];
    }

    if (user.role === 'educator') {
      return [
        ...baseItems,
        { path: '/educator/dashboard', label: 'Dashboard', icon: FaChartBar },
        { path: '/educator/courses', label: 'My Courses', icon: FaGraduationCap },
        { path: '/create-note', label: 'Create Note', icon: FaPlus },
        { path: '/profile', label: 'Profile', icon: FaUser }
      ];
    }

    if (user.role === 'student') {
      return [
        ...baseItems,
        { path: '/student/dashboard', label: 'Dashboard', icon: FaChartBar },
        { path: '/student/courses', label: 'My Courses', icon: FaGraduationCap },
        { path: '/profile', label: 'Profile', icon: FaUser }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <FaGraduationCap className="brand-icon" />
          {!isCollapsed && <span>LEARNIT</span>}
        </Link>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <FaUser />
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">{user.fullName || user.username}</div>
                <div className="user-role">{user.role}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title={isCollapsed ? 'Logout' : ''}>
            <FaSignOutAlt />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
