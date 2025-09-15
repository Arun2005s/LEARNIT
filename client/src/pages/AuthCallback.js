import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthCallback.css';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (token && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          
          localStorage.setItem('token', token);
          
          await login(userData.email, '', true);
          
          navigate('/');
        } catch (error) {
          console.error('Error processing Google OAuth callback:', error);
          navigate('/login?error=oauth_failed');
        }
      } else {
        navigate('/login?error=oauth_failed');
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        <div className="loading-spinner"></div>
        <h2>Completing Google Sign-In...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
