import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const clearErrorIfEmpty = (updated) => {
    if (!updated.email && !updated.password) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.code || err.message);
      setError(err.response?.data?.message || err.code || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Nexus Social</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email" required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => {
                const next = { ...form, email: e.target.value };
                setForm(next);
                clearErrorIfEmpty(next);
              }}
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password" required
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => {
                const next = { ...form, password: e.target.value };
                setForm(next);
                clearErrorIfEmpty(next);
              }}
            />
          </div>
          <div className="auth-error-center">{error || ''}</div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <span className="btn-auth-spinner" /> : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
