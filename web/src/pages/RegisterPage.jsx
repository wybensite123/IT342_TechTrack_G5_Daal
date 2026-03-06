import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerApi } from '../api/authApi';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 1 || passwordStrength === 0) return { label: 'Weak', class: 'weak' };
    if (passwordStrength === 2 || passwordStrength === 3) return { label: 'Medium', class: 'medium' };
    return { label: 'Strong', class: 'strong' };
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required.');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password) {
      setError('Password is required.');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (passwordStrength < 2) {
      setError('Password is too weak. Use uppercase, lowercase, and numbers.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep3 = () => {
    if (!formData.agreeTerms) {
      setError('You must agree to the terms and conditions.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    const isValid = 
      currentStep === 1 ? validateStep1() :
      currentStep === 2 ? validateStep2() :
      validateStep3();

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await registerApi({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 201 || response.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-container">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Account Created</h2>
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

  return (
    <div className="register-container">
      <div className="register-wrapper">
        {/* LEFT SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-top">
            <div className="logo-wrap">
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

            <h2 className="sidebar-title">
              Create Your <span className="accent">TechTrack</span> Account
            </h2>
            <p className="sidebar-desc">
              Join thousands of students and faculty managing IT assets with confidence.
            </p>

            <div className="steps">
              {[1, 2, 3].map((step) => (
                <div key={step} className="step">
                  <div className={`step-num ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'done' : ''}`}>
                    {step < currentStep ? '✓' : step}
                  </div>
                  <div className="step-info">
                    <div className="step-label">
                      {step === 1 && 'Account Details'}
                      {step === 2 && 'Security'}
                      {step === 3 && 'Confirmation'}
                    </div>
                    <div className="step-sublabel">
                      {step === 1 && 'Your information'}
                      {step === 2 && 'Set your password'}
                      {step === 3 && 'Review & agree'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-footer">
            <p className="already-link">
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>

        {/* RIGHT MAIN FORM */}
        <div className="main">
          <div className="form-header">
            <div className="step-indicator">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`step-dot ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'done' : ''}`} />
              ))}
            </div>
            <h1 className="form-title">
              {currentStep === 1 && 'Account Details'}
              {currentStep === 2 && 'Security'}
              {currentStep === 3 && 'Review & Confirm'}
            </h1>
            <p className="form-sub">
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'Create a secure password'}
              {currentStep === 3 && 'Agree to terms and register'}
            </p>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentStep / 3) * 100}%` }} />
          </div>

          <div className="steps-container">
            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="form-step active">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      First Name <span className="required-dot">*</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        name="firstName"
                        className={`form-input ${formData.firstName ? 'valid' : ''}`}
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Last Name <span className="required-dot">*</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        name="lastName"
                        className={`form-input ${formData.lastName ? 'valid' : ''}`}
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email Address <span className="required-dot">*</span>
                  </label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      name="email"
                      className={`form-input ${formData.email ? 'valid' : ''}`}
                      placeholder="john.doe@cit.edu"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                </div>


              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="form-step active">
                <div className="form-group">
                  <label className="form-label">
                    Password <span className="required-dot">*</span>
                  </label>
                  <div className="input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`form-input ${formData.password ? (passwordStrength >= 2 ? 'valid' : 'error') : ''}`}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="strength-wrap">
                      <div className="strength-bars">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`strength-bar ${i < passwordStrength ? getPasswordStrengthLabel().class : ''}`}
                          />
                        ))}
                      </div>
                      <div className={`strength-label ${getPasswordStrengthLabel().class}`}>
                        {getPasswordStrengthLabel().label}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Confirm Password <span className="required-dot">*</span>
                  </label>
                  <div className="input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className={`form-input ${formData.confirmPassword ? (formData.password === formData.confirmPassword ? 'valid' : 'error') : ''}`}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="form-step active">
                <div className="summary-box">
                  <h3 className="summary-title">Review Your Information</h3>
                  <div className="summary-row">
                    <span className="summary-label">Name:</span>
                    <span className="summary-value">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Email:</span>
                    <span className="summary-value">{formData.email}</span>
                  </div>
                </div>

                <div className="terms-check">
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                  <label htmlFor="terms" className="terms-text">
                    I agree to the <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
                    <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                  </label>
                </div>
              </div>
            )}
          </div>

          {error && <div className="field-error">{error}</div>}

          <div className="btn-row">
            {currentStep > 1 && (
              <button type="button" className="btn-back" onClick={handleBack}>
                ← Back
              </button>
            )}
            {currentStep < 3 && (
              <button type="button" className="btn-next" onClick={handleNext}>
                Next →
              </button>
            )}
            {currentStep === 3 && (
              <button type="button" className="btn-submit" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
