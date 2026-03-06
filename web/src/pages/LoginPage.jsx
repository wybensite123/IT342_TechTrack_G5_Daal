import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/TechTrack.png';
import './LoginPage.css';

/* ── Auth Header ─────────────────────────────────────────────────── */
const AuthHeader = ({ onRegister }) => (
  <nav className="auth-header">
    <div className="auth-brand">
      <img src={logo} alt="TechTrack" className="auth-brand-logo" />
    </div>
    <div className="auth-header-nav">
      <span className="auth-nav-label">New to TechTrack?</span>
      <button className="auth-nav-btn" onClick={onRegister}>Register</button>
    </div>
  </nav>
);

/* ── Main Component ──────────────────────────────────────────────── */
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [exiting, setExiting] = useState(false);

  const navigateTo = (path) => {
    setExiting(true);
    setTimeout(() => navigate(path), 280);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email) { setError('Please enter your email.'); return; }
    if (!form.password) { setError('Please enter your password.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    try {
      const res = await loginApi(form);
      const data = res.data ?? {};
      if (!data.token) throw new Error('Missing authentication token from server response.');
      const userData = data.user ?? {
        email: data.email ?? form.email,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
      };
      login(data.token, userData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-container${exiting ? ' exiting' : ''}`}>
      <AuthHeader onRegister={() => navigateTo('/register')} />

      <div className="login-wrapper">
        {/* LEFT HERO */}
        <div className="login-left">
          <div className="trust-badge">
            <span className="badge-icon">⭐</span>
            <span>Trusted by 500+ Students & Faculty</span>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              IT Asset <span className="accent">Reimagined</span><br />For Modern Learning
            </h1>
            <p className="hero-desc">
              Experience the future of IT asset management with TechTrack. Seamless equipment requests, instant tracking, and comprehensive inventory management — all powered by cutting-edge technology.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Instant Booking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Real-Time Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>24/7 Support</span>
            </div>
          </div>

          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigateTo('/register')}>
              Start Your Journey
            </button>
            <button className="btn-secondary">Watch Demo</button>
          </div>

          <div className="rating-section">
            <div className="stars">⭐⭐⭐⭐⭐ 4.9/5</div>
            <p className="rating-text">from 12,000+ reviews</p>
          </div>
        </div>

        {/* RIGHT — LOGIN CARD */}
        <div className="login-right">
          <div className="login-card">
            <div className="logo-section">
              <img src={logo} alt="TechTrack" className="card-logo" />
            </div>

            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to access your account</p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="email" className="field-label">Email</label>
                <div className="input-container">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="email" name="email" type="email"
                    placeholder="firstname.lastname@cit.edu"
                    value={form.email} onChange={handleChange}
                    className="input-field" required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password" className="field-label">Password</label>
                <div className="input-container">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password} onChange={handleChange}
                    className="input-field" required
                  />
                  <button type="button" className="toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="checkbox-field">
                <input type="checkbox" id="remember" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)} />
                <label htmlFor="remember">Remember me</label>
              </div>

              <button type="submit" className="btn-signin" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="signup-text">
              Don't have an account?{' '}
              <button className="signup-link-btn" onClick={() => navigateTo('/register')}>
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
};

export default LoginPage;
