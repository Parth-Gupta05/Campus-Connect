import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignUp() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedIdentifier = identifier.trim();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!trimmedIdentifier.includes('@')) {
      const match = trimmedIdentifier.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
      if (!match) {
        setError('Invalid UID format. Expected format: 23-COMPA10-27');
        return;
      }
    }

    setLoading(true);

    try {
      await axios.post('/auth/register', {
        identifier: trimmedIdentifier,
        password,
        role: 'student'
      });

      await login(trimmedIdentifier, password, false);
      showToast('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to create account. Please verify your details and try again.'
      );
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
          {/* Card Container (Geist material-medium: 12px radius, 1px border, specular highlight) */}
          <div className="geist-specular-card rounded-xl border border-gray-400 bg-background-100/95 backdrop-blur-md p-8 sm:p-10 shadow-2xl transition-colors">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-1000 text-background-100 shadow-sm mb-4">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                  <path d="M8 1L15 13.5H1L8 1Z" />
                </svg>
              </div>
              <h1 className="text-heading-24 font-bold text-gray-1000 tracking-tight">
                Create an account
              </h1>
              <p className="text-xs text-gray-900 mt-1.5 leading-relaxed">
                Start building your verified digital campus identity.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md border border-red-700/40 bg-red-700/10 p-3 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Sign Up Form */}
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
                helperText="Use your institutional email or registered UID format."
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

              <div>
                <Input
                  id="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  icon={Lock}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size="lg"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-700 hover:text-gray-1000 transition-colors p-1"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full justify-center"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Terms Disclaimer */}
            <p className="mt-4 text-center text-[11px] text-gray-700 leading-relaxed">
              By creating an account, you agree to the Campus Connect Terms of Service and Privacy Policy.
            </p>

            {/* Switch to Sign In */}
            <div className="mt-6 pt-6 border-t border-gray-400 text-center text-xs text-gray-900">
              Already have an account?{' '}
              <Link to="/signin" className="text-blue-700 font-medium hover:underline">
                Sign in
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
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Verified Student Roll</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Minimal Footer */}
      <footer className="h-12 border-t border-gray-400 px-6 flex items-center justify-between text-[11px] text-gray-700 font-mono">
        <span>© 2026 Campus Connect Inc.</span>
        <span>Secure Registration</span>
      </footer>
    </div>
  );
}
