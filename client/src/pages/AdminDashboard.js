import React, { useState, useEffect } from 'react';
import { FaUsers, FaBook, FaChartLine, FaCog } from 'react-icons/fa';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    recentUsers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/users/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>System overview and management</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <FaUsers className="stat-icon" />
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <FaBook className="stat-icon" />
            <div className="stat-content">
              <h3>{stats.totalStudents}</h3>
              <p>Students</p>
            </div>
          </div>
          
          <div className="stat-card">
            <FaCog className="stat-icon" />
            <div className="stat-content">
              <h3>{stats.totalAdmins}</h3>
              <p>Administrators</p>
            </div>
          </div>
          
          <div className="stat-card">
            <FaChartLine className="stat-icon" />
            <div className="stat-content">
              <h3>Active</h3>
              <p>System Status</p>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section-card">
            <h3>Recent Users</h3>
            <div className="recent-users">
              {stats.recentUsers.map((user) => (
                <div key={user._id} className="user-item">
                  <div className="user-info">
                    <span className="user-name">{user.fullName}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                  <span className="user-date">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
