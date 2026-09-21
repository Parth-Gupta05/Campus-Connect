import React, { useState, useContext, useEffect } from 'react';
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
  UserCheck,
  Check,
  Edit2,
  X
} from 'lucide-react';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import BrandLogo from '../components/BrandLogo';
import { parseUID, generateUID, BRANCHES, calculateYearFromSem } from '../utils/uidUtils';

export default function SignUp() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // UID Verification State
  const [uidVerified, setUidVerified] = useState(false);
  const [showUidModal, setShowUidModal] = useState(false);
  const [isEditingUid, setIsEditingUid] = useState(false);
  const [parsedProfileData, setParsedProfileData] = useState(null);

  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const { showToast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'club') navigate('/club');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const [verifiedUid, setVerifiedUid] = useState(null);

  React.useEffect(() => {
    if (uidVerified && identifier !== verifiedUid) setUidVerified(false);
  }, [identifier, verifiedUid]);

  const handleVerifyUID = () => {
    const trimmedIdentifier = identifier.trim();
    if (trimmedIdentifier.includes('@')) return;
    const match = trimmedIdentifier.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
    if (!match) {
      setError('Invalid UID format. Expected format: 23-COMPA10-27');
      return;
    }
    const data = parseUID(trimmedIdentifier);
    if (data) {
      setParsedProfileData(data);
      setIsEditingUid(false);
      setShowUidModal(true);
      setError('');
    }
  };

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
      if (!uidVerified) {
        setError('Please click "Verify UID" to confirm your details before creating an account.');
        return;
      }
    }

    setLoading(true);

    try {
      await axios.post('/auth/register', {
        identifier: trimmedIdentifier,
        password,
        role: 'student',
        profileData: uidVerified ? parsedProfileData : null
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(1000px,100vw)] h-[min(750px,80vh)] geist-auth-glow pointer-events-none -z-0" />

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
              <BrandLogo className="inline-flex h-9 w-9 mb-4" />
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
              <div className="relative">
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
                  rightElement={
                    identifier && /^\d{2}-/.test(identifier) && (
                      uidVerified ? (
                        <div className="flex items-center text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded text-xs font-semibold gap-1 border border-emerald-500/20 mr-1 mt-0.5 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyUID}
                          className="text-xs font-semibold bg-gray-1000 text-background-100 px-3 py-1.5 rounded hover:opacity-90 transition-opacity mr-1 mt-0.5 whitespace-nowrap cursor-pointer"
                        >
                          Verify UID
                        </button>
                      )
                    )
                  }
                />
              </div>

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

      {/* UID Verification Modal */}
      {showUidModal && parsedProfileData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                  UID Verification
                </span>
                <h3 className="text-lg font-bold text-gray-1000 mt-1">Verify Your Details</h3>
                <p className="text-xs text-gray-600 mt-1">We extracted this information from your UID. Is this correct?</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUidModal(false)}
                className="p-1 text-gray-600 hover:text-gray-1000 rounded hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditingUid ? (
              <div className="space-y-4 pt-2 relative z-10">
                <div>
                  <label className="block text-xs font-semibold text-gray-1000 mb-1">Branch</label>
                  <select 
                    value={parsedProfileData.branch}
                    onChange={(e) => setParsedProfileData({...parsedProfileData, branch: e.target.value})}
                    className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                  >
                    {BRANCHES.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-1000 mb-1">Semester</label>
                    <select
                      value={parsedProfileData.currentSem}
                      onChange={(e) => {
                        const sem = parseInt(e.target.value);
                        setParsedProfileData({...parsedProfileData, currentSem: sem, currentYear: calculateYearFromSem(sem)});
                      }}
                      className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                    >
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-1000 mb-1">Division</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={parsedProfileData.division}
                      onChange={(e) => setParsedProfileData({...parsedProfileData, division: e.target.value.toUpperCase().replace(/[^A-Z]/g, '')})}
                      className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 uppercase focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-1000 mb-1">Roll Number</label>
                  <input
                    type="number"
                    value={parsedProfileData.rollNo}
                    onChange={(e) => setParsedProfileData({...parsedProfileData, rollNo: e.target.value})}
                    className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-background-200 rounded-xl border border-gray-400 p-4 space-y-3 relative z-10 shadow-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Branch</span>
                  <span className="text-sm font-semibold text-gray-1000">{parsedProfileData.branch}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Semester</span>
                    <span className="text-sm font-medium text-gray-1000">Sem {parsedProfileData.currentSem}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Division</span>
                    <span className="text-sm font-medium text-gray-1000">Div {parsedProfileData.division}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Roll No</span>
                    <span className="text-sm font-medium text-gray-1000">{parsedProfileData.rollNo}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-400 relative z-10">
              {isEditingUid ? (
                <button
                  type="button"
                  onClick={() => setIsEditingUid(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
                >
                  Cancel Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingUid(true)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-1000 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-gray-400"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>No, let me edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const newUid = generateUID(parsedProfileData);
                  setIdentifier(newUid);
                  setVerifiedUid(newUid);
                  setUidVerified(true);
                  setShowUidModal(false);
                }}
                className="px-5 py-2 text-xs font-semibold bg-gray-1000 text-background-100 hover:opacity-90 rounded-md transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isEditingUid ? 'Save & Confirm' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
