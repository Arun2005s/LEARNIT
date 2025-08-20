import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGraduationCap, FaUsers, FaBook, FaComments, FaChartLine, FaRocket } from 'react-icons/fa';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalCourses: 0,
    recentNotes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notesResponse, usersResponse] = await Promise.all([
          axios.get('/api/notes'),
          user?.role === 'admin' ? axios.get('/api/users/stats/overview') : null
        ]);

        const notes = notesResponse.data;
        const recentNotes = notes.slice(0, 6);

        setStats({
          totalUsers: usersResponse?.data?.totalUsers || 0,
          totalNotes: notes.length,
          totalCourses: 0, 
          recentNotes
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const features = [
    {
      icon: <FaBook />,
      title: 'Interactive Notes',
      description: 'Create, share, and collaborate on educational content with rich text editing and file attachments.'
    },
    {
      icon: <FaComments />,
      title: 'Real-time Comments',
      description: 'Engage in discussions and provide feedback through an interactive commenting system.'
    },
    {
      icon: <FaUsers />,
      title: 'Role-based Access',
      description: 'Secure content management with admin controls and student access permissions.'
    },
    {
      icon: <FaChartLine />,
      title: 'Progress Tracking',
      description: 'Monitor learning progress and engagement with comprehensive analytics.'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
        <section className="hero">
          <div className="hero-content" style={{ marginLeft: '4rem' }}>
            <h1 className="hero-title">
          Welcome to the Online Learning Management System
            </h1>
            <p className="hero-subtitle">
          A modern platform for creating, sharing, and collaborating on educational content
            </p>
            {!user && (
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Sign In
            </Link>
          </div>
            )}
          </div>
          <div className="hero-image">
            <FaGraduationCap className="hero-icon" />
          </div>
        </section>

        {/* Statistics Section */}
      <section className="stats-section">
        <div className="container">
          <h2 className="section-title">System Overview</h2>
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
                <h3>{stats.totalNotes}</h3>
                <p>Total Notes</p>
              </div>
            </div>
            <div className="stat-card">
              <FaGraduationCap className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.totalCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>
            <div className="stat-card">
              <FaComments className="stat-icon" />
              <div className="stat-content">
                <h3>Active</h3>
                <p>Community</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Notes Section */}
      {stats.recentNotes.length > 0 && (
        <section className="recent-notes-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Recent Notes</h2>
              {user && (
                <Link to="/notes" className="btn btn-outline">
                  View All Notes
                </Link>
              )}
            </div>
            <div className="notes-grid">
              {stats.recentNotes.map((note) => (
                <div key={note._id} className="note-card">
                  <div className="note-header">
                    <h3 className="note-title">{note.title}</h3>
                    <span className="note-date">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="note-excerpt">
                    {note.content.substring(0, 150)}...
                  </p>
                  <div className="note-footer">
                    <span className="note-author">By {note.author?.fullName}</span>
                    {user && (
                      <Link to={`/notes/${note._id}`} className="btn btn-sm btn-primary">
                        Read More
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Learning?</h2>
            <p>Join our community and explore the world of online education</p>
            {!user ? (
              <Link to="/register" className="btn btn-primary btn-large">
                <FaRocket />
                Get Started Today
              </Link>
            ) : (
              <Link to="/notes" className="btn btn-primary btn-large">
                <FaBook />
                Browse Notes
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
