import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignup) {
        // Validate signup form
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (!formData.displayName.trim()) {
          throw new Error('Display name is required');
        }

        // Create new user
        await signup(formData.email, formData.password, formData.displayName);
      } else {
        // Login existing user
        await login(formData.email, formData.password);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>ACME</h1>
            <p>WINS NETWORK</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {isSignup && (
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  className="form-input"
                  placeholder="Enter your display name"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            {isSignup && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            
            {error && (
              <div className="message error">{error}</div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary login-btn" 
              disabled={isLoading}
            >
              {isLoading 
                ? (isSignup ? 'Creating Account...' : 'Signing In...') 
                : (isSignup ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>
          
          <div className="login-footer">
            <button 
              type="button" 
              className="btn-link" 
              onClick={toggleMode}
            >
              {isSignup 
                ? 'Already have an account? Sign In' 
                : 'Need an account? Sign Up'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
