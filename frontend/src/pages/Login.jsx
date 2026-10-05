import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  AlertCircle,
  X,
  CheckCircle2,
  Mail,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, login, getDashboardPath } = useAuth();

  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [touched, setTouched] = useState({ identifier: false, password: false });

  // UI & Feedback State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Interactive Brevo OTP Password Reset State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email/Username, 2: OTP & New Password, 3: Success
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpNotice, setDevOtpNotice] = useState('');


  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (!authLoading && user && (token || localStorage.getItem('zentra_token'))) {
      const target = getDashboardPath
        ? getDashboardPath(user)
        : (user.role_name === 'admin' ? '/admin' : (user.user_type === 'client' ? '/client' : '/employee'));
      navigate(target, { replace: true });
    }
  }, [user, token, authLoading, navigate, getDashboardPath]);

  // Validation Rules
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isIdentifierValid = identifier.trim().length >= 3;
  const isPasswordValid = password.length >= 6;

  // Submit Login
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched({ identifier: true, password: true });

    if (!isIdentifierValid || !isPasswordValid) {
      setError('Please provide a valid username/email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await login(identifier.trim(), password);
      const target = getDashboardPath
        ? getDashboardPath(data.user)
        : (data.user.role_name === 'admin' ? '/admin' : (data.user.user_type === 'client' ? '/client' : '/employee'));
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for Brevo OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOpenForgotModal = () => {
    setForgotIdentifier(identifier.trim());
    setForgotStep(1);
    setForgotError('');
    setForgotSuccessMsg('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setDevOtpNotice('');
    setShowForgotModal(true);
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotError('');
    setForgotSuccessMsg('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email address or username.');
      return;
    }
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      setResolvedEmail(res.email);
      setMaskedEmail(res.maskedEmail || res.email);
      setForgotStep(2);
      setResendCooldown(60);
      if (res.devOtp) {
        setDevOtpNotice(`Brevo Verification Code: ${res.devOtp}`);
      } else {
        setDevOtpNotice('');
      }
      setForgotSuccessMsg(res.message || 'Verification code dispatched to your email.');
    } catch (err) {
      setForgotError(err.message || 'Failed to dispatch verification code. Please check your username/email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || forgotLoading) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.post('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      setResendCooldown(60);
      if (res.devOtp) {
        setDevOtpNotice(`Brevo Verification Code: ${res.devOtp}`);
      }
      setForgotSuccessMsg('A new verification code has been dispatched to your email.');
    } catch (err) {
      setForgotError(err.message || 'Failed to resend code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetWithOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError('');

    if (!forgotOtp.trim() || !/^\d{6}$/.test(forgotOtp.trim())) {
      setForgotError('Please enter the complete 6-digit verification code sent to your email.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New passwords do not match. Please verify both fields.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await api.post('/auth/reset-password-otp', {
        email: resolvedEmail,
        otp: forgotOtp.trim(),
        new_password: forgotNewPassword
      });

      setForgotStep(3);
      if (res.username) {
        setIdentifier(res.username);
      }
      setPassword(forgotNewPassword);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <div className="auth-page">
      {/* Big Blurred Zentra Logo in Page Background Center */}
      <div className="auth-bg-logo-wrap" aria-hidden="true">
        <img
          src="/logoofclient/zentra_digital-removebg-preview.png"
          alt="Zentra Digital Ambient Background Logo"
          className="auth-bg-logo-img"
        />
      </div>

      {/* Ambient Visual Backdrops */}
      <div className="auth-backdrop-glow-top" />
      <div className="auth-backdrop-glow-bottom" />
      <div className="auth-grid-overlay" />

      {/* Main Single-Column Login Card */}
      <div className="auth-card">

        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-brand-logo-wrap">
            <img
              src="/logoofclient/zentra_digital-removebg-preview.png"
              alt="Zentra Digital Logo"
              className="auth-brand-logo-img"
            />
          </div>
          <p className="auth-brand-subtitle">
            Enterprise Agency Operations & Performance Portal
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="auth-alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ================= LOGIN FORM ================= */}
        <form onSubmit={handleLoginSubmit} className="auth-form-animated" noValidate>
          {/* Email / Username Field */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-identifier">
              Email or Username
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <User size={17} />
              </span>
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (!touched.identifier) setTouched(p => ({ ...p, identifier: true }));
                }}
                onBlur={() => setTouched(p => ({ ...p, identifier: true }))}
                placeholder="name@zentradigital.com or username"
                autoComplete="username"
                required
                className={`auth-input ${touched.identifier
                  ? (isIdentifierValid ? 'is-valid' : 'is-invalid')
                  : ''
                  }`}
              />
              {touched.identifier && (
                <span className={`auth-input-status-icon ${isIdentifierValid ? 'valid' : 'invalid'}`}>
                  {isIdentifierValid ? <Check size={16} /> : <AlertCircle size={16} />}
                </span>
              )}
            </div>
            {touched.identifier && !isIdentifierValid && (
              <div className="auth-field-error-msg">
                <AlertCircle size={12} /> Minimum 3 characters required
              </div>
            )}
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={17} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!touched.password) setTouched(p => ({ ...p, password: true }));
                }}
                onBlur={() => setTouched(p => ({ ...p, password: true }))}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className={`auth-input ${touched.password
                  ? (isPasswordValid ? 'is-valid' : 'is-invalid')
                  : ''
                  }`}
              />
              {touched.password && (
                <span className={`auth-input-status-icon with-toggle ${isPasswordValid ? 'valid' : 'invalid'}`}>
                  {isPasswordValid ? <Check size={16} /> : <AlertCircle size={16} />}
                </span>
              )}
              <button
                type="button"
                className="auth-input-action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {touched.password && !isPasswordValid && (
              <div className="auth-field-error-msg">
                <AlertCircle size={12} /> Password must be at least 6 characters
              </div>
            )}
          </div>

          {/* Additional Controls: Remember Me & Forgot Password */}
          <div className="auth-controls-row">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-checkbox"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="auth-link"
              onClick={handleOpenForgotModal}
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Platform</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Footer Return Link */}
        <div className="auth-footer">
          <a href="/" className="auth-return-link">
            ← Return to Zentra Digital Marketing Website
          </a>
        </div>
      </div>

      {/* Interactive Brevo OTP Password Reset Modal */}
      {showForgotModal && (
        <div className="auth-modal-backdrop" onClick={handleCloseForgotModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="auth-modal-close"
              onClick={handleCloseForgotModal}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Step Progress Pills */}
            <div className="auth-modal-steps">
              <div className={`auth-step-pill ${forgotStep >= 1 ? (forgotStep > 1 ? 'completed' : 'active') : ''}`} />
              <div className={`auth-step-pill ${forgotStep >= 2 ? (forgotStep > 2 ? 'completed' : 'active') : ''}`} />
              <div className={`auth-step-pill ${forgotStep >= 3 ? 'completed' : ''}`} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(229, 9, 20, 0.15)',
                color: '#E50914',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(229, 9, 20, 0.3)',
                flexShrink: 0
              }}>
                {forgotStep === 1 && <Mail size={20} />}
                {forgotStep === 2 && <KeyRound size={20} />}
                {forgotStep === 3 && <ShieldCheck size={20} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                  {forgotStep === 1 && 'Reset Password'}
                  {forgotStep === 2 && 'Enter Verification Code'}
                  {forgotStep === 3 && 'Password Reset Complete'}
                </h3>
                <span style={{ fontSize: '11px', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  {forgotStep === 1 && 'Step 1: Brevo OTP Dispatch'}
                  {forgotStep === 2 && 'Step 2: Security Validation'}
                  {forgotStep === 3 && 'Step 3: Ready to Sign In'}
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {forgotError && (
              <div className="auth-alert" style={{ marginBottom: '16px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px' }}>{forgotError}</span>
              </div>
            )}

            {/* Success / Status Banner */}
            {forgotSuccessMsg && forgotStep !== 3 && (
              <div className="auth-alert success" style={{ marginBottom: '16px' }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px' }}>{forgotSuccessMsg}</span>
              </div>
            )}

            {/* ================= STEP 1: REQUEST OTP ================= */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp}>
                <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  Enter your registered username or email. We will dispatch a 6-digit one-time verification code via <strong>Brevo Email Security</strong>.
                </p>

                <div className="auth-field" style={{ marginBottom: '18px' }}>
                  <label className="auth-label" htmlFor="forgot-identifier">
                    Account Email or Username
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Mail size={17} />
                    </span>
                    <input
                      id="forgot-identifier"
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. admin@zentradigital.com or admin"
                      className="auth-input"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotIdentifier.trim()}
                  className="auth-submit-btn"
                  style={{ height: '44px', fontSize: '13.5px' }}
                >
                  {forgotLoading ? (
                    <>
                      <div className="auth-spinner" />
                      <span>Dispatching Code via Brevo...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================= STEP 2: VERIFY OTP & RESET ================= */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetWithOtp}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid #27272A',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: '#D4D4D8',
                  lineHeight: 1.5
                }}>
                  Verification code dispatched to <strong style={{ color: '#FFFFFF' }}>{maskedEmail}</strong>. Valid for 10 minutes.
                </div>

                {devOtpNotice && (
                  <div style={{
                    background: 'rgba(229, 9, 20, 0.1)',
                    border: '1px solid rgba(229, 9, 20, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    color: '#FCA5A5',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Info size={14} color="#E50914" />
                    <span>{devOtpNotice}</span>
                  </div>
                )}

                {/* 6-Digit OTP Box */}
                <div className="auth-field" style={{ marginBottom: '16px' }}>
                  <label className="auth-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="auth-otp-input"
                    autoFocus
                    required
                  />
                </div>

                {/* New Password */}
                <div className="auth-field" style={{ marginBottom: '14px' }}>
                  <label className="auth-label" htmlFor="forgot-new-pwd">
                    New Password
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Lock size={17} />
                    </span>
                    <input
                      id="forgot-new-pwd"
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="auth-input"
                    />
                    <button
                      type="button"
                      className="auth-input-action"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    >
                      {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="auth-field" style={{ marginBottom: '16px' }}>
                  <label className="auth-label" htmlFor="forgot-confirm-pwd">
                    Confirm New Password
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Lock size={17} />
                    </span>
                    <input
                      id="forgot-confirm-pwd"
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      className="auth-input"
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={forgotLoading || forgotOtp.length !== 6 || !forgotNewPassword}
                  className="auth-submit-btn"
                  style={{ height: '44px', fontSize: '13.5px' }}
                >
                  {forgotLoading ? (
                    <>
                      <div className="auth-spinner" />
                      <span>Validating Code & Resetting...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code & Reset Password</span>
                      <Check size={16} />
                    </>
                  )}
                </button>

                {/* Resend and Navigation Row */}
                <div className="auth-resend-row">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccessMsg('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', padding: 0 }}
                  >
                    ← Change Account
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || forgotLoading}
                    onClick={handleResendOtp}
                    className="auth-resend-btn"
                  >
                    {resendCooldown > 0 ? (
                      `Resend code in ${resendCooldown}s`
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        <span>Resend Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 3: SUCCESS ================= */}
            {forgotStep === 3 && (
              <div style={{ textAlign: 'center', padding: '10px 0 6px 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <CheckCircle2 size={32} />
                </div>

                <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>
                  Password Reset Successfully!
                </h4>

                <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Your password has been securely updated. Your credentials have been pre-filled on the login screen.
                </p>

                <button
                  type="button"
                  onClick={handleCloseForgotModal}
                  className="auth-submit-btn"
                  style={{ height: '44px', fontSize: '13.5px' }}
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

