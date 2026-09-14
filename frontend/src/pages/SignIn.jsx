import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (showForgotModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showForgotModal]);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [cooldown, setCooldown] = useState(0);
  const [loadingForgot, setLoadingForgot] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return showToast('Please enter your email', 'error');
    setLoadingForgot(true);
    try {
      await axios.post('/auth/forgot-password', { email: forgotEmail });
      showToast('OTP sent to your email', 'success');
      setForgotStep(2);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length !== 6) {
      return showToast('Please enter a valid 6-digit OTP', 'error');
    }
    setLoadingForgot(true);
    try {
      await axios.post('/auth/verify-otp', { email: forgotEmail, otp: forgotOtp });
      showToast('OTP verified successfully', 'success');
      setForgotStep(3);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return showToast('Passwords do not match', 'error');
    }
    setLoadingForgot(true);
    try {
      await axios.post('/auth/reset-password', { email: forgotEmail, otp: forgotOtp, newPassword });
      showToast('Password reset successfully. You can now sign in.', 'success');
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password, rememberMe);
      showToast('Signed in successfully', 'success');
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'club') navigate('/club');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-200 text-gray-1000 flex flex-col justify-between selection:bg-gray-1000 selection:text-background-100 transition-colors duration-200 geist-bg-grid relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[750px] max-w-none geist-auth-glow pointer-events-none -z-0" />

      {/* Top Header Bar */}
      <header className="h-14 border-b border-gray-400 bg-background-100/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-medium text-gray-900 hover:text-gray-1000 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campus Connect</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher small />
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto z-10">
        <div className="w-full max-w-[420px]">
          {/* Card Container (Geist material-medium: 12px radius, 1px border, specular top highlight) */}
          <div className="geist-specular-card rounded-xl border border-gray-400 bg-background-100/95 backdrop-blur-md p-8 sm:p-10 shadow-2xl transition-colors">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-1000 text-background-100 shadow-sm mb-4">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                  <path d="M8 1L15 13.5H1L8 1Z" />
                </svg>
              </div>
              <h1 className="text-heading-24 font-bold text-gray-1000 tracking-tight">
                Sign in to Campus Connect
              </h1>
              <p className="text-xs text-gray-900 mt-1.5 leading-relaxed">
                Access your verified academic and placement portfolio.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md border border-red-700/40 bg-red-700/10 p-3 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="identifier"
                label="Email or University UID"
                type="text"
                required
                icon={Mail}
                placeholder="e.g. 23-COMPA10-27 or student@campus.edu"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                size="lg"
              />

              <div>
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  icon={Lock}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="lg"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-700 hover:text-gray-1000 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-gray-900 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-400 text-gray-1000 focus:ring-blue-700 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full justify-center"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Switch to Sign Up */}
            <div className="mt-8 pt-6 border-t border-gray-400 text-center text-xs text-gray-900">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-700 font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </div>

          {/* Security Subtext */}
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-gray-700 font-mono">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>TLS 1.3 Encryption</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
              <span>University Verified Auth</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Minimal Footer */}
      <footer className="h-12 border-t border-gray-400 px-6 flex items-center justify-between text-[11px] text-gray-700 font-mono">
        <span>© 2026 Campus Connect Inc.</span>
        <span>Secure Session</span>
      </footer>

      {/* ===================================================================
          FORGOT PASSWORD MODAL (Geist material-modal)
          =================================================================== */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotModal(false);
              setForgotStep(1);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-gray-400 bg-background-100 p-6 sm:p-8 shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep(1);
                setForgotEmail('');
                setForgotOtp('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-700 hover:text-gray-1000 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-blue-700 mb-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Account Recovery • Step {forgotStep} of 3</span>
              </div>
              <h2 className="text-heading-20 font-bold text-gray-1000 tracking-tight">
                {forgotStep === 1 && 'Reset Your Password'}
                {forgotStep === 2 && 'Enter Verification Code'}
                {forgotStep === 3 && 'Choose New Password'}
              </h2>
              <p className="text-xs text-gray-900 mt-1">
                {forgotStep === 1 && 'Enter your registered university email to receive a 6-digit OTP.'}
                {forgotStep === 2 && `We sent a 6-digit one-time passcode to ${forgotEmail}.`}
                {forgotStep === 3 && 'Set a strong password for your Campus Connect account.'}
              </p>
            </div>

            {/* Step 1: Request OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  size="lg"
                />
                <Button
                  type="submit"
                  size="lg"
                  loading={loadingForgot}
                  className="w-full justify-center"
                >
                  Send Verification Code
                </Button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  label="6-Digit OTP Code"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="font-mono tracking-widest text-center text-lg"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                  size="lg"
                />
                <div className="flex items-center justify-between text-xs text-gray-900">
                  <span>Didn't receive the code?</span>
                  {cooldown > 0 ? (
                    <span className="font-mono text-gray-700">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-blue-700 hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  loading={loadingForgot}
                  className="w-full justify-center"
                >
                  Verify Code
                </Button>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size="lg"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  size="lg"
                />
                <Button
                  type="submit"
                  size="lg"
                  loading={loadingForgot}
                  className="w-full justify-center"
                >
                  Update Password
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
