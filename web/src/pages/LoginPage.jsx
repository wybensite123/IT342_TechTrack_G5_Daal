import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email) {
      setError('Please enter your email.');
      return;
    }
    if (!form.password) {
      setError('Please enter your password.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginApi(form);
      const data = res.data ?? {};
      if (!data.token) {
        throw new Error('Missing authentication token from server response.');
      }

      // Backend returns flat fields (email/firstName/lastName), not always a nested user object.
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
    <div className="login-container">
      <div className="login-wrapper">
        {/* LEFT SECTION */}
        <div className="login-left">
          <div className="trust-badge">
            <span className="badge-icon">⭐</span>
            <span className="badge-text">Trusted by 500+ Students & Faculty</span>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              IT Asset <span className="accent">Reimagined</span><br /> For Modern Learning
            </h1>
            <p className="hero-desc">
              Experience the future of IT asset management with TechTrack. Seamless equipment requests, instant tracking, and comprehensive inventory management — all powered by cutting-edge technology.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Instant Booking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Real-Time Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">24/7 Support</span>
            </div>
          </div>

          <div className="cta-buttons">
            <button className="btn-primary">Start Your Journey</button>
            <button className="btn-secondary">Watch Demo</button>
          </div>

          <div className="rating-section">
            <div className="stars">⭐⭐⭐⭐⭐ 4.9/5</div>
            <p className="rating-text">from 12,000+ reviews</p>
          </div>
        </div>

        {/* RIGHT SECTION - Login Card */}
        <div className="login-right">
          <div className="login-card">
            <div className="logo-section">
              <svg className="logo-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path d="M100 25 L155 55 L155 110 Q155 145 100 175 Q45 145 45 110 L45 55 Z" fill="url(#shieldGradient)" />
                <path d="M100 25 L155 55 L155 110 Q155 145 100 175 Q45 145 45 110 L45 55 Z" fill="none" stroke="#00D9FF" strokeWidth="1.5" />
                <circle cx="100" cy="105" r="30" fill="none" stroke="#00D9FF" strokeWidth="1.5" opacity="0.7" />
                <circle cx="100" cy="105" r="20" fill="none" stroke="#00D9FF" strokeWidth="1" opacity="0.5" />
                <circle cx="100" cy="100" r="5" fill="#10B981" />
                <path d="M100 65 L100 90" stroke="#10B981" strokeWidth="2" />
                <path d="M100 110 L100 135" stroke="#10B981" strokeWidth="2" />
                <path d="M75 100 L85 100" stroke="#10B981" strokeWidth="2" />
                <path d="M115 100 L125 100" stroke="#10B981" strokeWidth="2" />
              </svg>
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
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g firstname.lastname@cit.edu"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field"
                    required
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
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                  <button type="button" className="toggle-icon" onClick={togglePassword}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="checkbox-field">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">Remember me</label>
              </div>

              <button type="submit" className="btn-signin" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="signup-text">
              Don't have an account? <Link to="/register" className="signup-link">Sign up</Link>
            </p>
          </div>
        </div>
      </div>

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
};

export default LoginPage;
