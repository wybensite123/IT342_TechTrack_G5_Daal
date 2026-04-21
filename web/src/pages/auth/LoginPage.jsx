import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, register as registerApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/TechTrack.png';
import './LoginPage.css';

/* ── Auth Header ─────────────────────────────────────────────────── */
const AuthHeader = ({ isLogin, onSwitchForm }) => (
  <nav className="auth-header">
    <div className="auth-brand">
      <img src={logo} alt="TechTrack" className="auth-brand-logo" />
    </div>
    <div className="auth-header-nav">
      <span className="auth-nav-label">{isLogin ? 'New to TechTrack?' : 'Already have an account?'}</span>
      <button className="auth-nav-btn" onClick={onSwitchForm}>
        {isLogin ? 'Register' : 'Sign In'}
      </button>
    </div>
  </nav>
);

/* ── Main Component ──────────────────────────────────────────────── */
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', agreeTerms: false 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const switchForm = () => {
    setError('');
    setIsLogin(!isLogin);
  };

  const handleLoginChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm({ ...registerForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email) { setError('Please enter your email.'); return; }
    if (!form.password) { setError('Please enter your password.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    try {
      const res = await loginApi(form);
      const payload = res.data?.data;
      if (!payload?.accessToken) throw new Error('Missing authentication token from server response.');
      login(payload.accessToken, payload.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!registerForm.firstName) { setError('Please enter your first name.'); return; }
    if (!registerForm.lastName) { setError('Please enter your last name.'); return; }
    if (!registerForm.email) { setError('Please enter your email.'); return; }
    if (!registerForm.password) { setError('Please enter a password.'); return; }
    if (registerForm.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (registerForm.password !== registerForm.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!registerForm.agreeTerms) { setError('You must agree to the terms and conditions.'); return; }

    setIsLoading(true);
    try {
      const res = await registerApi(registerForm);
      const payload = res.data?.data;
      if (!payload?.accessToken) throw new Error('Missing authentication token from server response.');
      login(payload.accessToken, payload.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <AuthHeader isLogin={isLogin} onSwitchForm={switchForm} />

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
            <button className="btn-primary" onClick={switchForm}>
              {isLogin ? 'Start Your Journey' : 'Back to Sign In'}
            </button>
            <button className="btn-secondary">Watch Demo</button>
          </div>

          <div className="rating-section">
            <div className="stars">⭐⭐⭐⭐⭐ 4.9/5</div>
            <p className="rating-text">from 12,000+ reviews</p>
          </div>
        </div>

        {/* RIGHT — FORM CARDS WITH ANIMATION */}
        <div className="login-right">
          {/* LOGIN CARD */}
          <div className={`auth-card-wrapper ${isLogin ? 'active' : 'hidden'}`}>
            <div className="login-card">
              <div className="logo-section">
                <img src={logo} alt="TechTrack" className="card-logo" />
              </div>

              <h2 className="login-title">Welcome Back</h2>
              <p className="login-subtitle">Sign in to access your account</p>

              <form onSubmit={handleLoginSubmit}>
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
                      value={form.email} onChange={handleLoginChange}
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
                      value={form.password} onChange={handleLoginChange}
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
                <button className="signup-link-btn" onClick={switchForm}>
                  Sign up
                </button>
              </p>
            </div>
          </div>

          {/* REGISTER CARD */}
          <div className={`auth-card-wrapper ${!isLogin ? 'active' : 'hidden'}`}>
            <div className="login-card">
              <div className="logo-section">
                <img src={logo} alt="TechTrack" className="card-logo" />
              </div>

              <h2 className="login-title">Create Account</h2>
              <p className="login-subtitle">Join TechTrack today</p>

              <form onSubmit={handleRegisterSubmit}>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="firstName" className="field-label">First Name</label>
                    <input
                      id="firstName" name="firstName" type="text"
                      placeholder="John"
                      value={registerForm.firstName} onChange={handleRegisterChange}
                      className="input-field" required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="lastName" className="field-label">Last Name</label>
                    <input
                      id="lastName" name="lastName" type="text"
                      placeholder="Doe"
                      value={registerForm.lastName} onChange={handleRegisterChange}
                      className="input-field" required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="reg-email" className="field-label">Email</label>
                  <input
                    id="reg-email" name="email" type="email"
                    placeholder="firstname.lastname@cit.edu"
                    value={registerForm.email} onChange={handleRegisterChange}
                    className="input-field" required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="reg-password" className="field-label">Password</label>
                  <input
                    id="reg-password" name="password" type="password"
                    placeholder="Enter your password"
                    value={registerForm.password} onChange={handleRegisterChange}
                    className="input-field" required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirm-password" className="field-label">Confirm Password</label>
                  <input
                    id="confirm-password" name="confirmPassword" type="password"
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword} onChange={handleRegisterChange}
                    className="input-field" required
                  />
                </div>

                <div className="checkbox-field">
                  <input type="checkbox" id="agreeTerms" checked={registerForm.agreeTerms}
                    onChange={handleRegisterChange} name="agreeTerms" />
                  <label htmlFor="agreeTerms">I agree to the Terms & Conditions</label>
                </div>

                <button type="submit" className="btn-signin" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="signup-text">
                Already have an account?{' '}
                <button className="signup-link-btn" onClick={switchForm}>
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
};

export default LoginPage;
