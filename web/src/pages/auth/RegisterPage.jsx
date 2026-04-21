import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerApi } from '../../api/authApi';
import logo from '../../assets/TechTrack.png';
import './LoginPage.css';
import './RegisterPage.css';

/* ── Auth Header ─────────────────────────────────────────────────── */
const AuthHeader = ({ onLogin }) => (
  <nav className="auth-header">
    <div className="auth-brand">
      <img src={logo} alt="TechTrack" className="auth-brand-logo" />
    </div>
    <div className="auth-header-nav">
      <span className="auth-nav-label">Already have an account?</span>
      <button className="auth-nav-btn" onClick={onLogin}>Sign In</button>
    </div>
  </nav>
);

/* ── Main Component ──────────────────────────────────────────────── */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exiting, setExiting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', agreeTerms: false,
  });

  const navigateTo = (path) => {
    setExiting(true);
    setTimeout(() => navigate(path), 280);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (name === 'password') calculatePasswordStrength(value);
  };

  const calculatePasswordStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    setPasswordStrength(s);
  };

  const strengthInfo = () => {
    if (passwordStrength <= 1) return { label: 'Weak', cls: 'weak' };
    if (passwordStrength <= 3) return { label: 'Medium', cls: 'medium' };
    return { label: 'Strong', cls: 'strong' };
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) { setError('First name is required.'); return false; }
    if (!formData.lastName.trim()) { setError('Last name is required.'); return false; }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required.'); return false;
    }
    setError(''); return true;
  };

  const validateStep2 = () => {
    if (!formData.password) { setError('Password is required.'); return false; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return false; }
    if (passwordStrength < 2) { setError('Password is too weak. Use uppercase, lowercase, and numbers.'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return false; }
    setError(''); return true;
  };

  const validateStep3 = () => {
    if (!formData.agreeTerms) { setError('You must agree to the terms and conditions.'); return false; }
    setError(''); return true;
  };

  const handleNext = () => {
    const valid = currentStep === 1 ? validateStep1() : currentStep === 2 ? validateStep2() : validateStep3();
    if (valid) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => { setError(''); setCurrentStep(currentStep - 1); };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsLoading(true);
    try {
      const res = await registerApi({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <AuthHeader onLogin={() => navigate('/login')} />
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Account Created!</h2>
          <p className="success-sub">
            Welcome to TechTrack! Your account has been successfully created.
            You'll be redirected to login in a moment.
          </p>
          <button className="btn-goto-login" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const stepTitles = ['Account Details', 'Security Setup', 'Review & Confirm'];
  const stepSubs = ['Tell us about yourself', 'Create a secure password', 'Agree to terms and register'];
  const { label: sLabel, cls: sCls } = strengthInfo();

  return (
    <div className={`login-container${exiting ? ' exiting' : ''}`}>
      <AuthHeader onLogin={() => navigateTo('/login')} />

      <div className="login-wrapper">
        {/* LEFT HERO */}
        <div className="login-left">
          <div className="trust-badge">
            <span className="badge-icon">🔒</span>
            <span>Secure & Easy Registration</span>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              Join <span className="accent">TechTrack</span><br />Today
            </h1>
            <p className="hero-desc">
              Create your account and gain instant access to IT asset management.
              Request equipment, track assets, and collaborate with your institution — all in one place.
            </p>
          </div>

          <div className="reg-steps-list">
            {[
              { num: 1, title: 'Account Details', desc: 'Your personal information' },
              { num: 2, title: 'Security Setup', desc: 'Create a secure password' },
              { num: 3, title: 'Confirmation', desc: 'Review and agree to terms' },
            ].map(({ num, title, desc }) => (
              <div
                key={num}
                className={`reg-step-item${num === currentStep ? ' active' : ''}${num < currentStep ? ' done' : ''}`}
              >
                <div className="reg-step-num">{num < currentStep ? '✓' : num}</div>
                <div className="reg-step-info">
                  <div className="reg-step-title">{title}</div>
                  <div className="reg-step-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rating-section">
            <div className="stars">⭐⭐⭐⭐⭐ 4.9/5</div>
            <p className="rating-text">Trusted by 500+ students & faculty</p>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="login-right">
          <div className="login-card reg-card">
            {/* Logo */}
            <div className="logo-section">
              <img src={logo} alt="TechTrack" className="card-logo" />
            </div>

            {/* Step dots */}
            <div className="reg-step-indicator">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`reg-step-dot${s === currentStep ? ' active' : ''}${s < currentStep ? ' done' : ''}`}
                />
              ))}
            </div>

            {/* Title */}
            <div>
              <h2 className="login-title">{stepTitles[currentStep - 1]}</h2>
              <p className="login-subtitle" style={{ marginTop: 6 }}>{stepSubs[currentStep - 1]}</p>
            </div>

            {/* Progress bar */}
            <div className="reg-progress-bar">
              <div className="reg-progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }} />
            </div>

            {/* STEP 1 — Account Details */}
            {currentStep === 1 && (
              <div className="reg-form-fields">
                <div className="reg-grid-2">
                  <div className="form-field">
                    <label htmlFor="firstName" className="field-label">
                      First Name <span className="reg-required">*</span>
                    </label>
                    <div className="input-container">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        id="firstName" name="firstName" type="text"
                        className="input-field" placeholder="firstname"
                        value={formData.firstName} onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="lastName" className="field-label">
                      Last Name <span className="reg-required">*</span>
                    </label>
                    <div className="input-container">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        id="lastName" name="lastName" type="text"
                        className="input-field" placeholder="lastname"
                        value={formData.lastName} onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="email" className="field-label">
                    Email Address <span className="reg-required">*</span>
                  </label>
                  <div className="input-container">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="email" name="email" type="email"
                      className="input-field" placeholder="firstname.lastname@cit.edu"
                      value={formData.email} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Security */}
            {currentStep === 2 && (
              <div className="reg-form-fields">
                <div className="form-field">
                  <label htmlFor="password" className="field-label">
                    Password <span className="reg-required">*</span>
                  </label>
                  <div className="input-container">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="input-field" placeholder="Create a strong password"
                      value={formData.password} onChange={handleChange}
                    />
                    <button type="button" className="toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="strength-wrap">
                      <div className="strength-bars">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`strength-bar${i < passwordStrength ? ` ${sCls}` : ''}`} />
                        ))}
                      </div>
                      <span className={`strength-label ${sCls}`}>{sLabel}</span>
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="confirmPassword" className="field-label">
                    Confirm Password <span className="reg-required">*</span>
                  </label>
                  <div className="input-container">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="confirmPassword" name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="input-field" placeholder="Re-enter your password"
                      value={formData.confirmPassword} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Confirmation */}
            {currentStep === 3 && (
              <div className="reg-form-fields">
                <div className="summary-box">
                  <h3 className="summary-title">Review Your Information</h3>
                  <div className="summary-row">
                    <span className="summary-label">Name</span>
                    <span className="summary-value">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Email</span>
                    <span className="summary-value">{formData.email}</span>
                  </div>
                </div>
                <div className="terms-check">
                  <input
                    type="checkbox" id="agreeTerms" name="agreeTerms"
                    checked={formData.agreeTerms} onChange={handleChange}
                  />
                  <label htmlFor="agreeTerms" className="terms-text">
                    I agree to the{' '}
                    <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a> and{' '}
                    <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
                  </label>
                </div>
              </div>
            )}

            {error && <div className="field-error">{error}</div>}

            <div className="btn-row">
              {currentStep > 1 && (
                <button type="button" className="btn-back" onClick={handleBack}>← Back</button>
              )}
              {currentStep < 3 ? (
                <button type="button" className="btn-next" onClick={handleNext}>Continue →</button>
              ) : (
                <button type="button" className="btn-submit" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>

            <p className="signup-text">
              Already have an account?{' '}
              <button className="signup-link-btn" onClick={() => navigateTo('/login')}>Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
